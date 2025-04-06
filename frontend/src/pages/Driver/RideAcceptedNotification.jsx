import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';
import axios from 'axios';

const socket = io(import.meta.env.VITE_BACKEND_URL, { autoConnect: false });

function RideAcceptedNotification() {
  const [showModal, setShowModal] = useState(false);
  const [rideId, setRideId] = useState(null);
  const [passengerLocation, setPassengerLocation] = useState(null);
  const [theme] = useState('light');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      console.log('No token found, redirecting to driver login');
      navigate('/plogin');
      return;
    }

    const driverProfileId = localStorage.getItem('token');
    if (!driverProfileId) {
      console.error('No driver profile ID found in localStorage');
      toast.error('Driver profile not set. Please log in again.', {
        style: { background: '#F44336', color: 'white' },
      });
      navigate('/plogin');
      return;
    }

    socket.connect();
    console.log('Connecting socket for driver:', driverProfileId);
    socket.emit('join', driverProfileId);

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });

    socket.on('rideAccepted', (data) => {
      console.log('Ride accepted by passenger:', data);
      setRideId(data.rideId);
      setShowModal(true);
      fetchPassengerLocation(data.rideId);
      toast.success('Passenger accepted your ride!', {
        style: { background: '#4CAF50', color: 'white' },
      });
    });

    socket.on('rideCancelledByPassenger', (data) => {
      console.log('Ride cancelled by passenger:', data);
      setShowModal(false);
      setRideId(null);
      setPassengerLocation(null);
      toast.info('Ride cancelled by passenger', {
        style: { background: '#2196F3', color: 'white' },
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to server', {
        style: { background: '#F44336', color: 'white' },
      });
    });

    return () => {
      console.log('Disconnecting socket');
      socket.disconnect();
    };
  }, [token, navigate]);

  const fetchPassengerLocation = async (rideId) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${rideId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('Fetched ride data:', response.data);
      setPassengerLocation(response.data.pickupCoordinates);
    } catch (error) {
      console.error('Error fetching passenger location:', error);
      toast.error('Failed to fetch passenger location', {
        style: { background: '#F44336', color: 'white' },
      });
    }
  };

  const mapUrl = passengerLocation
    ? `https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&center=${passengerLocation.lat},${passengerLocation.lng}&zoom=15`
    : '';

  return (
    <div className={`h-screen bg-gray-800 text-white ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      {showModal ? (
        <div className="fixed inset-0 text-white bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <button onClick={() => setShowModal(false)} className="text-red-600 mb-4">
              <FaTimes />
            </button>
            <h3 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
              Ride Accepted
            </h3>
            <p className={`${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
              The passenger has accepted your ride request.
            </p>
            {passengerLocation ? (
              <iframe
                width="100%"
                height="300"
                style={{ border: 0, borderRadius: '8px' }}
                src={mapUrl}
                allowFullScreen
                loading="lazy"
              />
            ) : (
              <p>Loading passenger location...</p>
            )}
          </div>
        </div>
      ) : (
        <div className={`flex items-center justify-center h-full ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
          <p>Waiting for passenger to accept your ride...</p>
        </div>
      )}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default RideAcceptedNotification;