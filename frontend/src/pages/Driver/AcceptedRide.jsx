import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPhone, FaSun, FaMoon } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AcceptedRide() {
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [theme, setTheme] = useState('dark'); // Theme state
  const token = localStorage.getItem('token');
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

  // Toggle theme between light and dark
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Fetch current location
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

  // Fetch driver profile to get driverId
  const fetchDriverProfile = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        return response.data.data._id; // Assuming _id is the Profile ID
      }
    } catch (error) {
      toast.error('Failed to fetch driver profile', { style: { background: '#F44336', color: 'white' } });
      return null;
    }
  };

  // Fetch accepted rides
  useEffect(() => {
    const fetchAcceptedRides = async () => {
      if (!token) {
        toast.error('Please log in', { style: { background: '#F44336', color: 'white' } });
        return;
      }

      setLoading(true);
      try {
        const driverId = await fetchDriverProfile();
        if (!driverId) return;

        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rides/driver/accepted/${driverId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAcceptedRides(response.data);
        console.log("my accepted ride!!!", response.data)
      } catch (error) {
        console.error('Error fetching accepted rides:', error);
        toast.error('Failed to load accepted rides', { style: { background: '#F44336', color: 'white' } });
      } finally {
        setLoading(false);
      }
    };
    fetchAcceptedRides();
  }, [token]);

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
  };

  const mapUrl = (ride) =>
    ride.pickupCoordinates && currentLocation
      ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${currentLocation.lat},${currentLocation.lng}&destination=${ride.pickupCoordinates.lat},${ride.pickupCoordinates.lng}&mode=driving`
      : `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(ride.pickupAddress)}&destination=${encodeURIComponent(ride.destinationAddress)}&mode=driving`;

  const calculateDistance = (coords) => {
    if (!coords || !currentLocation) return 'N/A';
    const R = 6371; // Earth's radius in km
    const dLat = (coords.lat - currentLocation.lat) * (Math.PI / 180);
    const dLng = (coords.lng - currentLocation.lng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentLocation.lat * (Math.PI / 180)) * Math.cos(coords.lat * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(2); // Distance in km
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} p-6`}>
      {/* Header with Theme Toggle */}
      <header className={`flex justify-between items-center mb-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} p-4 rounded-lg shadow-md`}>
        <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Accepted Rides</h2>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          {theme === 'light' ? (
            <FaMoon className="text-gray-600" size={20} />
          ) : (
            <FaSun className="text-yellow-300" size={20} />
          )}
        </button>
      </header>

      {/* Main Content */}
      {loading ? (
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Loading accepted rides...</p>
      ) : acceptedRides?.length > 0 ? (
        <div className="space-y-6">
          {acceptedRides.map((ride) => (
            <div
              key={ride._id}
              className={`flex flex-col md:flex-row gap-4 p-4 border rounded-lg ${selectedRide?._id === ride._id ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'} ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} shadow-md`}
              onClick={() => handleRideSelect(ride)}
            >
              {/* Left: Ride Details */}
              <div className="flex-1">
              <div className="flex items-center space-x-4">
                    <img
                      className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                      src={ride.passenger?.profilePicture || "https://via.placeholder.com/150"}
                      alt={`${ride.userId?.firstName} ${ride.userId?.lastName}`}
                    />
                    <button
                      onClick={() =>
                        window.open(
                          ride.passenger?.profilePicture || "https://via.placeholder.com/150",
                          "_blank"
                        )
                      }
                      className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                    >
                      View
                    </button>
                  </div>
                <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride ID: {ride._id}</p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">Passenger:</span>{' '}
                  <span className="text-green-600">{ride.userId?.firstName} {ride.userId?.lastName}</span>
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">Phone:</span>{' '}
                  <a href={`tel:${ride.passenger?.phoneNumber}`} className="text-green-600 hover:underline flex items-center">
                    <FaPhone className="mr-1" /> {ride.passenger?.phoneNumber || 'N/A'}
                  </a>
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">From:</span> {ride.pickupAddress}
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">To:</span> {ride.destinationAddress}
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">Distance:</span> {ride.pickupCoordinates ? calculateDistance(ride.pickupCoordinates) : ride.distance} km
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">Price:</span> ₦{ride.calculatedPrice}
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className="text-green-600">{ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}</span>
                </p>
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  <span className="font-semibold">Date:</span> {new Date(ride.createdAt).toLocaleString()}
                </p>
              </div>

              {/* Right: Map */}
              <div className="w-full md:w-1/3 h-48">
                {currentLocation ? (
                  <iframe
                    width="100%"
                    height="100%"
                    style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
                    loading="lazy"
                    allowFullScreen
                    src={mapUrl(ride)}
                  />
                ) : (
                  <div className={`h-full rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
                    <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Fetching location...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>No accepted rides yet.</p>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default AcceptedRide;