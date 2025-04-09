import { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft, FaInfoCircle, FaSun, FaMoon, FaCar, FaEye, FaTimes, FaRoute, FaPhone } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

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

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;
  const cloudinaryUploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const cloudinaryCloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    autoConnect: false,
  });

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

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
          }
        },
        (error) => {
          setRideForm((prev) => ({ ...prev, pickupAddress: 'Unable to fetch location' }));
        }
      );
    }

    if (token) {
      socket.connect();
      socket.on('driverNegotiation', ({ deliveryId, driverId, negotiatedPrice }) => {
        setInterestedDrivers((prev) => [...prev, { _id: driverId, negotiatedPrice }]);
        toast.info(`Driver ${driverId} negotiated ₦${negotiatedPrice}`);
      });
      socket.on('rideStarted', () => {
        setRideStarted(true);
        toast.success('Ride has started');
      });
      socket.on('newMessage', ({ senderId, message }) => {
        setChatMessages((prev) => [...prev, { sender: senderId, text: message }]);
      });
      socket.on('driverLocationUpdate', ({ lat, lng }) => {
        setDriverDetails((prev) => ({ ...prev, location: { lat, lng } }));
      });
    }

    return () => socket.disconnect();
  }, [token]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPassenger(response.data.data);
        setPassengerId(response.data.data?._id);
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
      setRideForm((prev) => ({ ...prev, distance, price: price }));
      console.log("your distance and fare!",distance, price)
      setShowMap(true);
      toast.success(`Fare: ₦${price} (Distance: ${distance} km)`);
    } catch (error) {
      toast.error('Error calculating fare');
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
      socket.emit('join', response.data._id);
      toast.success('Delivery booked successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to book delivery');
    } finally {
      setLoading(false);
      setIsCreatingRide(false);
    }
  };

  const handleAcceptDriver = (driverId) => {
    socket.emit('passengerResponse', { deliveryId, response: 'accept' });
    setDriverDetails({ _id: driverId });
    setInterestedDrivers([]);
  };

  const handleRejectDriver = (driverId) => {
    socket.emit('passengerResponse', { deliveryId, response: 'reject' });
    setInterestedDrivers((prev) => prev.filter((d) => d._id !== driverId));
  };

  const handleCancelRide = async () => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/status`,
        { status: 'cancelled' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setRideStarted(false);
      setDriverDetails(null);
      setDeliveryId(null);
      toast.success('Ride cancelled');
    } catch (error) {
      toast.error('Failed to cancel ride');
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !deliveryId) return;
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
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/rate`, { rating, review });
      toast.success('Rating submitted');
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const mapUrl = showMap
    ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(rideForm.pickupAddress)}&destination=${encodeURIComponent(rideForm.destinationAddress)}&mode=driving`
    : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=${currentLocation?.lat || 0},${currentLocation?.lng || 0}&zoom=15`;

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
            <p className={textColor}>Proposed Price: ₦{selectedDriver.negotiatedPrice || rideForm.price}</p>
            <button onClick={() => handleAcceptDriver(selectedDriver._id)} className="bg-green-600 text-white p-2 mr-2">Accept</button>
            <button onClick={() => handleRejectDriver(selectedDriver._id)} className="bg-red-600 text-white p-2">Reject</button>
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
                {interestedDrivers.map((driver) => (
                  <div key={driver._id} className="flex justify-between items-center p-2 border mb-2">
                    <div>
                      <p className={textColor}>Driver ID: {driver._id}</p>
                      <p className={textColor}>Price: ₦{driver.negotiatedPrice || rideForm.price}</p>
                    </div>
                    <div>
                      <button onClick={() => handleAcceptDriver(driver._id)} className="bg-green-600 text-white p-1 mr-2">Accept</button>
                      <button onClick={() => handleRejectDriver(driver._id)} className="bg-red-600 text-white p-1">Reject</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {rideStarted && driverDetails && (
              <div className="mt-4">
                <h4 className={`text-base font-semibold ${textColor}`}>Driver Assigned</h4>
                <p className={textColor}>Driver ID: {driverDetails._id}</p>
                <button onClick={handleCancelRide} className="w-full py-2 bg-red-600 text-white rounded-lg mt-2">Cancel Ride</button>
                <div className="mt-4">
                  <h4 className={`text-base font-semibold ${textColor}`}>Chat</h4>
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
                    />
                    <button onClick={sendChatMessage} className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg">Send</button>
                  </div>
                </div>
              </div>
            )}
            {rideStatus === 'completed' && (
              <div className="mt-4">
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
                  placeholder="Review"
                />
                <button onClick={submitRatingAndReview} className="w-full py-2 bg-green-600 text-white rounded-lg mt-2">Submit Rating</button>
              </div>
            )}
          </form>
        </div>
        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: '8px' }}
            loading="lazy"
            allowFullScreen
            src={mapUrl}
          />
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default Freight;