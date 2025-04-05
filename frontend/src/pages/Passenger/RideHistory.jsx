import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowLeft, FaSun, FaMoon, FaCar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

function RideHistory() {
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [passenger, setPassenger] = useState(null);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Fetch passenger profile and ride history
  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        toast.error('Please log in to view your ride history', { style: { background: '#F44336', color: 'white' } });
        navigate('/plogin');
        return;
      }

      setLoading(true);
      try {
        // Fetch passenger profile
        const profileResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileResponse.data.status) {
          setPassenger(profileResponse.data);
          console.log("your profile", profileResponse.data.data._id)

          // Fetch ride history
          const historyResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/rides/passengerRides`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          setRideHistory(historyResponse.data);
          toast.success('Ride history loaded successfully', { style: { background: '#4CAF50', color: 'white' } });
        }
      } catch (error) {
        console.log(error)
        const errorMessage = error.response?.data?.message || 'An error occurred';
        toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/plogin');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, token]);

  return (
    <div className={`h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <div className="flex items-center space-x-2">
          <button onClick={() => navigate('/ride')} className="text-gray-600 hover:text-gray-800">
            <FaArrowLeft size={20} />
          </button>
          <button onClick={toggleTheme} className="text-gray-600 hover:text-gray-800">
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} className="text-white" />}
          </button>
        </div>
        <h2 className={`text-lg font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride History</h2>
        <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
          {passenger?.profilePicture && (
            <img src={passenger.profilePicture} alt="Profile" className="w-full h-full object-cover" />
          )}
        </div>
      </header>

      <div className={`flex-1 p-4 overflow-y-auto ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        {loading ? (
          <div className={`text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>Loading ride history...</div>
        ) : rideHistory?.length > 0 ? (
          <div className="space-y-4">
            {rideHistory.map((ride) => (
              <div
                key={ride._id}
                className={`rounded-lg shadow-md p-4 ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}
              >
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  Ride ID: {ride._id}
                </h3>
                <div className={`space-y-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                  <p><span className="font-medium">Status:</span> {ride.status}</p>
                  <p><span className="font-medium">Pickup:</span> {ride.pickupAddress}</p>
                  <p><span className="font-medium">Destination:</span> {ride.destinationAddress}</p>
                  <p><span className="font-medium">Distance:</span> {ride.distance} km</p>
                  <p><span className="font-medium">Calculated Price:</span> ₦{ride.calculatedPrice}</p>
                  {ride.desiredPrice && (
                    <p><span className="font-medium">Your Offered Price:</span> ₦{ride.desiredPrice}</p>
                  )}
                  <p><span className="font-medium">Ride Option:</span> {ride.rideOption}</p>
                  <p><span className="font-medium">Payment Method:</span> {ride.paymentMethod}</p>
                  <p><span className="font-medium">Created At:</span> {new Date(ride.createdAt).toLocaleString()}</p>
                </div>

                {ride.driver && (
                  <div className={`mt-4 p-3 rounded-lg ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-600'}`}>
                    <h4 className={`text-base font-semibold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                      Driver Details
                    </h4>
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        <FaCar size={24} />
                      </div>
                      <div className={`space-y-1 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                        <p><span className="font-medium">Name:</span> {ride.driver.firstName}</p>
                        <p><span className="font-medium">Car:</span> {ride.driver.carDetails.model} ({ride.driver.carDetails.year})</p>
                        <p><span className="font-medium">License Plate:</span> {ride.driver.carDetails.plateNumber}</p>
                        {ride.driverProposedPrice && (
                          <p><span className="font-medium">Driver's Price:</span> ₦{ride.driverProposedPrice}</p>
                        )}
                        <p><span className="font-medium">Final Price:</span> ₦{ride.driverProposedPrice || ride.desiredPrice || ride.calculatedPrice}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={`text-center ${theme === 'light' ? 'text-gray-600' : 'text-gray-300'}`}>
            No ride history available.
          </div>
        )}
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default RideHistory;