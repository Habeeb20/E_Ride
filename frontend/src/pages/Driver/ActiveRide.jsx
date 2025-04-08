import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { FaPhone, FaSun, FaMoon, FaPaperPlane, FaCar, FaCheck } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, { autoConnect: true, 
    reconnection: true, 
    reconnectionAttempts: Infinity, 
    reconnectionDelay: 1000,});

function ActiveRide() {
  const [activeRide, setActiveRide] = useState(null);
  const [passengerLocation, setPassengerLocation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [currentLocation, setCurrentLocation] = useState(null);
  const token = localStorage.getItem('token');
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;
  const messagesEndRef = useRef(null);

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error('Location access denied:', error.message);
          toast.error('Unable to fetch location', { style: { background: '#F44336', color: 'white' } });
        }
      );
    }
  }, []);
  useEffect(() => {
    if (!token) {
      toast.error('Please log in', { style: { background: '#F44336', color: 'white' } });
      return;
    }
  
    socket.connect();
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id); // Confirm connection
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error); // Log connection issues
    });
    socket.on('rideAccepted', (data) => {
      console.log('Received rideAccepted:', data); // This should appear
      const rideData = {
        ...data.passenger,
        _id: data.passenger.rideId,
        pickupCoordinates: data.passenger.pickupCoordinates,
        destinationAddress: data.passenger.destinationCoordinates || 'Destination',
        status: 'accepted',
        pickupAddress: 'Pickup Location',
        calculatedPrice: 0,
      };
      setActiveRide(rideData);
      setPassengerLocation(data.passenger.pickupCoordinates);
      toast.success(`Ride accepted by ${data.passenger.firstName}!`, {
        style: { background: '#4CAF50', color: 'white' },
      });
    });
    socket.on('passengerLocationUpdate', (location) => {
      setPassengerLocation(location);
    });
    socket.on('message', (message) => {
      setMessages((prev) => [...prev, message]);
    });
  
    const fetchDriverProfile = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status) {
          const driverId = response.data.data._id;
          console.log('Joining room with driverId:', driverId);
          socket.emit('join', driverId);
        }
      } catch (error) {
        toast.error('Failed to fetch driver profile', { style: { background: '#F44336', color: 'white' } });
      }
    };
  
    fetchDriverProfile();
  
    return () => {
      socket.off('rideAccepted');
      socket.off('passengerLocationUpdate');
      socket.off('message');
      socket.disconnect();
    };
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !activeRide) return;

    const message = {
      rideId: activeRide._id,
      sender: 'driver',
      content: newMessage,
      timestamp: new Date(),
    };

    socket.emit('message', message);
    setMessages((prev) => [...prev, message]);
    setNewMessage('');
  };

  const startRide = async () => {
    if (!activeRide) return;
    setLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${activeRide._id}/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRide((prev) => ({ ...prev, status: 'in-progress' }));
      toast.success('Ride started!', { style: { background: '#4CAF50', color: 'white' } });
    } catch (error) {
      toast.error('Failed to start ride', { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const completeRide = async () => {
    if (!activeRide) return;
    setLoading(true);
    try {
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${activeRide._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActiveRide((prev) => ({ ...prev, status: 'completed' }));
      toast.success('Ride completed!', { style: { background: '#4CAF50', color: 'white' } });
      setTimeout(() => setActiveRide(null), 2000);
    } catch (error) {
      toast.error('Failed to complete ride', { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const mapUrl = () =>
    passengerLocation && currentLocation
      ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${currentLocation.lat},${currentLocation.lng}&destination=${passengerLocation.lat},${passengerLocation.lng}&mode=driving`
      : activeRide?.pickupCoordinates && currentLocation
      ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${currentLocation.lat},${currentLocation.lng}&destination=${activeRide.pickupCoordinates.lat},${activeRide.pickupCoordinates.lng}&mode=driving`
      : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=${currentLocation?.lat || 0},${currentLocation?.lng || 0}&zoom=15`;

  const calculateDistance = (coords) => {
    if (!coords || !currentLocation) return 'N/A';
    const R = 6371;
    const dLat = (coords.lat - currentLocation.lat) * (Math.PI / 180);
    const dLng = (coords.lng - currentLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentLocation.lat * (Math.PI / 180)) * Math.cos(coords.lat * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2);
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} p-6`}>
      <header className={`flex justify-between items-center mb-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} p-4 rounded-lg shadow-md`}>
        <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Active Ride</h2>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          {theme === 'light' ? <FaMoon className="text-gray-600" size={20} /> : <FaSun className="text-yellow-300" size={20} />}
        </button>
      </header>

      {!activeRide ? (
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>No active ride. Waiting for a passenger to accept...</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`flex flex-col gap-4 ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} p-4 rounded-lg shadow-md`}>
            <div className="space-y-2">
              <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride ID: {activeRide._id}</p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">Passenger:</span>{' '}
                <span className="text-green-600">{activeRide.firstName}</span>
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">Phone:</span>{' '}
                <a href={`tel:${activeRide.phoneNumber}`} className="text-green-600 hover:underline flex items-center">
                  <FaPhone className="mr-1" /> {activeRide.phoneNumber || 'N/A'}
                </a>
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">From:</span> {activeRide.pickupAddress}
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">To:</span> {activeRide.destinationAddress}
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">Distance:</span>{' '}
                {passengerLocation ? calculateDistance(passengerLocation) : calculateDistance(activeRide.pickupCoordinates)} km
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">Price:</span> ₦{activeRide.calculatedPrice}
              </p>
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                <span className="font-semibold">Status:</span>{' '}
                <span className="text-green-600">{activeRide.status.charAt(0).toUpperCase() + activeRide.status.slice(1)}</span>
              </p>
            </div>

            <div className="flex gap-2">
              {activeRide.status === 'accepted' && (
                <button
                  onClick={startRide}
                  className="flex items-center gap-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  disabled={loading}
                >
                  <FaCar /> {loading ? 'Starting...' : 'Start Ride'}
                </button>
              )}
              {activeRide.status === 'in-progress' && (
                <button
                  onClick={completeRide}
                  className="flex items-center gap-1 py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  disabled={loading}
                >
                  <FaCheck /> {loading ? 'Completing...' : 'Complete Ride'}
                </button>
              )}
            </div>

            <div className="flex-1 flex flex-col mt-4">
              <h3 className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Chat with Passenger</h3>
              <div className={`flex-1 max-h-64 overflow-y-auto p-2 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-600'}`}>
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`mb-2 p-2 rounded-lg ${msg.sender === 'driver' ? 'bg-blue-500 text-white ml-auto' : 'bg-green-500 text-white'} max-w-xs`}
                  >
                    <p>{msg.content}</p>
                    <span className="text-xs opacity-75">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  className={`flex-1 p-2 rounded-lg border ${theme === 'light' ? 'bg-white text-gray-800 border-gray-300' : 'bg-gray-800 text-white border-gray-600'}`}
                  placeholder="Type a message..."
                />
                <button onClick={sendMessage} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>

          <div className="h-96 lg:h-auto">
            {currentLocation ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
                loading="lazy"
                allowFullScreen
                src={mapUrl()}
              />
            ) : (
              <div className={`h-full rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
                <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Fetching location...</p>
              </div>
            )}
          </div>
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ActiveRide;