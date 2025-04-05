import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaArrowLeft, FaInfoCircle, FaSun, FaMoon, FaCar } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { FaPhone } from 'react-icons/fa';
function ViewAvailableRides() {
  const [availableRides, setAvailableRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [driverDetails, setDriverDetails] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [rideHistory, setRideHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNegotiateModal, setShowNegotiateModal] = useState(false);
  const [negotiatePrice, setNegotiatePrice] = useState('');
  const navigate = useNavigate();
  const [theme, setTheme] = useState('light');
  const [currentLocation, setCurrentLocation] = useState(null);
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY;
  const token = localStorage.getItem("token");

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  // Fetch current location
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
        },
        (error) => {
          console.error("Location access denied:", error.message);
          toast.error("Unable to fetch location", { style: { background: "#F44336", color: "white" } });
        }
      );
    }
  }, []);

  // Fetch driver profile
  useEffect(() => {
    const fetchDriverProfile = async () => {
      if (!token) {
        toast.error('Please log in to access the dashboard', { style: { background: '#F44336', color: 'white' } });
        navigate('/plogin');
        return;
      }
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status) {
          setDriverDetails(response.data);
          toast.success('Welcome to your driver dashboard', { style: { background: '#4CAF50', color: 'white' } });
        }
      } catch (error) {
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
    fetchDriverProfile();
  }, [navigate]);

  // Fetch available rides
  useEffect(() => {
    const fetchAvailableRides = async () => {
      if (!token) return;
      try {
        setLoading(true);
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rides/available`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableRides(response.data);
      } catch (error) {
        console.error('Error fetching available rides:', error);
        toast.error('Failed to load available rides', { style: { background: '#F44336', color: 'white' } });
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableRides();
  }, [token]);

  // Fetch ride history
  useEffect(() => {
    if (!driverDetails?._id) return;
    const fetchRideHistory = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/rides/driver/${driverDetails._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRideHistory(response.data);
      } catch (error) {
        console.error('Error fetching ride history:', error);
      }
    };
    fetchRideHistory();
  }, [driverDetails, token]);

  const handleAcceptRide = async (rideId) => {
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${rideId}/accept`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ride accepted successfully', { style: { background: '#4CAF50', color: 'white' } });
      setAvailableRides((prev) => prev.filter((ride) => ride._id !== rideId));
      setSelectedRide(null);
      setShowMap(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to accept ride';
      toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRide = async (rideId) => {
    try {
      setLoading(true);
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${rideId}/reject`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Ride rejected', { style: { background: '#4CAF50', color: 'white' } });
      setAvailableRides((prev) => prev.filter((ride) => ride._id !== rideId));
      setSelectedRide(null);
      setShowMap(false);
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to reject ride';
      toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const handleNegotiatePrice = async (rideId) => {
    if (!negotiatePrice || isNaN(negotiatePrice) || negotiatePrice <= 0) {
      toast.error('Please enter a valid price', { style: { background: '#F44336', color: 'white' } });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/rides/${rideId}/negotiate`,
        { driverPrice: Number(negotiatePrice) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Price negotiation sent successfully', { style: { background: '#4CAF50', color: 'white' } });
      setShowNegotiateModal(false);
      setNegotiatePrice('');
      setAvailableRides(prev => prev.map(ride => 
        ride._id === rideId 
          ? { 
              ...ride, 
              negotiationStatus: 'pending',
              driverProposedPrice: Number(negotiatePrice)
            } 
          : ride
      ));
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Failed to negotiate price';
      toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const handleRideSelect = (ride) => {
    setSelectedRide(ride);
    setShowMap(true);
  };

  const openNegotiateModal = (ride) => {
    setSelectedRide(ride);
    setNegotiatePrice(ride.calculatedPrice?.toString() || ''); // Pre-fill with calculated price
    setShowNegotiateModal(true);
  };

  const mapUrl = showMap && selectedRide
    ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(selectedRide.pickupAddress)}&destination=${encodeURIComponent(selectedRide.destinationAddress)}&mode=driving`
    : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=${currentLocation?.lat},${currentLocation?.lng}&zoom=15`;

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      {/* Header */}
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <div className="flex items-center space-x-2">
          <button onClick={toggleTheme} className="text-gray-600 hover:text-gray-800">
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} className="text-white" />}
          </button>
        </div>
        <button onClick={() => setShowProfile(!showProfile)}>
          <div className="w-8 h-8 bg-gray-300 rounded-full overflow-hidden">
            {driverDetails?.profilePicture && <img src={driverDetails.profilePicture} alt="Profile" className="w-full h-full object-cover" />}
          </div>
        </button>
      </header>

      {/* Profile and Ride History Modal */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md max-h-[80vh] overflow-y-auto ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <button onClick={() => setShowProfile(false)} className={theme === 'light' ? 'text-green-600 mb-4' : 'text-green-400 mb-4'}>Close</button>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Profile</h2>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Name: {driverDetails?.firstName || 'Driver'}</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Email: {driverDetails?.userEmail || 'driver@example.com'}</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Phone: {driverDetails?.phoneNumber}</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Car: {driverDetails?.carDetails?.model} ({driverDetails?.carDetails?.year})</p>
            <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>License Plate: {driverDetails?.carDetails?.plateNumber}</p>
            <h3 className={`text-lg font-semibold mt-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Ride History</h3>
            {rideHistory.length > 0 ? (
              <ul className="space-y-2">
                {rideHistory.map((ride, index) => (
                  <li key={index} className={`border p-2 rounded-lg ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>From: {ride.pickupAddress}</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>To: {ride.destinationAddress}</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Distance: {ride.distance} km</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Price: ₦{ride.calculatedPrice}</p>
                    <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>Date: {new Date(ride.createdAt).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={theme === 'light' ? 'text-gray-800' : 'text-white'}>No rides yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Negotiation Modal */}
      {showNegotiateModal && selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-11/12 max-w-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
            <h2 className={`text-xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Negotiate Price</h2>
            <div className="space-y-2 mb-4">
              <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                Calculated Price: ₦{selectedRide.calculatedPrice}
              </p>
              {selectedRide.desiredPrice && (
                <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>
                  Passenger's Offer: ₦{selectedRide.desiredPrice}
                </p>
              )}
            </div>
            <div className="mt-4">
              <label className={`block mb-2 font-semibold ${theme === 'light' ? 'text-gray-700' : 'text-gray-300'}`}>
                Your Proposed Price (₦):
              </label>
              <input
                type="number"
                value={negotiatePrice}
                onChange={(e) => setNegotiatePrice(e.target.value)}
                className={`w-full p-2 rounded-lg border ${theme === 'light' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-gray-600 text-white border-gray-500'}`}
                placeholder="Enter your price"
                min="0"
                step="100"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowNegotiateModal(false);
                  setNegotiatePrice('');
                }}
                className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleNegotiatePrice(selectedRide._id)}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Submit Offer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        {/* Left Side: Ride Requests */}
        <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Available Ride Requests</h3>
          {loading ? (
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Loading rides...</p>
          ) : availableRides.length > 0 ? (
            <ul className="space-y-4">
              {availableRides.map((ride) => (
                <li
                  key={ride._id}
                  className={`p-4 border rounded-lg cursor-pointer ${selectedRide?._id === ride._id ? 'border-green-500' : theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}
                  onClick={() => handleRideSelect(ride)}
                >
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
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Passenger's Full-Name: <span className='text-green-300 font-bold'>{ride.userId?.firstName} {ride.userId?.lastName}</span></p>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Passenger's email: <span className="text-green-300 font-bold">{ride.passenger?.userEmail}</span> </p>
                  <p className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
      Passenger's Phone Num:{' '}
      <a
        href={`tel:${ride.passenger?.phoneNumber}`}
        className="inline-flex items-center text-green-300 hover:text-green-400 transition-colors"
        title={`Call ${ride.passenger?.phoneNumber}`}
      >
        <FaPhone className="mr-2" /> 
        <span className="font-bold">{ride.passenger?.phoneNumber || 'N/A'}</span>
      </a>
    </p>
                  <p className={theme === 'light' ? 'text-green-700 font-bold' : 'text-white font-bold'}>From: <span className='text-green-300 font-bold'>{ride.pickupAddress}</span> </p>
                  <p className={theme === 'light' ? 'text-green-700 font-bold' : 'text-white font-bold'}>To: <span className='text-green-300 font-bold'>{ride.destinationAddress}</span>  </p>
                  <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Distance: {ride.distance} km</p>
                  <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Number of passengers: {ride.passengerNum} </p>
                  <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Price: ₦{ride.calculatedPrice}</p>
                  {ride.desiredPrice && (
                    <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Passenger's Offer: ₦{ride.desiredPrice}</p>
                  )}
                  {ride.negotiationStatus === 'pending' && (
                    <p className={theme === 'light' ? 'text-blue-600' : 'text-blue-300'}>
                      Negotiation Pending (Your Offer: ₦{ride.driverProposedPrice})
                    </p>
                  )}
                  <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Ride Option: {ride.rideOption}</p>
                  <p className={theme === 'light' ? 'text-gray-700' : 'text-gray-300'}>Payment Method: {ride.paymentMethod}</p>

                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAcceptRide(ride._id); }}
                      className="py-1 px-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:bg-gray-400"
                      disabled={loading || ride.negotiationStatus === 'pending'}
                    >
                      Accept
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRejectRide(ride._id); }}
                      className="py-1 px-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:bg-gray-400"
                      disabled={loading || ride.negotiationStatus === 'pending'}
                    >
                      Reject
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openNegotiateModal(ride); }}
                      className="py-1 px-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:bg-gray-400"
                      disabled={loading || ride.negotiationStatus === 'pending'}
                    >
                      Negotiate
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>No available ride requests.</p>
          )}
        </div>

        {/* Right Side: Map */}
        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          {currentLocation ? (
            <iframe
              width="100%"
              height="100%"
              style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
              loading="lazy"
              allowFullScreen
              src={mapUrl}
            />
          ) : (
            <div className={`h-full rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
              <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Fetching your location...</p>
            </div>
          )}
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}

export default ViewAvailableRides;