import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSun, FaMoon, FaCar, FaPhone, FaEye } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

function FreightDriver() {
  const [offers, setOffers] = useState({ available: [], assigned: [] });
  const [driverId, setDriverId] = useState('');
  const [theme, setTheme] = useState('dark');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [negotiatedPrice, setNegotiatedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverActions, setDriverActions] = useState({});
  const [distances, setDistances] = useState({});

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;
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
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Location access denied:", error.message);
          setCurrentLocation({ lat: 6.5244, lng: 3.3792 }); // Fallback to Lagos
        }
      );
    }

    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDriverId(response.data.data?._id);
      } catch (error) {
        toast.error('Please log in', { style: { background: '#F44336', color: 'white' } });
        navigate('/dlogin');
      }
    };
    fetchProfile();

    if (token) {
      socket.connect();
      socket.on('newDelivery', (delivery) => {
        setOffers((prev) => {
          // Avoid duplicates by checking if delivery already exists
          if (prev.available.some((d) => d._id === delivery._id)) return prev;
          return { ...prev, available: [...prev.available, delivery] };
        });
        toast.info('New delivery available');
      });
      socket.on('passengerResponse', ({ deliveryId, response }) => {
        console.log('Passenger Response:', { deliveryId, response });
        if (response === 'accept') {
          setOffers((prev) => ({
            available: prev.available.filter((d) => d._id !== deliveryId),
            assigned: prev.assigned.concat(prev.available.find((d) => d._id === deliveryId)),
          }));
          toast.success('Passenger accepted your offer');
        } else if (response === 'reject') {
          setOffers((prev) => ({
            ...prev,
            assigned: prev.assigned.filter((d) => d._id !== deliveryId),
          }));
          toast.info('Passenger rejected your offer');
        }
      });
      
      socket.on('newMessage', ({ senderId, message }) => {
        setChatMessages((prev) => [...prev, { sender: senderId, text: message }]);
      });
      socket.on('rideCancelled', ({ deliveryId }) => {
        setOffers((prev) => ({
          ...prev,
          assigned: prev.assigned.filter((d) => d._id !== deliveryId),
        }));
        setSelectedDelivery(null);
        toast.error('Ride cancelled by passenger');
      });
    }

    return () => socket.disconnect();
  }, [token, navigate]);

  useEffect(() => {
    if (driverId) {
      const fetchOffers = async () => {
        try {
          const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/driver-offers/${driverId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          // Ensure no duplicates in initial fetch
          const uniqueAvailable = response.data.available.filter(
            (d, index, self) => index === self.findIndex((t) => t._id === d._id)
          );
          const uniqueAssigned = response.data.assigned.filter(
            (d, index, self) => index === self.findIndex((t) => t._id === d._id)
          );
          setOffers({ available: uniqueAvailable, assigned: uniqueAssigned });
        } catch (error) {
          console.error('Error fetching offers:', error);
        }
      };
      fetchOffers();
    }
  }, [driverId, token]);

  useEffect(() => {
    if (!currentLocation || (!offers.available.length && !offers.assigned.length)) return;

    const calculateDistances = async () => {
      const newDistances = {};
      const allDeliveries = [...offers.available, ...offers.assigned];
      for (const delivery of allDeliveries) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/directions/json?origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(delivery.pickupAddress)}&key=${googleMapsApiKey}`
          );
          const route = response.data.routes[0];
          if (route) {
            newDistances[delivery._id] = route.legs[0].distance.text;
          }
        } catch (error) {
          console.error(`Error calculating distance for delivery ${delivery._id}:`, error);
          newDistances[delivery._id] = 'N/A';
        }
      }
      setDistances(newDistances);
    };

    calculateDistances();
  }, [currentLocation, offers, googleMapsApiKey]);

  const handleAccept = async (deliveryId) => {
    if (driverActions[deliveryId]) {
      toast.warn('You have already taken an action on this delivery.');
      return;
    }
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/driverstatus`,
        { status: 'accepted', driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('driverResponse', { deliveryId, driverId, response: 'accept' });
      setDriverActions((prev) => ({ ...prev, [deliveryId]: 'accepted' }));
      toast.success('Offer accepted');
    } catch (error) {
      toast.error('Failed to accept offer');
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiate = async (deliveryId) => {
    if (driverActions[deliveryId]) {
      toast.warn('You have already taken an action on this delivery.');
      return;
    }
    if (!negotiatedPrice) {
      toast.error('Please enter a negotiated price');
      return;
    }
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/driverstatus`,
        { status: 'negotiating', driverId, negotiatedPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('driverResponse', { deliveryId, driverId, response: 'negotiate', negotiatedPrice });
      setDriverActions((prev) => ({ ...prev, [deliveryId]: 'negotiated' }));
      toast.info('Negotiation sent');
    } catch (error) {
      toast.error('Failed to negotiate');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async (deliveryId) => {
    if (driverActions[deliveryId]) {
      toast.warn('You have already taken an action on this delivery.');
      return;
    }
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/driverstatus`,
        { status: 'rejected', driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('driverResponse', { deliveryId, driverId, response: 'reject' });
      setOffers((prev) => ({
        ...prev,
        available: prev.available.filter((d) => d._id !== deliveryId),
      }));
      setDriverActions((prev) => ({ ...prev, [deliveryId]: 'rejected' }));
      toast.info('Delivery rejected');
    } catch (error) {
      toast.error('Failed to reject delivery');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRide = async (deliveryId) => {
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/driverstatus`,
        { status: 'in_progress', driverId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('startRide', { deliveryId });
      toast.success('Ride started');
    } catch (error) {
      toast.error('Failed to start ride');
    } finally {
      setLoading(false);
    }
  };

  const updateLocation = async (deliveryId) => {
    if (!currentLocation) return;
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/delivery/${deliveryId}/location`,
        { lat: currentLocation.lat, lng: currentLocation.lng },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      socket.emit('updateDriverLocation', { deliveryId, lat: currentLocation.lat, lng: currentLocation.lng });
    } catch (error) {
      console.error('Error updating location:', error);
    }
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !selectedDelivery) return;
    try {
      await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/delivery/${selectedDelivery}/chat`, {
        sender: driverId,
        text: newMessage,
      });
      setChatMessages((prev) => [...prev, { sender: driverId, text: newMessage }]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };


  useEffect((deliveryId) => {
    if (deliveryId) {
      const interval = setInterval(() => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            socket.emit('updateDriverLocation', { deliveryId, lat: latitude, lng: longitude });
          },
          (error) => console.error('Geolocation error:', error)
        );
      }, 5000); // Every 5 seconds
      return () => clearInterval(interval);
    }
  }, []);

  // Fixed mapUrl with proper encoding and fallback
  const mapUrl = selectedDelivery && currentLocation
    ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${currentLocation.lat},${currentLocation.lng}&destination=${encodeURIComponent(offers.assigned.find((d) => d._id === selectedDelivery)?.destinationAddress || '')}&mode=driving`
    : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=${currentLocation?.lat || 6.5244},${currentLocation?.lng || 3.3792}&zoom=15`;

  const textColor = theme === 'light' ? 'text-gray-800' : 'text-white';

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <button onClick={toggleTheme} className="text-gray-600 hover:text-gray-800">
          {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} className="text-white" />}
        </button>
        <h2 className={textColor}>Freight Deliveries</h2>
      </header>

      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
          <h3 className={`text-lg font-bold mb-4 ${textColor}`}>Available Deliveries</h3>
          {offers.available.map((delivery) => (
            <div key={delivery._id} className={`border p-2 mb-2 ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
              <p className={textColor}>Passenger: {delivery.passengerAuth?.firstName} {delivery.passengerAuth?.lastName || ''}</p>
              <p className={textColor}><FaPhone className="inline mr-1" /> {delivery.passengerAuth?.phoneNumber || 'N/A'}</p>
              <p className={textColor}>From: {delivery.pickupAddress}</p>
              <p className={textColor}>To: {delivery.destinationAddress}</p>
              <p className={textColor}>Distance: {distances[delivery._id] || 'Calculating...'}</p>
              <p className={textColor}>Passenger Price: ₦{delivery.passengerPrice || delivery.price}</p>
              {!driverActions[delivery._id] && (
                <>
                  <input
                    type="number"
                    value={negotiatedPrice}
                    onChange={(e) => setNegotiatedPrice(e.target.value)}
                    className={`w-full p-2 border rounded-lg mt-2 ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                    placeholder="Negotiate Price"
                  />
                  <div className="flex space-x-2 mt-2">
                    <button onClick={() => handleAccept(delivery._id)} className="bg-green-600 text-white p-1 flex-1" disabled={loading}>
                      {loading ? 'Processing...' : 'Accept'}
                    </button>
                    <button onClick={() => handleNegotiate(delivery._id)} className="bg-yellow-600 text-white p-1 flex-1" disabled={loading}>
                      {loading ? 'Processing...' : 'Negotiate'}
                    </button>
                    <button onClick={() => handleReject(delivery._id)} className="bg-red-600 text-white p-1 flex-1" disabled={loading}>
                      {loading ? 'Processing...' : 'Reject'}
                    </button>
                  </div>
                </>
              )}
              {driverActions[delivery._id] === 'accepted' && <p className="text-green-400 mt-2">Accepted</p>}
              {driverActions[delivery._id] === 'negotiated' && <p className="text-yellow-400 mt-2">Negotiated (₦{negotiatedPrice})</p>}
            </div>
          ))}

          <h3 className={`text-lg font-bold mb-4 mt-4 ${textColor}`}>Assigned Deliveries</h3>
          {offers.assigned.map((delivery) => (
            <div key={delivery._id} className={`border p-2 mb-2 ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
              <p className={textColor}>Passenger: {delivery.passengerAuth?.firstName} {delivery.passengerAuth?.lastName || ''}</p>
              <p className={textColor}><FaPhone className="inline mr-1" /> {delivery.passengerAuth?.phoneNumber || 'N/A'}</p>
              <div className="flex items-center mt-2">
                <img
                  src={delivery.passengerAuth?.profilePicture || 'https://via.placeholder.com/50'}
                  alt={`${delivery.passengerAuth?.firstName}'s profile`}
                  className="w-12 h-12 rounded-full mr-2"
                />
                <button
                  onClick={() => window.open(delivery.passengerAuth?.profilePicture || 'https://via.placeholder.com/50', '_blank')}
                  className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'} hover:underline`}
                >
                  <FaEye className="inline mr-1" /> View Picture
                </button>
              </div>
              <p className={textColor}>From: {delivery.pickupAddress}</p>
              <p className={textColor}>To: {delivery.destinationAddress}</p>
              <p className={textColor}>Distance: {distances[delivery._id] || 'Calculating...'}</p>
              <p className={textColor}>Price: ₦{delivery.driverNegotiatedPrice || delivery.passengerPrice || delivery.price}</p>
              <p className={textColor}>Status: {delivery.status}</p>
              {delivery.status === 'accepted' && (
                <button onClick={() => { setSelectedDelivery(delivery._id); handleStartRide(delivery._id); }} className="bg-green-600 text-white p-1 mt-2 w-full" disabled={loading}>
                  {loading ? 'Processing...' : 'Start Ride'}
                </button>
              )}
              {delivery.status === 'in_progress' && (
                <button onClick={() => updateLocation(delivery._id)} className="bg-blue-600 text-white p-1 mt-2 w-full" disabled={loading}>
                  {loading ? 'Processing...' : 'Update Location'}
                </button>
              )}
            </div>
          ))}

          {selectedDelivery && (
            <div className="mt-4">
              <h4 className={`text-base font-semibold ${textColor}`}>Chat</h4>
              <div className={`border p-2 rounded-lg h-24 overflow-y-auto ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                {chatMessages.map((msg, index) => (
                  <p key={index} className={msg.sender === driverId ? 'text-right text-blue-600' : `text-left ${textColor}`}>
                    {msg.sender === driverId ? 'You' : 'Passenger'}: {msg.text}
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
          )}
        </div>
        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          {mapUrl ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px' }}
              loading="lazy"
              allowFullScreen
              src={mapUrl}
            />
          ) : (
            <p className={textColor}>Map unavailable. Please check your location or select a delivery.</p>
          )}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default FreightDriver;