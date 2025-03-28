import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowLeft, FaSun, FaMoon } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function DriverFare() {
  // State Management
  const [driver, setDriver] = useState(null);
  const [driverId, setDriverId] = useState('');
  const [availableOffers, setAvailableOffers] = useState([]); // Pending offers with no driver
  const [assignedOffers, setAssignedOffers] = useState([]); // Offers assigned to this driver
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [rideStatus, setRideStatus] = useState('');
  const [rideProgress, setRideProgress] = useState(0);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [theme, setTheme] = useState('light');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // API Keys
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

  // Theme Toggle Function
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Fetch Driver Profile on Mount
  useEffect(() => {
    const fetchDriverProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in as a driver');
        toast.error('Please log in as a driver', { style: { background: '#F44336', color: 'white' } });
        navigate('/dlogin');
        return;
      }

      setLoading(true);
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status) {
          setDriver(response.data);
          setDriverId(response.data._id);
          toast.success('Welcome to your driver dashboard', { style: { background: '#4CAF50', color: 'white' } });
        } else {
          throw new Error(response.data.message || 'Failed to fetch driver profile');
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Error fetching profile';
        setError(errorMessage);
        toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/plogin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDriverProfile();
  }, [navigate]);

  // Fetch Delivery Offers
  useEffect(() => {
    if (!driverId) return;
    console.log("driver is here!!!!")

    const fetchDeliveryOffers = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/driver-offers/${driverId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        const { available, assigned } = response.data;
        console.log("all deliveries", response.data.available)
        setAvailableOffers(available.filter((offer) => offer.status === 'pending'));
        setAssignedOffers(assigned.filter((offer) => offer.status === 'pending'));
   
      } catch (error) {
        console.error('Error fetching delivery offers:', error);
        toast.error('Failed to load delivery offers', { style: { background: '#F44336', color: 'white' } });
      }
    };
    fetchDeliveryOffers();
  }, [driverId]);

  // Simulate Delivery Progress
  useEffect(() => {
    if (rideStatus !== 'accepted' || !selectedDelivery) return;

    const interval = setInterval(() => {
      setRideProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setRideStatus('completed');
          updateDeliveryStatus('completed');
          toast.success('Delivery completed', { style: { background: '#4CAF50', color: 'white' } });
          return 100;
        }

        const newProgress = prev + 2;
        if (newProgress < 50) {
          setRideStatus('en route to pickup');
          if (newProgress === 2) toast.info('Heading to pickup location');
        } else if (newProgress === 50) {
          setRideStatus('at pickup');
          toast.success('Arrived at pickup location');
        } else {
          setRideStatus('en route to destination');
        }
        return newProgress;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [rideStatus, selectedDelivery]);

  // Fetch Chat Messages for Selected Delivery
  useEffect(() => {
    if (!selectedDelivery || rideStatus !== 'accepted') return;

    const fetchChat = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${selectedDelivery._id}/chat`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setChatMessages(response.data.messages);
      } catch (error) {
        console.error('Error fetching chat:', error);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 5000);
    return () => clearInterval(interval);
  }, [selectedDelivery, rideStatus]);

  // Handle Accept Delivery
  const handleAcceptDelivery = async (delivery) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${delivery._id}/driverstatus`,
        { status: 'accepted', driverId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setSelectedDelivery(response.data);
      setRideStatus('accepted');
      setShowMap(true);
      setAvailableOffers((prev) => prev.filter((offer) => offer._id !== delivery._id));
      setAssignedOffers((prev) => prev.filter((offer) => offer._id !== delivery._id));
      toast.success('Delivery accepted', { style: { background: '#4CAF50', color: 'white' } });
    } catch (error) {
      console.error('Error accepting delivery:', error);
      toast.error('Failed to accept delivery', { style: { background: '#F44336', color: 'white' } });
    }
  };

  // Handle Reject Delivery
  const handleRejectDelivery = async (delivery) => {
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${delivery._id}/driverstatus`,
        { status: 'rejected', driverId },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setAvailableOffers((prev) => prev.filter((offer) => offer._id !== delivery._id));
      setAssignedOffers((prev) => prev.filter((offer) => offer._id !== delivery._id));
      toast.info('Delivery rejected', { style: { background: '#FFA500', color: 'white' } });
    } catch (error) {
      console.error('Error rejecting delivery:', error);
      toast.error('Failed to reject delivery', { style: { background: '#F44336', color: 'white' } });
    }
  };

  // Update Delivery Status
  const updateDeliveryStatus = async (status) => {
    if (!selectedDelivery) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${selectedDelivery._id}/driverstatus`,
        { status },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
    } catch (error) {
      console.error('Error updating delivery status:', error);
    }
  };

  // Send Chat Message
  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedDelivery) return;

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${selectedDelivery._id}/chat`,
        { sender: 'driver', text: newMessage },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setChatMessages((prev) => [...prev, { sender: 'driver', text: newMessage }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending chat message:', error);
      toast.error('Failed to send message', { style: { background: '#F44336', color: 'white' } });
    }
  };

  // Map URL for Selected Delivery
  const mapUrl =
    selectedDelivery && showMap
      ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(
          selectedDelivery.pickupAddress
        )}&destination=${encodeURIComponent(selectedDelivery.destinationAddress)}&mode=driving`
      : '';

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      {/* Header */}
      <header
        className={`flex items-center justify-between p-4 shadow-md ${
          theme === 'light' ? 'bg-white' : 'bg-gray-700'
        }`}
      >
        <div className="flex items-center space-x-2">
          <button
            onClick={() => navigate('/driver-dashboard')}
            className={theme === 'light' ? 'text-gray-600' : 'text-white'}
          >
            <FaArrowLeft size={20} />
          </button>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={toggleTheme} className={theme === 'light' ? 'text-gray-600' : 'text-white'}>
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
          </button>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            {driver?.profilePicture && (
              <img src={driver.profilePicture} alt="Driver" className="w-full h-full object-cover" />
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4">
        {/* Left Side: Delivery Offers and Actions */}
        <div
          className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${
            theme === 'light' ? 'bg-white' : 'bg-gray-700'
          }`}
        >
          <h3
            className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}
          >
            Delivery Offers
          </h3>

          {loading && <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Loading...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {/* Available Delivery Offers */}
          {!selectedDelivery && availableOffers.length > 0 && (
            <>
              <h4
                className={`text-base font-semibold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}
              >
                Available Offers
              </h4>
              {availableOffers.map((offer) => (
                <div
                  key={offer._id}
                  className={`p-4 mb-4 rounded-lg border ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}
                >
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Pickup:</strong> {offer.pickupAddress}
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Destination:</strong> {offer.destinationAddress}
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Package:</strong> {offer.packageDescription}
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Distance:</strong> {offer.distance} km
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Fare:</strong> ₦{offer.price}
                  </p>
                  {offer.packagePicture && (
                    <img
                      src={offer.packagePicture}
                      alt="Package"
                      className="mt-2 w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleAcceptDelivery(offer)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectDelivery(offer)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {/* Assigned Delivery Offers */}
          {!selectedDelivery && assignedOffers.length > 0 && (
            <>
              <h4
                className={`text-base font-semibold mb-2 mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}
              >
                Assigned Offers
              </h4>
              {assignedOffers.map((offer) => (
                <div
                  key={offer._id}
                  className={`p-4 mb-4 rounded-lg border ${
                    theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                  }`}
                >
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Pickup:</strong> {offer.pickupAddress}
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Destination:</strong> {offer.destinationAddress}
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Package:</strong> {offer.packageDescription}
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Distance:</strong> {offer.distance} km
                  </p>
                  <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                    <strong>Fare:</strong> ₦{offer.price}
                  </p>
                  {offer.packagePicture && (
                    <img
                      src={offer.packagePicture}
                      alt="Package"
                      className="mt-2 w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex space-x-2 mt-4">
                    <button
                      onClick={() => handleAcceptDelivery(offer)}
                      className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleRejectDelivery(offer)}
                      className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

          {!selectedDelivery && availableOffers.length === 0 && assignedOffers.length === 0 && (
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
              No pending delivery offers available.
            </p>
          )}

          {/* Selected Delivery Details */}
          {selectedDelivery && (
            <>
              <div
                className={`p-4 mb-4 rounded-lg border ${
                  theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                }`}
              >
                <h4
                  className={`text-base font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}
                >
                  Current Delivery
                </h4>
                <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                  <strong>Pickup:</strong> {selectedDelivery.pickupAddress}
                </p>
                <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                  <strong>Destination:</strong> {selectedDelivery.destinationAddress}
                </p>
                <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                  <strong>Package:</strong> {selectedDelivery.packageDescription}
                </p>
                <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>
                  <strong>Fare:</strong> ₦{selectedDelivery.price}
                </p>
                {selectedDelivery.packagePicture && (
                  <img
                    src={selectedDelivery.packagePicture}
                    alt="Package"
                    className="mt-2 w-24 h-24 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Delivery Status and Progress */}
              {rideStatus && (
                <div className="mt-4">
                  <h4
                    className={`text-base font-semibold ${
                      theme === 'light' ? 'text-gray-800' : 'text-white'
                    }`}
                  >
                    Status: {rideStatus}
                  </h4>
                  <div
                    className={`w-full rounded-full h-2 mt-2 ${
                      theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'
                    }`}
                  >
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{ width: `${rideProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Chat with Passenger */}
              {rideStatus === 'accepted' && (
                <div className="mt-4">
                  <h4
                    className={`text-base font-semibold ${
                      theme === 'light' ? 'text-gray-800' : 'text-white'
                    }`}
                  >
                    Chat with Passenger
                  </h4>
                  <div
                    className={`border p-2 rounded-lg h-24 overflow-y-auto ${
                      theme === 'light' ? 'border-gray-200' : 'border-gray-600'
                    }`}
                  >
                    {chatMessages.map((msg, index) => (
                      <p
                        key={index}
                        className={
                          msg.sender === 'driver'
                            ? 'text-right text-blue-600'
                            : `text-left ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`
                        }
                      >
                        {msg.sender === 'driver' ? 'You' : 'Passenger'}: {msg.text}
                      </p>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className={`flex-1 p-2 border rounded-lg ${
                        theme === 'light'
                          ? 'border-gray-200 bg-white text-gray-800'
                          : 'border-gray-600 bg-gray-700 text-white'
                      }`}
                      placeholder="Type a message..."
                    />
                    <button
                      onClick={sendChatMessage}
                      className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          {showMap && selectedDelivery ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
              loading="lazy"
              allowFullScreen
              src={mapUrl}
              onLoad={() => console.log('Iframe map loaded')}
              onError={(error) => console.error('Error loading iframe map:', error)}
            />
          ) : (
            <div
              className={`h-full rounded-lg flex items-center justify-center ${
                theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'
              }`}
            >
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>
                Accept a delivery to view the map
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default DriverFare;