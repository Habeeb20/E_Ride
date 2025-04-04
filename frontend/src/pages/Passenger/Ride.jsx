import { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft, FaInfoCircle, FaSun, FaMoon, FaCar, FaEye, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import im from "../../assets/Board Cover.jpg";
import im2 from "../../assets/Car rental logo_ 12_667 fotos e imagens stock livres de direitos _ Shutterstock.jpg";
import im3 from "../../assets/download.jpg";

function Ride() {
  const [rideForm, setRideForm] = useState({
    pickupAddress: "",
    destinationAddress: "",
    distance: "",
    calculatedPrice: "",
    desiredPrice: "",
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
  const [theme, setTheme] = useState('light');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showFeatures, setShowFeatures] = useState({ economy: false, premium: false, shared: false });
  const [interestedDrivers, setInterestedDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

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

  // Fetch interested drivers
  useEffect(() => {
    if (!deliveryId || rideStarted) return;
    const fetchInterestedDrivers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/interested-drivers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInterestedDrivers(response.data);
      } catch (error) {
        console.error('Error fetching interested drivers:', error);
      }
    };
    fetchInterestedDrivers();
    const interval = setInterval(fetchInterestedDrivers, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, [deliveryId, rideStarted, token]);

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
        calculatedPrice: price, // Keep calculatedPrice independent of desiredPrice
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
          calculatedPrice: rideForm.calculatedPrice,
          desiredPrice: rideForm.desiredPrice || null, // Send null if no desired price
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

  const handleAcceptDriver = async (driverId) => {
    try {
      setLoading(true);
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/accept-driver`,
        { driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
   
      const acceptedDriver = interestedDrivers.find(driver => driver._id === driverId);
      
      setDriverDetails({
        name: response.data.driver.firstName,
        car: `${response.data.driver.carDetails.model} (${response.data.driver.carDetails.year})`,
        licensePlate: response.data.driver.carDetails.plateNumber,
        distance: response.data.driver.distance || 'Calculating...',
        // Include driver's proposed price if available
        driverProposedPrice: acceptedDriver?.driverProposedPrice || null
      });
      
      setRideStarted(true);
      setEta('5 minutes');
      setInterestedDrivers([]); // Clear interested drivers after acceptance
      toast.success("Driver accepted successfully", { style: { background: "#4CAF50", color: "white" } });
    } catch (error) {
      const errorMessage = error.response?.data?.error || "Failed to accept driver";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      setLoading(true);
      await axios.put(
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

  const submitRatingAndReview = async () => {
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/rides/${deliveryId}/rate`, { rating, review });
      toast.success('Rating and review submitted');
    } catch (error) {
      console.error('Error submitting rating/review:', error);
    }
  };

  // Fixed Google Maps URL
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
  {/* Driver Details Modal */}
{showDriverModal && selectedDriver && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className={`rounded-lg p-6 w-11/12 max-w-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
      <button onClick={() => setShowDriverModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
        <FaTimes size={20} />
      </button>
      <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Driver Details</h2>
      
      <div className="space-y-3">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 mr-3">
            <FaCar size={24} />
          </div>
          <div>
            <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{selectedDriver.firstName}</p>
            <p className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              {selectedDriver.carDetails.model} ({selectedDriver.carDetails.year})
            </p>
          </div>
        </div>
        
        <div className={`grid grid-cols-2 gap-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
          <p className="text-sm">License Plate:</p>
          <p className="text-sm font-medium">{selectedDriver.carDetails.plateNumber}</p>
          
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
        
        <button
          onClick={() => handleAcceptDriver(selectedDriver._id)}
          className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all mt-2"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Accept Driver'}
        </button>
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
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Payment Method</label>
              <select
                value={rideForm.paymentMethod}
                onChange={(e) => setRideForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
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
    <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Interested Drivers</h4>
    {interestedDrivers.length > 0 ? (
      <ul className="space-y-2">
        {interestedDrivers.map((driver) => (
          <li key={driver._id} className={`p-3 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-gray-700'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className={`font-medium ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{driver.firstName}</p>
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
                <button
                  type="button"
                  onClick={() => handleAcceptDriver(driver._id)}
                  className="py-1 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center"
                  disabled={loading}
                >
                  Accept
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
    
    {/* Enhanced pricing information section */}
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
            {/* {paymentCompleted && (
              <div className={`mt-2 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
                <p>Payment completed successfully!</p>
              </div>
            )} */}

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














































































// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import Autocomplete from 'react-google-autocomplete';
// import { FaArrowLeft, FaInfoCircle } from 'react-icons/fa'; 
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { useNavigate } from 'react-router-dom';
// import { FaSun, FaMoon, FaCar } from 'react-icons/fa'; 
// import im from "../assets/Board Cover.jpg";
// import im2 from "../assets/Car rental logo_ 12_667 fotos e imagens stock livres de direitos _ Shutterstock.jpg"
// import im3 from "../assets/download.jpg"
// function Ride() {
//   const [pickupAddress, setPickupAddress] = useState('');
//   const [pickupLatLng, setPickupLatLng] = useState(null);
//   const [destinationAddress, setDestinationAddress] = useState('');
//   const [destinationLatLng, setDestinationLatLng] = useState(null);
//   const [packageDescription, setPackageDescription] = useState('');
//   const [packagePicture, setPackagePicture] = useState(null);
//   const [packagePictureUrl, setPackagePictureUrl] = useState('');
//   const [distance, setDistance] = useState(null);
//   const [fare, setFare] = useState(null);
//   const [offeredFare, setOfferedFare] = useState(''); // New state for user-offered fare
//   const [showMap, setShowMap] = useState(false);
//   const [rideStarted, setRideStarted] = useState(false);
//   const [rideProgress, setRideProgress] = useState(0);
//   const [rideStatus, setRideStatus] = useState('');
//   const [driverDetails, setDriverDetails] = useState(null);
//   const [eta, setEta] = useState(null);
//   const [nearbyDrivers, setNearbyDrivers] = useState([]);
//   const [rideOption, setRideOption] = useState('economy');
//   const [paymentMethod, setPaymentMethod] = useState('cash');
//   const [paymentCompleted, setPaymentCompleted] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [rideHistory, setRideHistory] = useState([]);
//   const [chatMessages, setChatMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState('');
//   const [deliveryId, setDeliveryId] = useState(null);
//   const [rating, setRating] = useState(0);
//   const [review, setReview] = useState('');
//   const [isCreatingDelivery, setIsCreatingDelivery] = useState(false);
//   const [passenger, setPassenger] = useState(null);
//   const [data, setData] = useState(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const navigate = useNavigate();
//   const [showNotification, setShowNotification] = useState(false);
//   const [passengerId, setPassengerId] = useState('');
//   const [theme, setTheme] = useState('light');
//   const [currentLocation, setCurrentLocation] = useState(null); // For default map
//   const [showFeatures, setShowFeatures] = useState({ economy: false, premium: false, shared: false }); // Toggle features
//   const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
//   const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;
//   const [rideForm, setRideForm] = useState({
//     pickupAddress: "",
//     destinationAddress: "",
//     distance: "",
//     calculatedPrice: "",
//     desiredPrice: "",
//     rideOption: "economy",
//     paymentMethod: "",
//   });
//   // Toggle theme function
//   const toggleTheme = () => {
//     setTheme(theme === 'light' ? 'dark' : 'light');
//   };


//   const token = localStorage.getItem("token")
  
//     const [location, setLocation] = useState({ latitude: null, longitude: null, name: null });
  
  
//     useEffect(() => {
//         if ("geolocation" in navigator) {
//             navigator.geolocation.getCurrentPosition(
//                 async (position) => {
//                     const { latitude, longitude } = position.coords;
  
//                     // Fetch location name using Nominatim API
//                     try {
//                         const response = await fetch(
//                             `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
//                         );
//                         const data = await response.json();
//                         const locationName = data.display_name || 'Unknown location';
  
//                         // Update state with coordinates and name
//                         setLocation({ latitude, longitude, name: locationName });
  
//                         // Send location to backend
//                         await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/save-location`, {
//                             method: 'POST',
//                             body: JSON.stringify({ latitude, longitude, userId: token }),
//                             headers: { 'Content-Type': 'application/json' }
//                         });
//                     } catch (error) {
//                         console.error('Error fetching location name:', error);
//                         setLocation({ latitude, longitude, name: 'Error fetching location' });
//                     }
//                 },
//                 (error) => {
//                     console.error("Location access denied:", error.message);
//                     setLocation({ latitude: null, longitude: null, name: 'Location access denied' });
//                 }
//             );
//         } else {
//             setLocation({ latitude: null, longitude: null, name: 'Geolocation not supported' });
//         }
//     }, []);
  
    
  
  
  
  
//       useEffect(() => {
       
//         fetch(`${import.meta.VITE_BACKEND_URL}/api/auth/get-location/${token}`)
//             .then(response => response.json())
//             .then(data => {
//                 if (data.latitude && data.longitude) {
//                     setLocation({ latitude: data.latitude, longitude: data.longitude });
//                 }
//             })
//             .catch(err => console.error('Error fetching location:', err));
    
//         // Then try to update with current location
//         if ("geolocation" in navigator) {
//             navigator.geolocation.getCurrentPosition(
//                 (position) => {
//                     const { latitude, longitude } = position.coords;
//                     setLocation({ latitude, longitude });
    
//                     fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/save-location`, {
//                         method: 'POST',
//                         body: JSON.stringify({ latitude, longitude, userId: token }),
//                         headers: { 'Content-Type': 'application/json' }
//                     });
//                 },
//                 (error) => console.error("Location access denied:", error.message)
//             );
//         }
//     }, []);
  

//   // Get user's current location on mount
//   useEffect(() => {
//     if ("geolocation" in navigator) {
//       navigator.geolocation.getCurrentPosition(
//         async (position) => {
//           const { latitude, longitude } = position.coords;
//           setPickupLatLng({ lat: latitude, lng: longitude });
//           setCurrentLocation({ lat: latitude, lng: longitude });

//           // Reverse geocode to get address
//           try {
//             const response = await fetch(
//               `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
//               { headers: { 'User-Agent': 'e_RideProject/1.0' } }
//             );
//             const data = await response.json();
//             const address = data.display_name || 'Current Location';
//             setPickupAddress(address);
//           } catch (error) {
//             console.error('Error reverse geocoding:', error);
//             setPickupAddress('Current Location');
//           }
//         },
//         (error) => {
//           console.error("Location access denied:", error.message);
//           setPickupAddress('Unable to fetch location');
//         }
//       );
//     }
//   }, []);

//   useEffect(() => {
//     const fetchMyProfile = async () => {
//       const token = localStorage.getItem('token');
//       if (!token) {
//         console.log('No token found in localStorage');
//         setError('Please log in to access the dashboard');
//         toast.error('Please log in to access the dashboard', {
//           style: { background: '#F44336', color: 'white' },
//         });
//         navigate('/plogin');
//         setLoading(false);
//         return;
//       }

//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         console.log('Dashboard response:', response.data);
//         if (response.data.status) {
//           toast.success('book a ride with ease', {
//             style: { background: '#4CAF50', color: 'white' },
//           });
//           setData(response.data);
//           setPassengerId(response.data._id);
//           setPassenger(response.data);
//           setShowNotification(true);
//           setTimeout(() => setShowNotification(false), 15000);
//         } else {
//           throw new Error(response.data.message || 'Failed to fetch profile');
//         }
//       } catch (error) {
//         console.error('Fetch profile error:', error.response?.data || error.message);
//         const errorMessage = error.response?.data?.message || 'An error occurred while fetching profile';
//         setError(errorMessage);
//         toast.error(errorMessage, {
//           style: { background: '#F44336', color: 'white' },
//         });
//         if (error.response?.status === 401) {
//           localStorage.removeItem('token');
//           navigate('/plogin');
//         }
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchMyProfile();
//   }, [navigate]);

//   // Fetch nearby drivers
//   useEffect(() => {
//     if (!pickupLatLng) return;

//     const fetchNearbyDrivers = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/nearby`);
//         setNearbyDrivers(response.data);
//       } catch (error) {
//         console.error('Error fetching nearby drivers:', error);
//       }
//     };
//     fetchNearbyDrivers();
//   }, [pickupLatLng]);

//   // Simulate driver movement
//   useEffect(() => {
//     if (!rideStarted || !deliveryId) return;

//     const interval = setInterval(() => {
//       setRideProgress((prev) => {
//         if (prev >= 100) {
//           clearInterval(interval);
//           setRideStatus('Delivery completed');
//           toast.success('Delivery completed');
//           axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`, { status: 'completed' });
//           return 100;
//         }

//         const newProgress = prev + 2;
//         if (newProgress < 50) {
//           setRideStatus('Driver is on the way');
//           if (newProgress === 2) toast.info('Driver is on the way');
//         } else if (newProgress === 50) {
//           setRideStatus('Driver has arrived at pickup');
//           toast.success('Driver has arrived at pickup');
//         } else {
//           setRideStatus('Delivery in progress');
//         }
//         return newProgress;
//       });
//     }, 500);

//     return () => clearInterval(interval);
//   }, [rideStarted, deliveryId]);

//   // Fetch ride history
//   useEffect(() => {
//     if (!passengerId) return;

//     const fetchRideHistory = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/passenger/${passengerId}`);
//         setRideHistory(response.data);
//       } catch (error) {
//         console.error('Error fetching ride history:', error);
//       }
//     };
//     fetchRideHistory();
//   }, [rideStatus, passengerId]);

//   const calculateDistanceAndFare = async () => {
//     if (!pickupAddress || !destinationAddress ) {
//       toast.error("Please enter pickup and destination addresses", {
//         style: { background: "#F44336", color: "white" },
//       });
//       return;
//     }

//     try {
//       console.log('Sending request to calculate fare with:', { pickupAddress, destinationAddress, rideOption });
//       const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/calculate-fare`, {
//         pickupAddress,
//         destinationAddress,
//       });
//       console.log('Calculate fare response:', response.data);
      
//       let { distance, price } = response.data;
//       setDistance(distance);
//       setRideForm((prev) => ({
//         ...prev,
//         distance,
//         calculatedPrice: rideForm.desiredPrice || (rideForm.rideOption === "premium" ? price * 1.5 : rideForm.rideOption === "shared" ? price * 0.7 : price),
//       }));

//       // Adjust price based on ride option
//       if (rideOption === 'premium') {
//         price *= 1.5;
//         console.log('Price adjusted for premium:', price);
//       }
//       if (rideOption === 'shared') {
//         price *= 0.7;
//         console.log('Price adjusted for shared:', price);
//       }
//       setFare(price);

//       // Use offered fare if provided, otherwise use calculated fare
//       if (offeredFare) {
//         setFare(parseFloat(offeredFare));
//       }

//       // Simulate ETA
//       setEta('5 minutes');

//       setShowMap(true);
//     } catch (error) {
//       toast.error("error calculating fares", {
//         style: { backgroundColor: "red", color: "white" }
//       });
//       console.error('Error calculating fare:', error.response?.data || error);
//       setDistance(0);
//       setFare(0);
//       setRideForm((prev) => ({ ...prev, distance: "", calculatedPrice: "" }));
//     }
//   };

//   const handlePackagePictureUpload = async (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     const formData = new FormData();
//     formData.append('file', file);
//     formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

//     try {
//       const response = await axios.post('https://api.cloudinary.com/v1_1/dc0poqt9l/image/upload', formData);
//       setPackagePictureUrl(response.data.secure_url);
//       setPackagePicture(file);
//     } catch (error) {
//       console.error('Error uploading package picture:', error);
//     }
//   };

//   const createDelivery = async () => {
//     const token = localStorage.getItem('token');
//     if (!token) {
//       console.log('No token found in localStorage');
//       setError('Please log in to access the dashboard');
//       toast.error('Please log in to access the dashboard', {
//         style: { background: '#F44336', color: 'white' },
//       });
//       navigate('/plogin');
//       setLoading(false);
//       return;
//     }

//     if (isCreatingDelivery) {
//       console.log('Delivery creation already in progress');
//       return;
//     }

//     setIsCreatingDelivery(true);
//     try {
//       console.log('Sending create delivery request with payload:', {
//         passengerId,
//         pickupAddress,
//         destinationAddress,
//         packageDescription,
//         packagePicture: packagePictureUrl,
//         distance,
//         price: fare,
//         rideOption,
//         paymentMethod,
//       });

//       const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/create`, {
//         passengerId,
//         pickupAddress,
//         destinationAddress,
//         packageDescription,
//         packagePicture: packagePictureUrl,
//         distance,
//         price: fare,
//         rideOption,
//         paymentMethod,
//       }, {
//         headers: { Authorization: `Bearer ${token}` }
//       });

//       const delivery = response.data;
//       setDeliveryId(delivery._id);

//       const driverResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/driver/${delivery.driver}`);
//       const driver = driverResponse.data;
//       setDriverDetails({
//         name: driver.firstName,
//         car: `${driver.carDetails.model} ${driver.carDetails.product} (${driver.carDetails.year}) (${driver.carPicturer})`,
//         licensePlate: driver.carDetails.plateNumber,
//       });

//       setRideStarted(true);
//       await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${delivery._id}/status`, { status: 'accepted' });
//       toast.success('Delivery created successfully', {
//         style: { background: '#4CAF50', color: 'white' },
//       });
//     } catch (error) {
//       console.error('Error creating delivery:', error.response?.data || error);
//       const errorMessage = error.response?.data?.error || 'Failed to create delivery';
//       toast.error(errorMessage, {
//         style: { background: '#F44336', color: 'white' },
//       });
//     } finally {
//       setIsCreatingDelivery(false);
//     }
//   };


//   // Ride Submission (update the existing handleRideSubmit)
// const handleRideSubmit = async (e) => {
//   e.preventDefault();
//   const token = localStorage.getItem("token");
//   if (!token) {
//     toast.error("Please log in to book a ride", { style: { background: "#F44336", color: "white" } });
//     navigate("/plogin");
//     return;
//   }

//   try {
//     setLoading(true);
//     const response = await axios.post(
//       `${import.meta.env.VITE_BACKEND_URL}/api/rides/create`,
//       {
//         pickupAddress: rideForm.pickupAddress,
//         destinationAddress: rideForm.destinationAddress,
//         distance: rideForm.distance,
//         calculatedPrice: rideForm.calculatedPrice,
//         desiredPrice: rideForm.desiredPrice || rideForm.calculatedPrice,
//         rideOption: rideForm.rideOption,
//         paymentMethod: rideForm.paymentMethod,
//       },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     toast.success("Ride request created successfully", { style: { background: "#4CAF50", color: "white" } });
//     setRideForm({
//       pickupAddress: "",
//       destinationAddress: "",
//       distance: "",
//       calculatedPrice: "",
//       desiredPrice: "",
//       rideOption: "economy",
//       paymentMethod: "",
//     });
//     setShowMap(false);
//   } catch (error) {
//     const errorMessage = error.response?.data?.error || "Failed to create ride request";
//     toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
//   } finally {
//     setLoading(false);
//   }
// };


//   const sendChatMessage = async () => {
//     if (!newMessage.trim()) return;

//     try {
//       await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/chat`, {
//         sender: 'passenger',
//         text: newMessage,
//       });
//       setChatMessages([...chatMessages, { sender: 'passenger', text: newMessage }]);
//       setTimeout(() => {
//         setChatMessages((prev) => [...prev, { sender: 'driver', text: 'Got it!' }]);
//       }, 1000);
//       setNewMessage('');
//     } catch (error) {
//       console.error('Error sending chat message:', error);
//     }
//   };

//   const submitRatingAndReview = async () => {
//     try {
//       await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/rate`, {
//         rating,
//         review,
//       });
//       toast.success('Rating and review submitted');
//     } catch (error) {
//       console.error('Error submitting rating/review:', error);
//     }
//   };

//   const mapUrl = showMap
//     ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(pickupAddress)}&destination=${encodeURIComponent(destinationAddress)}&mode=driving`
//     : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=${currentLocation?.lat},${currentLocation?.lng}&zoom=15`;

//   const toggleFeatures = (option) => {
//     setShowFeatures((prev) => ({ ...prev, [option]: !prev[option] }));
//   };

//   return (
//     <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
//       {/* Header */}
//       <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
//         <div className="flex items-center space-x-2">
//           <button onClick={toggleTheme} className="text-gray-600 hover:text-gray-800">
//             {theme === 'light' ? <FaMoon size={20} className={theme === 'light' ? 'text-gray-600' : 'text-white'} /> : <FaSun size={20} className={theme === 'light' ? 'text-gray-600' : 'text-white'} />}
//           </button>
//         </div>
//         <button onClick={() => setShowProfile(!showProfile)}>
//           <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
//             {passenger?.profilePicture && (
//               <img src={passenger.profilePicture} alt="Profile" className="w-full h-full object-cover" />
//             )}
//           </div>
//         </button>
//       </header>

//       {/* Profile and Ride History Modal */}
//       {showProfile && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className={`rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
//             <button onClick={() => setShowProfile(false)} className={theme === 'light' ? 'text-green-600 mb-4' : 'text-green-400 mb-4'}>
//               Close
//             </button>
//             <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Profile</h2>
//             <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Name: {passenger?.name || 'James'}</p>
//             <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Email: {passenger?.userEmail || 'james@example.com'}</p>
//             <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Phone: {passenger?.phoneNumber}</p>
//             <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Location: {passenger?.location.state}, {passenger?.location.lga}</p>
//             {passenger?.question && <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Status: {passenger.question}</p>}
//             {passenger?.schoolIdUrl && (
//               <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
//                 School ID: <a href={passenger.schoolIdUrl} target="_blank" rel="noopener noreferrer" className={theme === 'light' ? 'text-blue-600' : 'text-blue-400'}>View</a>
//               </p>
//             )}
//             <h3 className={`text-lg font-semibold mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Delivery History</h3>
//             {rideHistory.length > 0 ? (
//               <ul className="space-y-2">
//                 {rideHistory.map((ride, index) => (
//                   <li key={index} className={`border p-2 rounded-lg ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
//                     <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>From: {ride.pickupAddress}</p>
//                     <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>To: {ride.destinationAddress}</p>
//                     <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Package: {ride.packageDescription}</p>
//                     <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Distance: {ride.distance} km</p>
//                     <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Price: ₦{ride.price}</p>
//                     <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Date: {new Date(ride.createdAt).toLocaleString()}</p>
//                   </li>
//                 ))}
//               </ul>
//             ) : (
//               <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>No deliveries yet.</p>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Main Content */}
//       <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
//         {/* Left Side: Form */}
//         <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
//           <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Book A ride</h3>

//           {/* Pickup Input */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Pickup Address</label>
//             <Autocomplete
//               apiKey={googleMapsApiKey}
//               onPlaceSelected={(place) => {
//                 console.log('Pickup Selected:', place);
//                 if (place?.formatted_address && place.geometry?.location) {
//                   setPickupAddress(place.formatted_address);
//                   setPickupLatLng({
//                     lat: place.geometry.location.lat(),
//                     lng: place.geometry.location.lng(),
//                   });
//                 } else {
//                   console.error('Invalid pickup place object:', place);
//                 }
//               }}
//               options={{
//                 types: ['geocode'],
//                 componentRestrictions: { country: 'ng' },
//               }}
//               value={pickupAddress}
//               onChange={(e) => {
//                 console.log('Pickup input changed:', e.target.value);
//                 setPickupAddress(e.target.value);
//               }}
//               className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//               placeholder="Enter pickup location"
//             />
//           </div>

//           {/* Destination Input */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Destination Address</label>
//             <Autocomplete
//               apiKey={googleMapsApiKey}
//               onPlaceSelected={(place) => {
//                 console.log('Destination Selected:', place);
//                 if (place?.formatted_address && place.geometry?.location) {
//                   setDestinationAddress(place.formatted_address);
//                   setDestinationLatLng({
//                     lat: place.geometry.location.lat(),
//                     lng: place.geometry.location.lng(),
//                   });
//                 } else {
//                   console.error('Invalid destination place object:', place);
//                 }
//               }}
//               options={{
//                 types: ['geocode'],
//                 componentRestrictions: { country: 'ng' },
//               }}
//               value={destinationAddress}
//               onChange={(e) => {
//                 console.log('Destination input changed:', e.target.value);
//                 setDestinationAddress(e.target.value);
//               }}
//               className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//               placeholder="Enter destination"
//             />
//           </div>

//           {/* Package Description */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Package Description</label>
//             <textarea
//               value={packageDescription}
//               onChange={(e) => setPackageDescription(e.target.value)}
//               className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//               placeholder="Describe the package (e.g., size, weight, contents)"
//               rows="3"
//             />
//           </div>

//           {/* Package Picture */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Package Picture (Optional)</label>
//             <input
//               type="file"
//               accept="image/*"
//               onChange={handlePackagePictureUpload}
//               className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//             />
//             {packagePictureUrl && (
//               <img src={packagePictureUrl} alt="Package" className="mt-2 w-24 h-24 object-cover rounded-lg" />
//             )}
//           </div>

//           {/* Nearby Drivers */}
//           {nearbyDrivers.length > 0 && !rideStarted && (
//             <div className="mb-4">
//               <h4 className={`text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Nearby Drivers</h4>
//               <ul className="space-y-1">
//                 {nearbyDrivers.map((driver, index) => (
//                   <li key={index} className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
//                     {driver.name} - {driver.distance}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Ride Options */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Delivery Option</label>
//             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//               {/* Economy */}
//               <div
//                 className={`p-4 border rounded-lg cursor-pointer ${rideOption === 'economy' ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
//                 onClick={() => setRideOption('economy')}
//               >
//                 <img src={im} alt="Economy Car" className="w-full h-24 object-cover rounded-lg mb-2" />
//                 <p className={`text-center font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Economy</p>
//                 <button
//                   onClick={(e) => { e.stopPropagation(); toggleFeatures('economy'); }}
//                   className={`flex items-center justify-center w-full mt-2 text-sm ${theme === 'light' ? 'text-green-600' : 'text-customPink'}`}
//                 >
//                   <FaInfoCircle className="mr-1" /> See More
//                 </button>
//                 {showFeatures.economy && (
//                   <ul className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
//                     <li>- Affordable pricing</li>
//                     <li>- Standard delivery time</li>
//                     <li>- Basic vehicle</li>
//                   </ul>
//                 )}
//               </div>

//               {/* Premium */}
//               <div
//                 className={`p-4 border rounded-lg cursor-pointer ${rideOption === 'premium' ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
//                 onClick={() => setRideOption('premium')}
//               >
//                 <img src={im2} alt="Economy Car" className="w-full h-24 object-cover rounded-lg mb-2" />
//                 <p className={`text-center font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Premium</p>
//                 <button
//                   onClick={(e) => { e.stopPropagation(); toggleFeatures('premium'); }}
//                   className={`flex items-center justify-center w-full mt-2 text-sm ${theme === 'light' ? 'text-green-600' : 'text-customPink'}`}
//                 >
//                   <FaInfoCircle className="mr-1" /> See More
//                 </button>
//                 {showFeatures.premium && (
//                   <ul className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
//                     <li>- Higher price</li>
//                     <li>- Faster delivery</li>
//                     <li>- Luxury vehicle</li>
//                   </ul>
//                 )}
//               </div>

//               {/* Shared */}
//               <div
//                 className={`p-4 border rounded-lg cursor-pointer ${rideOption === 'shared' ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
//                 onClick={() => setRideOption('shared')}
//               >
//                 <img src={im3} alt="Economy Car" className="w-full h-24 object-cover rounded-lg mb-2" />
//                 <p className={`text-center font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Comfort</p>
//                 <button
//                   onClick={(e) => { e.stopPropagation(); toggleFeatures('shared'); }}
//                   className={`flex items-center justify-center w-full mt-2 text-sm ${theme === 'light' ? 'text-green-600' : 'text-customPink'}`}
//                 >
//                   <FaInfoCircle className="mr-1" /> See More
//                 </button>
//                 {showFeatures.shared && (
//                   <ul className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
//                     <li>- Cheapest option</li>
//                     <li>- Shared with others</li>
//                     <li>- Longer delivery time</li>
//                   </ul>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Offered Fare */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Your Offered Fare (₦)</label>
//             <input
//               type="number"
//               value={offeredFare}
//               onChange={(e) => setOfferedFare(e.target.value)}
//               className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//               placeholder="Enter your offered fare (optional)"
//             />
//           </div>

//           {/* Payment Method */}
//           <div className="mb-4">
//             <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Payment Method</label>
//             <select
//               value={paymentMethod}
//               onChange={(e) => setPaymentMethod(e.target.value)}
//               className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//             >
//               <option value="cash">Cash</option>
//               <option value="card">Card</option>
//             </select>
//           </div>

//           {/* Calculate Button */}
//           <button
//             onClick={calculateDistanceAndFare}
//             className="w-full py-2 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all"
//           >
//             CONTINUE
//           </button>

//           {/* Display Distance and Price */}
//           <div className={`mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
//             <p>Distance: {distance !== null ? `${distance} km` : 'Not calculated'}</p>
//             <p>Estimated Price: <span className={`font-bold ${theme === 'light' ? 'text-green-800' : 'text-green-400'}`}>{fare !== null ? `₦${fare}` : 'Not calculated'}</span></p>
//           </div>

//           {/* Start Delivery Button */}
//           {distance && fare && !rideStarted && (
//             <button
//               onClick={createDelivery}
//               className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all mt-2"
//             >
//               Start Delivery
//             </button>
//           )}

//           {/* Driver Details & ETA */}
//           {driverDetails && eta && rideStarted && (
//             <div className={`border-t pt-4 mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
//               <h4 className="text-base font-semibold">Driver Details</h4>
//               <p>Name: {driverDetails.name}</p>
//               <p>Car: {driverDetails.car}</p>
//               <p>License Plate: {driverDetails.licensePlate}</p>
//               <p>ETA: {eta}</p>
//             </div>
//           )}

//           {/* Ride Status and Progress */}
//           {rideStarted && (
//             <div className="mt-4">
//               <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Delivery Status: {rideStatus}</h4>
//               <div className={`w-full rounded-full h-2 mt-2 ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
//                 <div
//                   className="bg-green-600 h-2 rounded-full"
//                   style={{ width: `${rideProgress}%` }}
//                 ></div>
//               </div>
//             </div>
//           )}

//           {/* Chat with Driver */}
//           {rideStarted && (
//             <div className="mt-4">
//               <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Chat with Driver</h4>
//               <div className={`border p-2 rounded-lg h-24 overflow-y-auto ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
//                 {chatMessages.map((msg, index) => (
//                   <p key={index} className={msg.sender === 'passenger' ? 'text-right text-blue-600' : `text-left ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
//                     {msg.sender === 'passenger' ? 'You' : 'Driver'}: {msg.text}
//                   </p>
//                 ))}
//               </div>
//               <div className="flex mt-2">
//                 <input
//                   type="text"
//                   value={newMessage}
//                   onChange={(e) => setNewMessage(e.target.value)}
//                   className={`flex-1 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//                   placeholder="Type a message..."
//                 />
//                 <button
//                   onClick={sendChatMessage}
//                   className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg"
//                 >
//                   Send
//                 </button>
//               </div>
//             </div>
//           )}

//           {/* Payment Confirmation */}
//           {rideStatus === 'Delivery completed' && !paymentCompleted && (
//             <div className="mt-4">
//               <button
//                 onClick={() => {
//                   setPaymentCompleted(true);
//                   toast.success(`Payment of ₦${fare} completed via ${paymentMethod}`);
//                 }}
//                 className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
//               >
//                 Complete Payment
//               </button>
//             </div>
//           )}
//           {paymentCompleted && (
//             <div className={`mt-2 ${theme === 'light' ? 'text-green-600' : 'text-green-400'}`}>
//               <p>Payment completed successfully!</p>
//             </div>
//           )}

//           {/* Rate and Review Driver */}
//           {paymentCompleted && (
//             <div className="mt-4">
//               <h4 className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Rate and Review Driver</h4>
//               <div className="flex items-center space-x-2">
//                 <label className={`text-sm font-medium ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Rating (1-5):</label>
//                 <input
//                   type="number"
//                   min="1"
//                   max="5"
//                   value={rating}
//                   onChange={(e) => setRating(Number(e.target.value))}
//                   className={`w-16 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//                 />
//               </div>
//               <textarea
//                 value={review}
//                 onChange={(e) => setReview(e.target.value)}
//                 className={`w-full p-2 border rounded-lg mt-2 ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
//                 placeholder="Leave a review (optional)"
//                 rows="3"
//               />
//               <button
//                 onClick={submitRatingAndReview}
//                 className="w-full py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
//               >
//                 Submit Rating
//               </button>
//             </div>
//           )}
//         </div>

//         {/* Right Side: Map */}
//         <div className="lg:w-[55%] w-full h-96 lg:h-auto">
//           {currentLocation ? (
//             <iframe
//               width="100%"
//               height="100%"
//               style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
//               loading="lazy"
//               allowFullScreen
//               src={mapUrl}
//               onLoad={() => console.log('Iframe map loaded')}
//               onError={(error) => console.error('Error loading iframe map:', error)}
//             />
//           ) : (
//             <div className={`h-full rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
//               <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Fetching your location...</p>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Toast Notifications */}
//       <ToastContainer position="top-right" autoClose={3000} />
//     </div>
//   );
// }

// export default Ride;



















































