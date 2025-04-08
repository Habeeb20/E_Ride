import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSun, FaMoon } from 'react-icons/fa';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const OwnerDashboard = () => {
  const [rentals, setRentals] = useState([]);
  const [theme, setTheme] = useState('light');
  const token = localStorage.getItem('token');
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rentals/owner`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRentals(response.data);
      } catch (error) {
        toast.error('Failed to fetch rentals');
      }
    };

    fetchRentals();

    socket.on('rentalRequest', (data) => {
      setRentals((prev) => [...prev, data.rental]);
      toast.info(`New rental request for ${data.rental.vehicle.type}`);
    });

    return () => socket.off('rentalRequest');
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

  const getMapUrl = (rental) => {
    if (!rental.pickupCoordinates || !rental.destinationCoordinates) {
      return `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=0,0&zoom=2`;
    }
    return `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${rental.pickupCoordinates.lat},${rental.pickupCoordinates.lng}&destination=${rental.destinationCoordinates.lat},${rental.destinationCoordinates.lng}&mode=driving`;
  };

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'} p-6`}>
      <header className={`flex justify-between items-center mb-6 ${theme === 'light' ? 'bg-white' : 'bg-gray-700'} p-4 rounded-lg shadow-md`}>
        <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}></h2>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600">
          {theme === 'light' ? <FaMoon className="text-gray-600" size={20} /> : <FaSun className="text-yellow-300" size={20} />}
        </button>
      </header>

      <div className="space-y-6">
        {rentals.length === 0 ? (
          <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>No rentals yet.</p>
        ) : (
          rentals.map((rental) => (
            <div
              key={rental._id}
              className={`${theme === 'light' ? 'bg-white text-gray-800' : 'bg-gray-700 text-gray-100'} p-4 rounded-lg shadow-md grid grid-cols-1 lg:grid-cols-2 gap-4`}
            >
              <div className="space-y-2">
                <p className="font-semibold">Vehicle: {rental.vehicle.type} ({rental.vehicle.plateNumber})</p>
                <p>
                   vehicle picture
              <div className="flex items-center space-x-4 mt-2">
                <img
                  className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                  src={rental.vehicle?.carPicture || 'https://via.placeholder.com/150'}
                  alt={`${rental.vehicle?.carPicture} Display`}
                />
                <button
                  onClick={() => window.open(rental.vehicle?.carPicture || 'https://via.placeholder.com/150', '_blank')}
                  className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                >
                  View
                </button>
              </div>
            </p>
                <p>
                  <span className="font-semibold">Pickup:</span> {rental.pickupAddress}
                </p>
                <p>
                  <span className="font-semibold">Destination:</span> {rental.destinationAddress}
                </p>
                <p>
                  <span className="font-semibold">Distance:</span> {calculateDistance(rental.pickupCoordinates, rental.destinationCoordinates)} km
                </p>
                <p>
                  <span className="font-semibold">Duration:</span> {rental.duration}
                </p>
                <p>
                  <span className="font-semibold">Status:</span>{' '}
                  <span className={`${rental.status === 'cancelled' ? 'text-red-600' : rental.status === 'pending' ? 'text-yellow-700' : 'text-green-600'}`}>
                    {rental.status.charAt(0).toUpperCase() + rental.status.slice(1)}
                  </span>
                </p>
                <div className="mt-2">
                  {/* <p className="font-semibold">Renter:</p>
                  <p>
                    <span className="font-semibold">Name:</span> {rental.renter.firstName} {rental.renter.lastName}
                  </p> */}
                  <p>
                    <span className="font-semibold">Phone:</span>{' '}
                    <a href={`tel:${rental.renter.phoneNumber}`} className={`${theme === 'light' ? 'text-green-600' : 'text-green-400'} hover:underline`}>
                      {rental.renterProfile?.phoneNumber}
                    </a>
                  </p>
                  <p>
                  <p>
                    profile Picture
              <div className="flex items-center space-x-4 mt-2">
                <img
                  className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                  src={rental.renterProfile?.profilePicture || 'https://via.placeholder.com/150'}
                  alt={`${rental.renterProfile?.profilePicture} Display`}
                />
                <button
                  onClick={() => window.open(rental.renterProfile?.profilePicture || 'https://via.placeholder.com/150', '_blank')}
                  className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-customPink transition-colors duration-200"
                >
                  View
                </button>
              </div>
            </p>
                  </p>
                </div>
              </div>
              <div className="h-64 lg:h-auto">
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
                  loading="lazy"
                  allowFullScreen
                  src={getMapUrl(rental)}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;