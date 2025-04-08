import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCar, FaMapMarkerAlt, FaPhone, FaSun, FaMoon } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

function PassengerRides() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const token = localStorage.getItem('token');
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    if (!token) {
      toast.error('Please log in', { style: { background: '#F44336', color: 'white' } });
      return;
    }

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    socket.on('rideStatusUpdate', (data) => {
      console.log('Received rideStatusUpdate:', data);
      setRides((prevRides) =>
        prevRides.map((ride) =>
          ride._id === data.rideId ? { ...ride, status: data.status, driver: data.driver } : ride
        )
      );
      toast.info(`Ride ${data.rideId} updated to ${data.status}`, {
        style: { background: '#2196F3', color: 'white' },
      });
    });

    const fetchPassengerProfileAndRides = async () => {
      try {
        const profileResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileResponse.data.status) {
          const passengerId = profileResponse.data.data._id;
          socket.emit('joinPassenger', passengerId);

          const ridesResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rides/passenger/booked`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setRides(ridesResponse.data.rides);
          console.log('My previous rides:', ridesResponse.data.rides);
        }
      } catch (error) {
        toast.error('Failed to fetch rides', { style: { background: '#F44336', color: 'white' } });
      } finally {
        setLoading(false);
      }
    };

    fetchPassengerProfileAndRides();

    return () => {
      socket.off('rideStatusUpdate');
      socket.disconnect();
    };
  }, [token]);

  const calculateDistance = (pickup, destination) => {
    if (!pickup || !destination) return 'N/A';
    const R = 6371; // Earth's radius in km
    const dLat = (destination.lat - pickup.lat) * (Math.PI / 180);
    const dLng = (destination.lng - pickup.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(pickup.lat * (Math.PI / 180)) * Math.cos(destination.lat * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in km
  };

  const getMapUrl = (ride) => {
    if (!ride.pickupCoordinates || !ride.destinationCoordinates) {
      return `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}¢er=0,0&zoom=2`;
    }
    return `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${ride.pickupCoordinates.lat},${ride.pickupCoordinates.lng}&destination=${ride.destinationCoordinates.lat},${ride.destinationCoordinates.lng}&mode=driving`;
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} p-6`}>
      <header className={`flex justify-between items-center mb-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} p-4 rounded-lg shadow-md`}>
        <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Your Booked Rides</h2>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <FaMoon className="text-gray-600" size={20} />
          ) : (
            <FaSun className="text-yellow-300" size={20} />
          )}
        </button>
      </header>

      {loading ? (
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Loading rides...</p>
      ) : rides.length === 0 ? (
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>No rides booked yet.</p>
      ) : (
        <div className="space-y-6">
          {rides.map((ride) => (
            <div
              key={ride._id}
              className={`${theme === 'light' ? 'bg-white text-gray-800' : 'bg-gray-700 text-gray-100'} p-4 rounded-lg shadow-md grid grid-cols-1 lg:grid-cols-2 gap-4`}
            >
              <div className="space-y-2">
                <p className="font-semibold">Ride ID: {ride._id}</p>
                <p>
                  <span className="font-semibold">From:</span> {ride.pickupAddress}
                </p>
                <p>
                  <span className="font-semibold">To:</span> {ride.destinationAddress}
                </p>
                <p>
                  <span className="font-semibold">Distance:</span> {calculateDistance(ride.pickupCoordinates, ride.destinationCoordinates)} km
                </p>
                <p>
                  <span className="font-semibold">Price:</span> ₦{ride.finalPrice}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span
                    className={`${
                      ride.status === 'cancelled'
                        ? 'text-red-600'
                        : ride.status === 'pending'
                        ? 'text-yellow-400'
                        : 'text-green-600'
                    }`}
                  >
                    {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
                  </span>
                </p>
                {ride.driver ? (
                  <div className="mt-2">
                    <p className="font-semibold">Driver Picture:</p>
                    <div className="flex items-center space-x-4">
                    <img
                      className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                      src={ride.driver?.profilePicture || "https://via.placeholder.com/150"}
                      alt={`${ride.driver?.firstName} ${ride.driver?.lastName}`}
                    />
                    <button
                      onClick={() =>
                        window.open(
                          ride.driver?.profilePicture || "https://via.placeholder.com/150",
                          "_blank"
                        )
                      }
                      className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                    >
                      View
                    </button>
                  </div>
                    <p>
                      <span className="font-semibold">Name:</span> {ride.driver.userEmail || 'N/A'}
                    </p>
                    <p>
                      <span className="font-semibold">Phone:</span>{' '}
                      <a
                        href={`tel:${ride.driver.phoneNumber}`}
                        className={`${theme === 'light' ? 'text-green-600 hover:underline' : 'text-green-400 hover:underline'} flex items-center`}
                      >
                        <FaPhone className="mr-1" /> {ride.driver.phoneNumber || 'N/A'}
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold">Car:</span>{' '}
                      {ride.driver.carDetails.product} {ride.driver.carDetails.model} ({ride.driver.carDetails.year})
                      <div className="flex items-center space-x-4">
                    <img
                      className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                      src={ride.driver?.carPicture || "https://via.placeholder.com/150"}
                      alt={`${ride.driver?.firstName} ${ride.driver?.lastName}`}
                    />
                    <button
                      onClick={() =>
                        window.open(
                          ride.driver?.carPicture || "https://via.placeholder.com/150",
                          "_blank"
                        )
                      }
                      className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                    >
                      View
                    </button>
                  </div>
                    </p>
                    <p>
                      <span className="font-semibold">Rating:</span> {ride.driver.rating || 'N/A'}
                    </p>
                  </div>
                ) : (
                  <p>No driver assigned yet.</p>
                )}
              </div>

              <div className="h-64 lg:h-auto">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
                  loading="lazy"
                  allowFullScreen
                  src={getMapUrl(ride)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default PassengerRides;