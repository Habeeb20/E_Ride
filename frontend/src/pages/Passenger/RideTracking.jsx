import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, { autoConnect: false });

function RideTracking() {
  const { rideId } = useParams(); // Get rideId from URL
  const [driverLocation, setDriverLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [theme] = useState('light'); // Add theme toggle if needed
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !rideId) {
      navigate('/plogin');
      return;
    }

    socket.connect();
    socket.emit('joinRide', rideId);

    // Fetch initial ride data
    const fetchRideData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/rides/passenger/${rideId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const ride = response.data[0]; // Assuming first ride in history
        if (ride.driverLocation) setDriverLocation(ride.driverLocation);
      } catch (error) {
        toast.error('Failed to load ride data', { style: { background: '#F44336', color: 'white' } });
      }
    };
    fetchRideData();

    // Listen for driver location updates
    socket.on('driverLocationUpdate', (data) => {
      console.log('Driver location update:', data);
      setDriverLocation(data.location);
    });

    return () => socket.disconnect();
  }, [rideId, token, navigate]);

  const handleCancelRide = async () => {
    try {
      setLoading(true);
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${rideId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ride cancelled', { style: { background: '#4CAF50', color: 'white' } });
      navigate('/ride');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel ride', {
        style: { background: '#F44336', color: 'white' },
      });
    } finally {
      setLoading(false);
    }
  };

  const mapUrl = driverLocation
    ? `https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&center=${driverLocation.lat},${driverLocation.lng}&zoom=15`
    : '';

  return (
    <div className={`h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <button onClick={() => navigate('/ride')} className="text-gray-600 hover:text-gray-800">
          <FaArrowLeft size={20} />
        </button>
        <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride Tracking</h2>
        <div className="w-8 h-8" />
      </header>

      <div className="flex-1 p-4">
        {driverLocation ? (
          <iframe
            width="100%"
            height="80%"
            style={{ border: 0, borderRadius: '8px' }}
            src={mapUrl}
            allowFullScreen
            loading="lazy"
          />
        ) : (
          <p className={`text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
            Waiting for driver location...
          </p>
        )}
        <button
          onClick={handleCancelRide}
          className="w-full py-2 mt-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all"
          disabled={loading}
        >
          {loading ? 'Cancelling...' : 'Cancel Ride'}
        </button>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default RideTracking;