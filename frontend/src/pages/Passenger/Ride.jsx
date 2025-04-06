
import { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft, FaInfoCircle, FaSun, FaMoon, FaCar, FaEye, FaTimes,   FaRoute, } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import im from "../../assets/Board Cover.jpg";
import im2 from "../../assets/Car rental logo_ 12_667 fotos e imagens stock livres de direitos _ Shutterstock.jpg";
import im3 from "../../assets/download.jpg";
import { FaPhone } from 'react-icons/fa';


function Ride() {
  const [rideForm, setRideForm] = useState({
    pickupAddress: "",
    destinationAddress: "",
    distance: "",
    calculatedPrice: "",
    desiredPrice: "",
    passengerNum: "",
    rideOption: "economy",
    paymentMethod: "",
  });
  const [showMap, setShowMap] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const [rideProgress, setRideProgress] = useState(0);
  const [rideStatus, setRideStatus] = useState('');
  const [driverDetails, setDriverDetails] = useState(null);
  const [eta, setEta] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [deliveryId, setDeliveryId] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isCreatingRide, setIsCreatingRide] = useState(false);
  const [passenger, setPassenger] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passengerId, setPassengerId] = useState('');
  const [theme, setTheme] = useState('dark');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showFeatures, setShowFeatures] = useState({ economy: false, premium: false, shared: false });
  const [interestedDrivers, setInterestedDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Initialize Socket.io
  const socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    autoConnect: false,
  });


      const navItems = [
      
        ...(rideStarted ? [{ id: 'city', label: 'Track Ride', icon: FaRoute, onClick: () => navigate(`/ride-tracking/${deliveryId}`) }] : []),
      ];

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Fetch current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'e_RideProject/1.0' } }
            );
            const data = await response.json();
            setRideForm((prev) => ({ ...prev, pickupAddress: data.display_name || 'Current Location' }));
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            setRideForm((prev) => ({ ...prev, pickupAddress: 'Current Location' }));
          }
        },
        (error) => {
          console.error("Location access denied:", error.message);
          setRideForm((prev) => ({ ...prev, pickupAddress: 'Unable to fetch location' }));
        }
      );
    }
  }, []);

  // Fetch profile
  useEffect(() => {
    const fetchMyProfile = async () => {
      if (!token) {
        toast.error('Please log in to access the dashboard', { style: { background: '#F44336', color: 'white' } });
        navigate('/plogin');
        return;
      }
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status) {
          setData(response.data);
          setPassengerId(response.data._id);
          setPassenger(response.data);
          toast.success('Book a ride with ease', { style: { background: '#4CAF50', color: 'white' } });
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'An error occurred';
        toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/plogin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, [navigate]);

  // Fetch nearby drivers
  useEffect(() => {
    const fetchNearbyDrivers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/nearby`);
        setNearbyDrivers(response.data);
      } catch (error) {
        console.error('Error fetching nearby drivers:', error);
      }
    };
    fetchNearbyDrivers();
  }, []);

  // Connect to WebSocket and listen for real-time updates
  useEffect(() => {
    if (!token || !deliveryId) return;

    socket.connect();
    socket.emit('joinRide', deliveryId);

    // Handle driver negotiation
    socket.on('driverNegotiated', (driver) => {
      setInterestedDrivers((prev) => {
        const exists = prev.find(d => d._id === driver._id);
        if (exists) {
          return prev.map(d => d._id === driver._id ? driver : d);
        }
        return [...prev, driver];
      });
      toast.info(`${driver.firstName} has proposed a price of ₦${driver.driverProposedPrice}`, {
        style: { background: '#2196F3', color: 'white' }
      });
    });

    // Handle driver acceptance (initial proposal from driver)
    socket.on('driverAccepted', (data) => {
      const { driver } = data;
      setSelectedDriver({
        _id: driver._id,
        firstName: driver.firstName,
        carDetails: {
          model: driver.carDetails.model,
          year: driver.carDetails.year,
          plateNumber: driver.carDetails.plateNumber,
        },
        distance: driver.distance || 'Calculating...',
        driverProposedPrice: driver.driverProposedPrice || rideForm.calculatedPrice,
        rating: driver.rating || 'N/A',
      });
      setShowDriverModal(true); // Show modal for passenger to accept/reject
      toast.info(`${driver.firstName} has accepted your ride request`, {
        style: { background: '#2196F3', color: 'white' }
      });
    });

    // Handle passenger confirmation (ride officially starts)
    socket.on('rideConfirmed', (data) => {
      const { driver } = data;
      setDriverDetails({
        name: driver.firstName,
        car: `${driver.carDetails.model} (${driver.carDetails.year})`,
        licensePlate: driver.carDetails.plateNumber,
        distance: driver.distance || 'Calculating...',
        driverProposedPrice: driver.driverProposedPrice || rideForm.calculatedPrice,
      });
      setRideStarted(true);
      setEta('5 minutes');
      setInterestedDrivers([]);
      setShowDriverModal(false);
      toast.success(`${driver.firstName} has been assigned to your ride`, {
        style: { background: '#4CAF50', color: 'white' }
      });
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [deliveryId, token]);

  // Simulate ride progress
  useEffect(() => {
    if (!rideStarted || !deliveryId) return;
    const interval = setInterval(() => {
      setRideProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRideStatus('Ride completed');
          toast.success('Ride completed');
          axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/status`, { status: 'completed' });
          return 100;
        }
        const newProgress = prev + 2;
        if (newProgress < 50) setRideStatus('Driver is on the way');
        else if (newProgress === 50) setRideStatus('Driver has arrived');
        else setRideStatus('Ride in progress');
        return newProgress;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [rideStarted, deliveryId]);

  // Fetch ride history
  useEffect(() => {
    if (!passengerId) return;
    const fetchRideHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/passenger/${passengerId}`);
        setRideHistory(response.data);
      } catch (error) {
        console.error('Error fetching ride history:', error);
      }
    };
    fetchRideHistory();
  }, [rideStatus, passengerId]);

  const calculateDistanceAndFare = async () => {
    if (!rideForm.pickupAddress || !rideForm.destinationAddress) {
      toast.error("Please enter pickup and destination addresses", { style: { background: "#F44336", color: "white" } });
      return;
    }
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/calculate-fare`, {
        pickupAddress: rideForm.pickupAddress,
        destinationAddress: rideForm.destinationAddress,
      });
      let { distance, price } = response.data;
      if (rideForm.rideOption === 'premium') price *= 1.5;
      if (rideForm.rideOption === 'shared') price *= 0.7;
      setRideForm((prev) => ({
        ...prev,
        distance,
        calculatedPrice: price,
      }));
      setEta('5 minutes');
      setShowMap(true);
    } catch (error) {
      toast.error("Error calculating fare", { style: { background: "#F44336", color: "white" } });
      console.error('Error calculating fare:', error.response?.data || error);
      setRideForm((prev) => ({ ...prev, distance: "", calculatedPrice: "" }));
    }
  };

  const handleRideSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please log in to book a ride", { style: { background: "#F44336", color: "white" } });
      navigate("/plogin");
      return;
    }
    if (!rideForm.distance || !rideForm.calculatedPrice || !rideForm.paymentMethod || !rideForm.rideOption) {
      toast.error("Please calculate fare and select all required fields", { style: { background: "#F44336", color: "white" } });
      return;
    }
    if (isCreatingRide) return;

    setIsCreatingRide(true);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/create`,
        {
          pickupAddress: rideForm.pickupAddress,
          destinationAddress: rideForm.destinationAddress,
          distance: rideForm.distance,
          passengerNum: rideForm.passengerNum,
          calculatedPrice: rideForm.calculatedPrice,
          desiredPrice: rideForm.desiredPrice || null,
          rideOption: rideForm.rideOption,
          paymentMethod: rideForm.paymentMethod,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeliveryId(response.data._id);
      setShowMap(true);
      toast.success("Ride request created successfully", { style: { background: "#4CAF50", color: "white" } });
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to create ride request";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    } finally {
      setLoading(false);
      setIsCreatingRide(false);
    }
  };

  // const handleAcceptDriver = async (driverId) => {
  //   try {
  //     setLoading(true);
  //     const response = await axios.post(
  //       `${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/confirm-driver`,
  //       { driverId },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     const { driver } = response.data;
  //     setDriverDetails({
  //       name: driver.firstName,
  //       car: `${driver.carDetails.model} (${driver.carDetails.year})`,
  //       licensePlate: driver.carDetails.plateNumber,
  //       distance: driver.distance || 'Calculating...',
  //       driverProposedPrice: driver.driverProposedPrice || rideForm.calculatedPrice,
  //     });
  //     setRideStarted(true);
  //     setEta('5 minutes');
  //     setShowDriverModal(false);
  //     setInterestedDrivers([]);
  //     toast.success("Driver confirmed successfully", { style: { background: "#4CAF50", color: "white" } });
  //   } catch (error) {
  //     console.log(error)
  //     const errorMessage = error.response?.data?.error || "Failed to confirm driver";
  //     toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  const handleAcceptDriver = async (driverId) => {
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/confirm-driver`,
        { driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    
      toast.success('Driver confirmed successfully', { style: { background: '#4CAF50', color: 'white' } });
    } catch (error) {
      console.error('Error confirming driver:', error);
      const errorMessage = error.response?.data?.error || 'Failed to confirm driver';
      toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDriver = async (driverId) => {
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/reject-driver`,
        { driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.info('Driver proposal rejected', { style: { background: '#2196F3', color: 'white' } });
    } catch (error) {
      console.error('Error rejecting driver:', error);
      const errorMessage = error.response?.data?.error || 'Failed to reject driver';
      toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    if (!token || !deliveryId) return;
  
    socket.connect();
    socket.emit('joinRide', deliveryId);
  
    socket.on('driverOfferRejected', (data) => {
      console.log('Driver offer rejected:', data);
      setInterestedDrivers((prev) => prev.filter((d) => d._id !== data.driverId));
      setShowDriverModal(false);
      setSelectedDriver(null);
    });
  
    // ... (other listeners like driverNegotiated, rideConfirmed)
  
    return () => socket.disconnect();
  }, [deliveryId, token]);

  const handleCancelRide = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRideStarted(false);
      setDriverDetails(null);
      setDeliveryId(null);
      setRideProgress(0);
      setRideStatus('');
      setInterestedDrivers([]);
      toast.success("Ride cancelled successfully", { style: { background: "#4CAF50", color: "white" } });
    } catch (error) {
      console.log(error)
      const errorMessage = error.response?.data?.error || "Failed to cancel ride";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    } finally {
      setLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !rideStarted) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/chat`, {
        sender: 'passenger',
        text: newMessage,
      });
      setChatMessages([...chatMessages, { sender: 'passenger', text: newMessage }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending chat message:', error);
    }
  };




  useEffect(() => {
    if (!token || !deliveryId) return;
  
    socket.connect(); // Connect when deliveryId is available
    socket.emit('joinRide', deliveryId); // Join the ride-specific room
  
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
  
    socket.on('driverNegotiated', (driver) => {
      console.log('Driver negotiated:', driver);
      setInterestedDrivers((prev) => {
        const exists = prev.find((d) => d._id === driver._id);
        if (exists) {
          return prev.map((d) => (d._id === driver._id ? driver : d));
        }
        return [...prev, driver];
      });
      toast.info(`${driver.firstName} has proposed a price of ₦${driver.driverProposedPrice}`, {
        style: { background: '#2196F3', color: 'white' },
      });
    });
  
    socket.on('driverAccepted', (data) => {
      console.log('Driver accepted:', data);
      const { driver } = data;
      setSelectedDriver({
        _id: driver._id,
        firstName: driver.firstName,
        carDetails: {
          model: driver.carDetails.model,
          year: driver.carDetails.year,
          plateNumber: driver.carDetails.plateNumber,
        },
        distance: driver.distance || 'Calculating...',
        driverProposedPrice: driver.driverProposedPrice || rideForm.calculatedPrice,
        rating: driver.rating || 'N/A',
      });
      setShowDriverModal(true);
      toast.info(`${driver.firstName} has accepted your ride request`, {
        style: { background: '#2196F3', color: 'white' },
      });
    });
  
    socket.on('rideConfirmed', (data) => {
      console.log('Ride confirmed:', data);
      const { driver } = data;
      setDriverDetails({
        name: driver.firstName,
        car: `${driver.carDetails.model} (${driver.carDetails.year})`,
        licensePlate: driver.carDetails.plateNumber,
        distance: driver.distance || 'Calculating...',
        driverProposedPrice: driver.driverProposedPrice || rideForm.calculatedPrice,
      });
      setRideStarted(true);
      setEta('5 minutes');
      setInterestedDrivers([]);
      setShowDriverModal(false);
      toast.success(`${driver.firstName} has been assigned to your ride`, {
        style: { background: '#4CAF50', color: 'white' },
      });
    });
  
    // Cleanup
    return () => {
      socket.disconnect();
      console.log('Socket disconnected');
    };
  }, [deliveryId, token]);

  const submitRatingAndReview = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/rate`, { rating, review });
      toast.success('Rating and review submitted');
    } catch (error) {
      console.error('Error submitting rating/review:', error);
    }
  };

  const mapUrl = showMap
    ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(rideForm.pickupAddress)}&destination=${encodeURIComponent(rideForm.destinationAddress)}&mode=driving`
    : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=${currentLocation?.lat || 0},${currentLocation?.lng || 0}&zoom=15`;

  const toggleFeatures = (option) => setShowFeatures((prev) => ({ ...prev, [option]: !prev[option] }));

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <div className="flex items-center space-x-2">
          <button onClick={toggleTheme} className="text-gray-600 hover:text-gray-800">
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} className="text-white" />}
          </button>
        </div>
        <button onClick={() => setShowProfile(!showProfile)}>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            {passenger?.profilePicture && <img src={passenger.profilePicture} alt="Profile" className="w-full h-full object-cover" />}
          </div>
        </button>
      </header>

      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <button onClick={() => setShowProfile(false)} className={theme === 'light' ? 'text-green-600 mb-4' : 'text-green-400 mb-4'}>Close</button>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Profile</h2>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Name: {passenger?.name || 'James'}</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Email: {passenger?.userEmail || 'james@example.com'}</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Phone: {passenger?.phoneNumber}</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Location: {passenger?.location?.state}, {passenger?.location?.lga}</p>
            {passenger?.question && <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Status: {passenger.question}</p>}
            {passenger?.schoolIdUrl && (
              <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                School ID: <a href={passenger.schoolIdUrl} target="_blank" rel="noopener noreferrer" className={theme === 'light' ? 'text-blue-600' : 'text-blue-400'}>View</a>
              </p>
            )}
            <h3 className={`text-lg font-semibold mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride History</h3>
            {rideHistory.length > 0 ? (
              <ul className="space-y-2">
                {rideHistory.map((ride, index) => (
                  <li key={index} className={`border p-2 rounded-lg ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>From: {ride.pickupAddress}</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>To: {ride.destinationAddress}</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Distance: {ride.distance} km</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Price: ₦{ride.calculatedPrice}</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Date: {new Date(ride.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>No rides yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <button onClick={() => setShowDriverModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <FaTimes size={20} />
            </button>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Driver Proposal</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mr-3">
                  <FaCar size={24} />
                </div>
                <div>
                <div className="flex items-center space-x-4">
                                  <img
                                    className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                                    src={selectedDriver?.profilePicture || "https://via.placeholder.com/150"}
                                    alt={`${selectedDriver.userId?.firstName} ${selectedDriver.userId?.lastName}`}
                                  />
                                  <button
                                    onClick={() =>
                                      window.open(
                                        selectedDriver?.profilePicture || "https://via.placeholder.com/150",
                                        "_blank"
                                      )
                                    }
                                    className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                                  >
                                    View
                                  </button>
                                </div>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{selectedDriver.firstName} {selectedDriver.lastName}</p>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{selectedDriver.email}</p>
                                 <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                 
                        <a
                          href={`tel:${selectedDriver?.phoneNumber}`}
                          className="inline-flex items-center text-green-300 hover:text-green-400 transition-colors"
                          title={`Call ${selectedDriver?.phoneNumber}`}
                        >
                          <FaPhone className="mr-2" /> 
                          <span className="font-bold">{selectedDriver?.phoneNumber || 'N/A'}</span>
                        </a>
                      </p>
                             
                  <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                    {selectedDriver.carDetails.model} ({selectedDriver.carDetails.year})
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                                  <img
                                    className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                                    src={selectedDriver?.carPicture || "https://via.placeholder.com/150"}
                                    alt={`${selectedDriver.userId?.firstName} ${selectedDriver.userId?.lastName}`}
                                  />
                                  <button
                                    onClick={() =>
                                      window.open(
                                        selectedDriver?.carPicture || "https://via.placeholder.com/150",
                                        "_blank"
                                      )
                                    }
                                    className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                                  >
                                    View
                                  </button>
                                </div>
              <div className={`grid grid-cols-2 gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <p className="text-sm">License Plate:</p>
                <p className="text-sm font-medium">{selectedDriver.carDetails.plateNumber}</p>
                <p className="text-sm">car model:</p>
                <p className="text-sm font-medium">{selectedDriver.carDetails.model}</p>
                <p className="text-sm">car color:</p>
                <p className="text-sm font-medium">{selectedDriver.carDetails.color}</p>
                <p className="text-sm">Distance:</p>
                <p className="text-sm font-medium">{selectedDriver.distance || 'Unknown'}</p>
                <p className="text-sm">Rating:</p>
                <p className="text-sm font-medium">{selectedDriver.rating || 'N/A'}</p>
              </div>
              <div className={`mt-4 p-3 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-600'}`}>
                <h3 className="text-base font-semibold mb-2">Price Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">System Calculated:</span>
                    <span>₦{rideForm.calculatedPrice}</span>
                  </div>
                  {rideForm.desiredPrice && (
                    <div className="flex justify-between">
                      <span className="text-sm">Your Offered Price:</span>
                      <span>₦{rideForm.desiredPrice}</span>
                    </div>
                  )}
                  {selectedDriver.driverProposedPrice && (
                    <div className="flex justify-between">
                      <span className="text-sm">Driver's Price:</span>
                      <span>₦{selectedDriver.driverProposedPrice}</span>
                    </div>
                  )}
                  <div className={`flex justify-between pt-2 mt-2 border-t ${theme === 'light' ? 'border-gray-300' : 'border-gray-500'}`}>
                    <span className="font-medium">Final Price:</span>
                    <span className={`font-bold ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                      ₦{selectedDriver.driverProposedPrice || rideForm.desiredPrice || rideForm.calculatedPrice}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptDriver(selectedDriver._id)}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Accept Driver'}
                </button>
                <button
                  onClick={() => handleRejectDriver(selectedDriver._id)}
                  className="flex-1 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Reject Driver'}
                </button>

                {rideStarted && (
        <button
          onClick={() => navigate(`/ride-tracking/${deliveryId}`)}
          className="mt-2 py-2 bg-blue-600 text-white rounded-lg w-full"
        >
          Track Ride
        </button>
      )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Book A Ride</h3>
          <form onSubmit={handleRideSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Pickup Address</label>
              <Autocomplete
                apiKey={googleMapsApiKey}
                onPlaceSelected={(place) => {
                  if (place?.formatted_address) setRideForm((prev) => ({ ...prev, pickupAddress: place.formatted_address }));
                }}
                options={{ types: ['geocode'], componentRestrictions: { country: 'ng' } }}
                value={rideForm.pickupAddress}
                onChange={(e) => setRideForm((prev) => ({ ...prev, pickupAddress: e.target.value }))}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter pickup location"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Destination Address</label>
              <Autocomplete
                apiKey={googleMapsApiKey}
                onPlaceSelected={(place) => {
                  if (place?.formatted_address) setRideForm((prev) => ({ ...prev, destinationAddress: place.formatted_address }));
                }}
                options={{ types: ['geocode'], componentRestrictions: { country: 'ng' } }}
                value={rideForm.destinationAddress}
                onChange={(e) => setRideForm((prev) => ({ ...prev, destinationAddress: e.target.value }))}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter destination"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Ride Option</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${rideForm.rideOption === 'economy' ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
                  onClick={() => setRideForm((prev) => ({ ...prev, rideOption: 'economy' }))}
                >
                  <img src={im} alt="Economy Car" className="w-full h-24 object-cover rounded-lg mb-2" />
                  <p className={`text-center font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Economy</p>
                  <button onClick={(e) => { e.stopPropagation(); toggleFeatures('economy'); }} className={`flex items-center justify-center w-full mt-2 text-sm ${theme === 'light' ? 'text-green-600' : 'text-customPink'}`}>
                    <FaInfoCircle className="mr-1" /> See More
                  </button>
                  {showFeatures.economy && (
                    <ul className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      <li>- Affordable pricing</li>
                      <li>- Standard delivery time</li>
                      <li>- Basic vehicle</li>
                    </ul>
                  )}
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${rideForm.rideOption === 'premium' ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
                  onClick={() => setRideForm((prev) => ({ ...prev, rideOption: 'premium' }))}
                >
                  <img src={im2} alt="Premium Car" className="w-full h-24 object-cover rounded-lg mb-2" />
                  <p className={`text-center font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Premium</p>
                  <button onClick={(e) => { e.stopPropagation(); toggleFeatures('premium'); }} className={`flex items-center justify-center w-full mt-2 text-sm ${theme === 'light' ? 'text-green-600' : 'text-customPink'}`}>
                    <FaInfoCircle className="mr-1" /> See More
                  </button>
                  {showFeatures.premium && (
                    <ul className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      <li>- Higher price</li>
                      <li>- Faster delivery</li>
                      <li>- Luxury vehicle</li>
                    </ul>
                  )}
                </div>
                <div
                  className={`p-4 border rounded-lg cursor-pointer ${rideForm.rideOption === 'shared' ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
                  onClick={() => setRideForm((prev) => ({ ...prev, rideOption: 'shared' }))}
                >
                  <img src={im3} alt="Shared Car" className="w-full h-24 object-cover rounded-lg mb-2" />
                  <p className={`text-center font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Shared</p>
                  <button onClick={(e) => { e.stopPropagation(); toggleFeatures('shared'); }} className={`flex items-center justify-center w-full mt-2 text-sm ${theme === 'light' ? 'text-green-600' : 'text-customPink'}`}>
                    <FaInfoCircle className="mr-1" /> See More
                  </button>
                  {showFeatures.shared && (
                    <ul className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      <li>- Cheapest option</li>
                      <li>- Shared with others</li>
                      <li>- Longer delivery time</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Your Offered Fare (₦)</label>
              <input
                type="number"
                value={rideForm.desiredPrice}
                onChange={(e) => setRideForm((prev) => ({ ...prev, desiredPrice: e.target.value }))}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter your offered fare (optional)"
              />
            </div>


            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>How many passengers</label>
              <input
                type="number"
                value={rideForm.passengerNum}
                onChange={(e) => setRideForm((prev) => ({ ...prev, passengerNum: e.target.value }))}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="number of passengers"
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Payment Method</label>
              <select
                value={rideForm.paymentMethod}
                onChange={(e) => setRideForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>

            <button
              type="button"
              onClick={calculateDistanceAndFare}
              className="w-full py-2 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all"
            >
              Calculate Fare
            </button>

            <div className={`mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
              <p>Distance: {rideForm.distance ? `${rideForm.distance} km` : 'Not calculated'}</p>
              <p>Calculated Price: <span className={`font-bold ${theme === 'light' ? 'text-green-800' : 'text-green-400'}`}>{rideForm.calculatedPrice ? `₦${rideForm.calculatedPrice}` : 'Not calculated'}</span></p>
              {rideForm.desiredPrice && (
                <p>Desired Price: <span className={`font-bold ${theme === 'light' ? 'text-blue-800' : 'text-blue-400'}`}>₦{rideForm.desiredPrice}</span></p>
              )}
            </div>

            {rideForm.distance && rideForm.calculatedPrice && !rideStarted && (
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all mt-2 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Booking...' : 'Book Ride'}
              </button>
            )}

{deliveryId && !rideStarted && (
  <div className="mt-4">
    <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
      Interested Drivers
    </h4>
    {interestedDrivers.length > 0 ? (
      <ul className="space-y-2">
        {interestedDrivers.map((driver) => (
          <li
            key={driver._id}
            className={`p-3 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-gray-700'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className={`font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  {driver.firstName}     {driver.lastName}
                </p>
                <p className={`font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  {driver.email}     
                </p>
                <p className={`font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  {driver.phoneNumber}  
                </p>
                <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                  Distance: {driver.distance || 'Unknown'}
                </p>
                <div className={`mt-2 p-2 rounded ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-600'}`}>
                  <div className="flex justify-between">
                    <span className="text-sm">System Price:</span>
                    <span className="font-medium">₦{rideForm.calculatedPrice}</span>
                  </div>
                  {rideForm.desiredPrice && (
                    <div className="flex justify-between">
                      <span className="text-sm">Your Offer:</span>
                      <span className="font-medium">₦{rideForm.desiredPrice}</span>
                    </div>
                  )}
                  {driver.driverProposedPrice && (
                    <div className="flex justify-between">
                      <span className="text-sm">Driver's Price:</span>
                      <span className={`font-medium ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                        ₦{driver.driverProposedPrice}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between mt-1 pt-1 border-t border-gray-300">
                    <span className="text-sm font-medium">Final Price:</span>
                    <span className={`font-medium ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                      ₦{driver.driverProposedPrice || rideForm.desiredPrice || rideForm.calculatedPrice}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDriver(driver);
                    setShowDriverModal(true);
                  }}
                  className="p-1 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <FaEye className="mr-1" /> Details
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    ) : (
      <p className={`p-4 text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
        Waiting for drivers to respond to your request...
      </p>
    )}
  </div>
)}

            {rideStarted && driverDetails && (
              <div className={`border-t pt-4 mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                <h4 className="text-base font-semibold">Driver Details</h4>
                <p>Name: {driverDetails.name}</p>
                <p>Car: {driverDetails.car}</p>
                <p>License Plate: {driverDetails.licensePlate}</p>
                <p>Distance: {driverDetails.distance}</p>
                <p>ETA: {eta}</p>
                <div className={`mt-3 p-3 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-600'}`}>
                  <h5 className="text-sm font-semibold mb-2">Price Information</h5>
                  <p>Calculated Price: <span className="font-medium">{rideForm.calculatedPrice ? `₦${rideForm.calculatedPrice}` : 'N/A'}</span></p>
                  {rideForm.desiredPrice && (
                    <p>Your Offered Price: <span className="font-medium">₦{rideForm.desiredPrice}</span></p>
                  )}
                  {driverDetails.driverProposedPrice && (
                    <p>Driver's Price: <span className="font-medium">₦{driverDetails.driverProposedPrice}</span></p>
                  )}
                  <p className="mt-2 font-semibold">
                    Final Price: <span className={`${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                      ₦{driverDetails.driverProposedPrice || rideForm.desiredPrice || rideForm.calculatedPrice}
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleCancelRide}
                  className="w-full py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all mt-2"
                  disabled={loading}
                >
                  {loading ? 'Cancelling...' : 'Cancel Ride'}
                </button>
              </div>
            )}

            {rideStarted && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride Status: {rideStatus}</h4>
                <div className={`w-full rounded-full h-2 mt-2 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: `${rideProgress}%` }}></div>
                </div>
              </div>
            )}

            {rideStarted && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Chat with Driver</h4>
                <div className={`border p-2 rounded-lg h-24 overflow-y-auto ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                  {chatMessages.map((msg, index) => (
                    <p key={index} className={msg.sender === 'passenger' ? 'text-right text-blue-600' : `text-left ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
                      {msg.sender === 'passenger' ? 'You' : 'Driver'}: {msg.text}
                    </p>
                  ))}
                </div>
                <div className="flex mt-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className={`flex-1 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                    placeholder="Type a message..."
                  />
                  <button onClick={sendChatMessage} className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg">Send</button>
                </div>
              </div>
            )}

            {rideStatus === 'Ride completed' && !paymentCompleted && (
              <div className="mt-4">
                <button
                  onClick={() => {
                    setPaymentCompleted(true);
                    toast.success(`Payment of ₦${rideForm.calculatedPrice} completed via ${rideForm.paymentMethod}`);
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                >
                  Complete Payment
                </button>
              </div>
            )}

            {paymentCompleted && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Rate and Review Driver</h4>
                <div className="flex items-center space-x-2">
                  <label className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Rating (1-5):</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                    className={`w-16 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                  />
                </div>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className={`w-full p-2 border rounded-lg mt-2 ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                  placeholder="Leave a review (optional)"
                  rows="3"
                />
                <button onClick={submitRatingAndReview} className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all">Submit Rating</button>
              </div>
            )}
          </form>
        </div>

        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          {currentLocation ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
              loading="lazy"
              allowFullScreen
              src={mapUrl}
            />
          ) : (
            <div className={`h-full rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Fetching your location...</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Ride;
