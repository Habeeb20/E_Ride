import { useState, useEffect } from 'react';
import axios from 'axios';
import Autocomplete from 'react-google-autocomplete';
import { FaArrowLeft, FaSun, FaMoon } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';

const BookSchedule = () => {
  const [formData, setFormData] = useState({
    pickUp: '',
    address: '',
    time: '',
    date: '',
    state: '',
    lga: '',
    minPrice: '',
    maxPrice: '',
    distance: '',
    calculatedFare: '',
  });
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [showMap, setShowMap] = useState(false);

  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const embedApiKey = import.meta.env.VITE_EMBED_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY; // Fallback to same key
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const socket = io(import.meta.env.VITE_BACKEND_URL, {
    auth: { token },
    autoConnect: false,
  });

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  useEffect(() => {
    console.log('API Keys:', { googleMapsApiKey, embedApiKey }); // Debug API keys
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'User-Agent': 'e_RideProject/1.0' } }
            );
            const data = await response.json();
            setFormData((prev) => ({ ...prev, pickUp: data.display_name || 'Current Location' }));
          } catch (error) {
            console.error('Error reverse geocoding:', error);
            setFormData((prev) => ({ ...prev, pickUp: 'Current Location' }));
          }
        },
        (error) => {
          console.error('Location access denied:', error.message);
          setFormData((prev) => ({ ...prev, pickUp: 'Unable to fetch location' }));
        }
      );
    } else {
      console.error('Geolocation not supported by browser');
    }
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const calculateDistanceAndFare = async () => {
    if (!formData.pickUp || !formData.address) {
      toast.error('Please enter pickup and destination addresses', { style: { background: '#F44336', color: 'white' } });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/calculate-fare`,
        {
          pickupAddress: formData.pickUp,
          destinationAddress: formData.address,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { distance, fare } = response.data;
      setFormData((prev) => ({
        ...prev,
        distance,
        calculatedFare: fare,
      }));
      setShowMap(true);
      toast.success(`Fare calculated: ₦${fare} (Distance: ${distance} km)`, {
        style: { background: '#4CAF50', color: 'white' },
      });
    } catch (error) {
      toast.error('Error calculating fare', { style: { background: '#F44336', color: 'white' } });
      console.error('Error calculating fare:', error.response?.data || error);
      setFormData((prev) => ({ ...prev, distance: '', calculatedFare: '' }));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error('Please log in to book a schedule', { style: { background: '#F44336', color: 'white' } });
      navigate('/plogin');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/postschedule`,
        {
          ...formData,
          priceRange: { min: parseFloat(formData.minPrice), max: parseFloat(formData.maxPrice) },
          distance: formData.distance,
          calculatedFare: formData.calculatedFare ? parseFloat(formData.calculatedFare) : null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Schedule booked successfully', { style: { background: '#4CAF50', color: 'white' } });
      setFormData({
        pickUp: '',
        address: '',
        time: '',
        date: '',
        state: '',
        lga: '',
        minPrice: '',
        maxPrice: '',
        distance: '',
        calculatedFare: '',
      });
      setShowMap(false);
    } catch (error) {
      const errorMessage = error.response?.data.message || 'Failed to book schedule';
      toast.error(errorMessage, { style: { background: '#F44336', color: 'white' } });
    } finally {
      setLoading(false);
    }
  };

  const mapUrl = showMap
    ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(formData.pickUp)}&destination=${encodeURIComponent(formData.address)}&mode=driving`
    : `https://www.google.com/maps/embed/v1/place?key=${embedApiKey}&q=${currentLocation?.lat || 0},${currentLocation?.lng || 0}&zoom=15`;

  useEffect(() => {
    console.log('Map URL:', mapUrl); // Debug map URL
  }, [mapUrl]);

  return (
    <div className={`h-screen flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <button onClick={() => navigate(-1)} className={theme === 'light' ? 'text-gray-600' : 'text-white'}>
          <FaArrowLeft size={20} />
        </button>
        <div className="flex items-center space-x-2">
          <button onClick={toggleTheme} className={theme === 'light' ? 'text-gray-600' : 'text-white'}>
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} />}
          </button>
        </div>
      </header>

      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Book a Schedule</h3>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Pickup Address</label>
              <Autocomplete
                apiKey={googleMapsApiKey}
                onPlaceSelected={(place) => {
                  if (place?.formatted_address) {
                    setFormData((prev) => ({ ...prev, pickUp: place.formatted_address }));
                    if (formData.address) setShowMap(true); // Show map if both addresses are set
                  }
                }}
                options={{ types: ['geocode'], componentRestrictions: { country: 'ng' } }}
                value={formData.pickUp}
                onChange={(e) => handleChange({ target: { name: 'pickUp', value: e.target.value } })}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter pickup location"
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Destination Address</label>
              <Autocomplete
                apiKey={googleMapsApiKey}
                onPlaceSelected={(place) => {
                  if (place?.formatted_address) {
                    setFormData((prev) => ({ ...prev, address: place.formatted_address }));
                    if (formData.pickUp) setShowMap(true); // Show map if both addresses are set
                  }
                }}
                options={{ types: ['geocode'], componentRestrictions: { country: 'ng' } }}
                value={formData.address}
                onChange={(e) => handleChange({ target: { name: 'address', value: e.target.value } })}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter destination"
                disabled={loading}
              />
            </div>

            <button
              type="button"
              onClick={calculateDistanceAndFare}
              className={`w-full py-2 bg-customPink text-white rounded-lg font-semibold hover:bg-green-700 transition-all mb-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {loading ? 'Calculating...' : 'Calculate Fare'}
            </button>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Time</label>
              <input
                name="time"
                value={formData.time}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="e.g., 10:00 AM"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Date</label>
              <input
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>State</label>
              <input
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter state"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>LGA</label>
              <input
                name="lga"
                value={formData.lga}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter LGA"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Minimum Price (₦)</label>
              <input
                name="minPrice"
                type="number"
                value={formData.minPrice}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter minimum price"
                required
                disabled={loading}
              />
            </div>

            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white'}`}>Maximum Price (₦)</label>
              <input
                name="maxPrice"
                type="number"
                value={formData.maxPrice}
                onChange={handleChange}
                className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                placeholder="Enter maximum price"
                required
                disabled={loading}
              />
            </div>

            {formData.calculatedFare && (
              <p className={`mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                Calculated Fare: <span className="font-bold text-green-500">₦{formData.calculatedFare}</span> (Distance: {formData.distance} km)
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 bg-gradient-to-r from-green-700 to-customPink text-white rounded-lg font-semibold hover:from-green-700 hover:to-green-900 transition-all flex items-center justify-center ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Booking...
                </>
              ) : (
                'Book Schedule'
              )}
            </button>
          </form>
        </div>

        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          {currentLocation ? (
            embedApiKey ? (
              <iframe
                width="100%"
                height="100%"
                style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
                loading="lazy"
                allowFullScreen
                src={mapUrl}
                onError={(e) => console.error('Iframe error:', e)} // Debug iframe loading issues
              />
            ) : (
              <div className={`h-full rounded-lg flex items-center justify-center ${theme === 'light' ? 'bg-gray-200' : 'bg-gray-600'}`}>
                <p className={theme === 'light' ? 'text-gray-600' : 'text-gray-300'}>Google Maps API key missing</p>
              </div>
            )
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
};

export default BookSchedule;