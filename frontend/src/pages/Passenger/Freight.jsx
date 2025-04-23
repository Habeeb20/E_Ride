import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft, FaInfoCircle, FaSun, FaMoon, FaCar, FaEye, FaTimes, FaRoute, FaPhone } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

// Load Google Maps script dynamically
const loadGoogleMapsScript = () => {
  return new Promise((resolve) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = resolve;
    document.head.appendChild(script);
  });
};

function Freight() {
  const [rideForm, setRideForm] = useState({
    pickupAddress: "",
    destinationAddress: "",
    packageDescription: "",
    packageImage: "",
    distance: "",
    price: "",
    passengerPrice: "",
    paymentMethod: "cash",
  });
  const [showMap, setShowMap] = useState(false);
  const [rideStarted, setRideStarted] = useState(false);
  const [rideProgress, setRideProgress] = useState(0);
  const [rideStatus, setRideStatus] = useState('');
  const [driverDetails, setDriverDetails] = useState(null);
  const [eta, setEta] = useState(null);
  const [nearbyDrivers, setNearbyDrivers] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [deliveryId, setDeliveryId] = useState(null);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [isCreatingRide, setIsCreatingRide] = useState(false);
  const [passenger, setPassenger] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passengerId, setPassengerId] = useState('');
  const [theme, setTheme] = useState('dark');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [interestedDrivers, setInterestedDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [packageImageFile, setPackageImageFile] = useState(null);

  const mapRef = useRef(null); // Reference to the map DOM element
  const googleMapRef = useRef(null); // Reference to the Google Map instance
  const driverMarkerRef = useRef(null); // Reference to the driver's marker
  const directionsServiceRef = useRef(null); // Google Directions Service
  const directionsRendererRef = useRef(null); // Google Directions Renderer

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    autoConnect: false,
  });

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Initialize Google Map
  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (mapRef.current && !googleMapRef.current) {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
          center: currentLocation || { lat: 6.5244, lng: 3.3792 }, // Default to Lagos if no current location
          zoom: 15,
          mapTypeId: 'roadmap',
        });
        directionsServiceRef.current = new window.google.maps.DirectionsService();
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          map: googleMapRef.current,
          suppressMarkers: true, // Hide default A/B markers
        });
      }
    });
  }, [currentLocation]);

  // Socket setup and real-time updates
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
            setRideForm((prev) => ({ ...prev, pickupAddress: 'Current Location' }));
            console.error('Error fetching address from coordinates:', error);
          }
        },
        (error) => {
          setRideForm((prev) => ({ ...prev, pickupAddress: 'Unable to fetch location' }));
          console.error('Geolocation error:', error.message);
        }
      );
    }

    if (token) {
      socket.connect();
      socket.on('connect', () => {
        console.log('Socket connected with ID:', socket.id);
        socket.emit('join', passengerId);
      });
      socket.on('driverNegotiation', ({ deliveryId: incomingDeliveryId, driverId, negotiatedPrice, driverDetails }) => {
        if (incomingDeliveryId === deliveryId) {
          console.log('Driver Negotiation:', { driverId, negotiatedPrice, driverDetails });
          setInterestedDrivers((prev) => [
            ...prev.filter((d) => d._id !== driverId),
            { _id: driverId, negotiatedPrice, ...driverDetails, status: 'negotiated' }
          ]);
          toast.info(`Driver ${driverId} negotiated ₦${negotiatedPrice}`);
        }
      });
      socket.on('driverResponse', ({ deliveryId: incomingDeliveryId, driverId, response, driverDetails }) => {
        if (incomingDeliveryId === deliveryId) {
          console.log('Driver Response:', { driverId, response, driverDetails });
          if (response === 'accept' || response === 'negotiate') {
            setInterestedDrivers((prev) => [
              ...prev.filter((d) => d._id !== driverId),
              { _id: driverId, negotiatedPrice: response === 'negotiate' ? driverDetails.negotiatedPrice : null, ...driverDetails, status: response }
            ]);
            toast.info(`Driver ${driverId} ${response === 'accept' ? 'accepted' : 'negotiated'} your delivery`);
          }
        }
      });
      socket.on('rideStarted', ({ deliveryId: incomingDeliveryId }) => {
        if (incomingDeliveryId === deliveryId) {
          setRideStarted(true);
          toast.success('Ride has started');
        }
      });
      socket.on('newMessage', ({ senderId, message }) => {
        setChatMessages((prev) => [...prev, { sender: senderId, text: message }]);
      });
      socket.on('driverLocationUpdate', ({ lat, lng }) => {
        console.log('Driver Location Update:', { lat, lng });
        setDriverDetails((prev) => ({ ...prev, location: { lat, lng } }));
        updateDriverMarker({ lat, lng });
      });
    }

    return () => socket.disconnect();
  }, [token, deliveryId, passengerId]);

  // Fetch profile and nearby drivers
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPassenger(response.data.data);
        setPassengerId(response.data.data?._id);
        socket.emit('join', response.data.data?._id);
      } catch (error) {
        toast.error('Please log in', { style: { background: '#F44336', color: 'white' } });
        navigate('/plogin');
      }
    };
    fetchProfile();

    const fetchNearbyDrivers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/nearby`);
        setNearbyDrivers(response.data);
      } catch (error) {
        console.error('Error fetching nearby drivers:', error);
      }
    };
    fetchNearbyDrivers();
  }, [navigate, token]);

  useEffect(() => {
    if (passengerId) {
      const fetchRideHistory = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/passenger/${passengerId}`);
          setRideHistory(response.data);
        } catch (error) {
          console.error('Error fetching ride history:', error);
        }
      };
      fetchRideHistory();
    }
  }, [passengerId]);

  // Update map with route and driver marker
  useEffect(() => {
    if (googleMapRef.current && showMap && rideForm.pickupAddress && rideForm.destinationAddress) {
      const directionsService = directionsServiceRef.current;
      const directionsRenderer = directionsRendererRef.current;

      directionsService.route(
        {
          origin: rideForm.pickupAddress,
          destination: rideForm.destinationAddress,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
            // Add markers for pickup and destination
            new window.google.maps.Marker({
              position: result.routes[0].legs[0].start_location,
              map: googleMapRef.current,
              label: 'P', // Pickup
              icon: { url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' },
            });
            new window.google.maps.Marker({
              position: result.routes[0].legs[0].end_location,
              map: googleMapRef.current,
              label: 'D', // Destination
              icon: { url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' },
            });
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );
    }
  }, [showMap, rideForm.pickupAddress, rideForm.destinationAddress]);

  // Function to update driver marker position
  const updateDriverMarker = (location) => {
    if (googleMapRef.current && location) {
      if (!driverMarkerRef.current) {
        driverMarkerRef.current = new window.google.maps.Marker({
          position: location,
          map: googleMapRef.current,
          icon: {
            url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png', // Car icon
            scaledSize: new window.google.maps.Size(32, 32),
          },
          title: 'Driver',
        });
      } else {
        driverMarkerRef.current.setPosition(location);
      }
      googleMapRef.current.panTo(location); // Center map on driver
    }
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', cloudinaryUploadPreset);

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/image/upload`,
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      toast.error('Failed to upload image');
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setPackageImageFile(file);
      const imageUrl = await uploadImageToCloudinary(file);
      if (imageUrl) {
        setRideForm((prev) => ({ ...prev, packageImage: imageUrl }));
        toast.success('Image uploaded successfully');
      }
    }
  };

  const calculateDistanceAndFare = async () => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/calculate-fare`, {
        pickupAddress: rideForm.pickupAddress,
        destinationAddress: rideForm.destinationAddress,
      });
      const { distance, price } = response.data;
      setRideForm((prev) => ({ ...prev, distance, price }));
      setShowMap(true);
      toast.success(`Fare: ₦${price} (Distance: ${distance} km)`);
    } catch (error) {
      toast.error('Error calculating fare');
      console.error('Fare calculation error:', error);
    }
  };

  const handleRideSubmit = async (e) => {
    e.preventDefault();
    if (!token || isCreatingRide) return;
    setIsCreatingRide(true);
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/create`,
        { ...rideForm, passengerId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeliveryId(response.data._id);
      socket.emit('join', passengerId);
      toast.success('Delivery booked successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book delivery');
    } finally {
      setLoading(false);
      setIsCreatingRide(false);
    }
  };

  const handleAcceptDriver = async (driverId) => {
    if (driverDetails) {
      toast.warn('You have already accepted a driver for this delivery.');
      return;
    }
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`,
        { status: 'accepted', driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('passengerResponse', { deliveryId, response: 'accept', driverId });
      const acceptedDriver = interestedDrivers.find((d) => d._id === driverId);
      setDriverDetails(acceptedDriver);
      setInterestedDrivers([]);
      toast.success(`Driver ${driverId} accepted`);
    } catch (error) {
      toast.error('Failed to accept driver');
      console.error('Error accepting driver:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectDriver = async (driverId) => {
    try {
      setLoading(true);
      socket.emit('passengerResponse', { deliveryId, response: 'reject', driverId });
      setInterestedDrivers((prev) => prev.filter((d) => d._id !== driverId));
      toast.info(`Driver ${driverId} rejected`);
    } catch (error) {
      toast.error('Failed to reject driver');
      console.error('Error rejecting driver:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('rideCancelled', { deliveryId });
      setRideStarted(false);
      setDriverDetails(null);
      setDeliveryId(null);
      setInterestedDrivers([]);
      toast.success('Ride cancelled');
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !deliveryId || !driverDetails) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/chat`, {
        sender: passengerId,
        text: newMessage,
      });
      setChatMessages((prev) => [...prev, { sender: passengerId, text: newMessage }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const submitRatingAndReview = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`,
        { status: 'completed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/rate`, { rating, review });
      setRideStatus('completed');
      toast.success('Rating submitted');
    } catch (error) {
      toast.error('Error submitting rating');
      console.error('Error submitting rating:', error);
    }
  };

  const textColor = theme === 'light' ? 'text-black' : 'text-white';

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
            {passenger?.profilePicture && <img src={passenger.profilePicture} alt="Profile" />}
          </div>
        </button>
      </header>

      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <button onClick={() => setShowProfile(false)} className={theme === 'light' ? 'text-green-600 mb-4' : 'text-green-400 mb-4'}>Close</button>
            <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Profile</h2>
            <p className={textColor}>Name: {passenger?.userId?.firstName || 'N/A'}</p>
            <p className={textColor}>Email: {passenger?.userEmail || 'N/A'}</p>
            <p className={textColor}>Phone: {passenger?.phoneNumber || 'N/A'}</p>
            <h3 className={`text-lg font-semibold mt-4 ${textColor}`}>Ride History</h3>
            {rideHistory.map((ride) => (
              <div key={ride._id} className={`border p-2 mb-2 ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                <p className={textColor}>From: {ride.pickupAddress}</p>
                <p className={textColor}>To: {ride.destinationAddress}</p>
                <p className={textColor}>Price: ₦{ride.price}</p>
                <p className={textColor}>Status: {ride.status}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDriverModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <button onClick={() => setShowDriverModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-gray-700">
              <FaTimes size={20} />
            </button>
            <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Driver Proposal</h2>
            <p className={textColor}>Driver ID: {selectedDriver._id}</p>
            <p className={textColor}>Name: {selectedDriver.firstName} {selectedDriver.lastName || ''}</p>
            <p className={textColor}><FaPhone className="inline mr-1" /> {selectedDriver.phoneNumber || 'N/A'}</p>
            <p className={textColor}><FaCar className="inline mr-1" /> {selectedDriver.carModel || 'N/A'} ({selectedDriver.carColor || 'N/A'})</p>
            <p className={textColor}>Proposed Price: ₦{selectedDriver.negotiatedPrice || rideForm.price}</p>
            <p className={textColor}>Status: {selectedDriver.status === 'accept' ? 'Accepted' : 'Negotiated'}</p>
            <button onClick={() => handleAcceptDriver(selectedDriver._id)} className="bg-green-600 text-white p-2 mr-2" disabled={!!driverDetails || loading}>
              {loading ? 'Processing...' : 'Accept'}
            </button>
            <button onClick={() => handleRejectDriver(selectedDriver._id)} className="bg-red-600 text-white p-2" disabled={!!driverDetails || loading}>
              {loading ? 'Processing...' : 'Reject'}
            </button>
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
          <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Book A Delivery</h3>
          <form onSubmit={handleRideSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${textColor}`}>Pickup Address</label>
              <Autocomplete
                apiKey={googleMapsApiKey}
                onPlaceSelected={(place) => setRideForm((prev) => ({ ...prev, pickupAddress: place.formatted_address }))}
                options={{ types: ['geocode'], componentRestrictions: { country: 'ng' } }}
                value={rideForm.pickupAddress}
                onChange={(e) => setRideForm((prev) => ({ ...prev, pickupAddress: e.target.value }))}
                className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              />
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${textColor}`}>Destination Address</label>
              <Autocomplete
                apiKey={googleMapsApiKey}
                onPlaceSelected={(place) => setRideForm((prev) => ({ ...prev, destinationAddress: place.formatted_address }))}
                options={{ types: ['geocode'], componentRestrictions: { country: 'ng' } }}
                value={rideForm.destinationAddress}
                onChange={(e) => setRideForm((prev) => ({ ...prev, destinationAddress: e.target.value }))}
                className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              />
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${textColor}`}>Package Description</label>
              <input
                value={rideForm.packageDescription}
                onChange={(e) => setRideForm((prev) => ({ ...prev, packageDescription: e.target.value }))}
                className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                required
              />
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${textColor}`}>Package Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              />
              {rideForm.packageImage && (
                <img src={rideForm.packageImage} alt="Package" className="mt-2 w-32 h-32 object-cover rounded-lg" />
              )}
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${textColor}`}>Payment Method</label>
              <select
                value={rideForm.paymentMethod}
                onChange={(e) => setRideForm((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${textColor}`}>Your Price (₦)</label>
              <input
                type="number"
                value={rideForm.passengerPrice}
                onChange={(e) => setRideForm((prev) => ({ ...prev, passengerPrice: e.target.value }))}
                className={`w-full p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
              />
            </div>
            <button type="button" onClick={calculateDistanceAndFare} className="w-full py-2 bg-green-600 text-white rounded-lg mb-2">
              Calculate Fare
            </button>
            {rideForm.price && rideForm.distance && (
              <div className="mb-4">
                <p className={textColor}>Calculated Price: ₦{rideForm.price}</p>
                <p className={textColor}>Distance: {rideForm.distance} km</p>
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 bg-green-600 text-white rounded-lg ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Booking...' : 'Book Delivery'}
            </button>
            {deliveryId && !rideStarted && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${textColor}`}>Interested Drivers</h4>
                {interestedDrivers.length > 0 ? (
                  interestedDrivers.map((driver) => (
                    <div key={driver._id} className="flex justify-between items-center p-2 border mb-2">
                      <div>
                        <p className={textColor}>Driver ID: {driver._id}</p>
                        <p className={textColor}>Name: {driver.firstName} {driver.lastName || 'N/A'}</p>
                        <p className={textColor}><FaPhone className="inline mr-1" /> {driver.phoneNumber || 'N/A'}</p>
                        <p className={textColor}><FaCar className="inline mr-1" /> {driver.carModel || 'N/A'} ({driver.carColor || 'N/A'})</p>
                        <p className={textColor}>Price: ₦{driver.negotiatedPrice || rideForm.price}</p>
                        <p className={textColor}>Status: {driver.status === 'accept' ? 'Accepted' : 'Negotiated'}</p>
                      </div>
                      <div>
                        <button
                          onClick={() => handleAcceptDriver(driver._id)}
                          className="bg-green-600 text-white p-1 mr-2"
                          disabled={!!driverDetails || loading}
                        >
                          {loading ? 'Processing...' : 'Accept'}
                        </button>
                        <button
                          onClick={() => handleRejectDriver(driver._id)}
                          className="bg-red-600 text-white p-1"
                          disabled={!!driverDetails || loading}
                        >
                          {loading ? 'Processing...' : 'Reject'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={textColor}>Waiting for drivers to respond...</p>
                )}
              </div>
            )}
            {rideStarted && driverDetails && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${textColor}`}>Driver Assigned</h4>
                <p className={textColor}>Driver ID: {driverDetails._id}</p>
                <p className={textColor}>Name: {driverDetails.firstName} {driverDetails.lastName || 'N/A'}</p>
                <p className={textColor}><FaPhone className="inline mr-1" /> {driverDetails.phoneNumber || 'N/A'}</p>
                <p className={textColor}><FaCar className="inline mr-1" /> {driverDetails.carModel || 'N/A'} ({driverDetails.carColor || 'N/A'})</p>
                <p className={textColor}>Price: ₦{driverDetails.negotiatedPrice || rideForm.price}</p>
                {driverDetails.location && (
                  <p className={textColor}>Driver Location: Lat {driverDetails.location.lat}, Lng {driverDetails.location.lng}</p>
                )}
                <button onClick={handleCancelRide} className="w-full py-2 bg-red-600 text-white rounded-lg mt-2">Cancel Ride</button>
                <div className="mt-4">
                  <h4 className={`text-base font-semibold ${textColor}`}>Chat with Driver</h4>
                  <div className={`border p-2 rounded-lg h-24 overflow-y-auto ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                    {chatMessages.map((msg, index) => (
                      <p key={index} className={msg.sender === passengerId ? 'text-right text-blue-600' : `text-left ${textColor}`}>
                        {msg.sender === passengerId ? 'You' : 'Driver'}: {msg.text}
                      </p>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className={`flex-1 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                      placeholder="Type a message..."
                    />
                    <button onClick={sendChatMessage} className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg">Send</button>
                  </div>
                </div>
              </div>
            )}
            {rideStatus === 'completed' && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${textColor}`}>Rate Your Driver</h4>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className={`w-16 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                />
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className={`w-full p-2 border rounded-lg mt-2 ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                  placeholder="Write a review..."
                />
                <button onClick={submitRatingAndReview} className="w-full py-2 bg-green-600 text-white rounded-lg mt-2">Submit Rating</button>
              </div>
            )}
          </form>
        </div>
        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          <div ref={mapRef} className="w-full h-full rounded-lg" />
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Freight;