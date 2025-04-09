import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSun, FaMoon, FaEye } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL, {
  auth: { token: localStorage.getItem('token') },
  autoConnect: false,
});

const DriverSchedule = () => {
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [acceptedSchedules, setAcceptedSchedules] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [message, setMessage] = useState('');
  const [theme, setTheme] = useState('dark');
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const token = localStorage.getItem('token');
  const embedApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const fetchAvailableSchedules = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/allschedules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailableSchedules(response.data.schedules);
        console.log(response.data.schedules)
      } catch (error) {
        toast.error(error.response?.data.message || 'Failed to fetch available schedules', {
          style: { background: '#F44336', color: 'white' },
        });
      }
    };

    const fetchAcceptedSchedules = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/myAcceptedSchedule`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAcceptedSchedules(response.data.schedules);
        console.log(response.data.schedules, "your accepted schedules")
        response.data.schedules.forEach(async (schedule) => {
          if (schedule.chatId) {
            const chatResponse = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/chat/${schedule._id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            setChatMessages((prev) => ({ ...prev, [schedule._id]: chatResponse.data.chat.messages }));
            socket.emit('joinChat', schedule.chatId);
          }
        });
      } catch (error) {
        toast.error(error.response?.data.message || 'Failed to fetch accepted schedules', {
          style: { background: '#F44336', color: 'white' },
        });
      }
    };

    fetchAvailableSchedules();
    fetchAcceptedSchedules();

    socket.connect();
    socket.on('newMessage', (newMessage) => {
      setChatMessages((prev) => ({
        ...prev,
        [newMessage.scheduleId]: [...(prev[newMessage.scheduleId] || []), newMessage],
      }));
    });

    return () => {
      socket.off('newMessage');
      socket.disconnect();
    };
  }, [token]);

  const handleResponse = async (scheduleId, status, negotiatedPrice) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/respondtoschedule/${scheduleId}`,
        { status, negotiatedPrice },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Schedule ${status} successfully`, { style: { background: '#4CAF50', color: 'white' } });
      setAvailableSchedules((prev) => prev.filter((s) => s._id !== scheduleId));
      if (status === 'accepted' || status === 'negotiating') {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/myAcceptedSchedule`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAcceptedSchedules(response.data.schedules);
      }
    } catch (error) {
      toast.error(error.response?.data.message || 'Failed to respond', {
        style: { background: '#F44336', color: 'white' },
      });
    }
  };

  const handleCalculateFare = async (scheduleId, pickUp, address) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/calculate-fare`,
        { pickupAddress: pickUp, destinationAddress: address },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { distance, fare } = response.data;
      await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/updateschedule/${scheduleId}`,
        { distance, calculatedFare: fare },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAcceptedSchedules((prev) =>
        prev.map((s) => (s._id === scheduleId ? { ...s, distance, calculatedFare: fare } : s))
      );
      toast.success(`Fare calculated: ${fare} (Distance: ${distance} km)`, {
        style: { background: '#4CAF50', color: 'white' },
      });
    } catch (error) {
      toast.error(error.response?.data.message || 'Failed to calculate fare', {
        style: { background: '#F44336', color: 'white' },
      });
    }
  };

  const handleSendMessage = async (scheduleId, chatId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/chat/send`,
        { scheduleId, content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('');
      toast.success('Message sent', { style: { background: '#4CAF50', color: 'white' } });
    } catch (error) {
      toast.error(error.response?.data.message || 'Failed to send message', {
        style: { background: '#F44336', color: 'white' },
      });
    }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const mapUrl = selectedSchedule
    ? `https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(selectedSchedule.pickUp)}&destination=${encodeURIComponent(selectedSchedule.address)}&mode=driving`
    : `https://www.google.com/maps/embed/v1/view?key=${embedApiKey}&center=0,0&zoom=2`;

  return (
    <div className={`h-full flex flex-col ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
      <header className={`flex items-center justify-between p-4 shadow-md ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
        <div className="flex items-center space-x-2">
          <button onClick={toggleTheme} className="text-gray-600 hover:text-gray-800">
            {theme === 'light' ? <FaMoon size={20} /> : <FaSun size={20} className="text-white" />}
          </button>
        </div>
        <h1 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>All Schedules</h1>
      </header>

      <div className={`flex-1 flex flex-col lg:flex-row p-4 gap-4 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}>
        <div className={`lg:w-[45%] w-full rounded-lg shadow-md p-4 overflow-y-auto max-h-[calc(100vh-120px)] ${theme === 'light' ? 'bg-white' : 'bg-gray-700'}`}>
          <h3 className={`text-lg font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Available Schedules</h3>
          {availableSchedules.map((schedule) => (
            <div key={schedule._id} className={`p-4 border rounded-lg mb-4 ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Pickup: {schedule.pickUp}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Destination: {schedule.address}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{schedule.customerId?.firstName}'s desired price: ₦{schedule.priceRange.min} - ₦{schedule.priceRange.max}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-green-400 font-bold'}`}>Customer: {schedule.customerId?.firstName} {schedule.customerId?.lastName}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-green-400 font-bold'}`}>Estimated Fare: {schedule.calculatedFare} </p>
              <div className="flex items-center mt-2">
                <img
                  src={schedule.customerProfileId?.profilePicture || 'https://via.placeholder.com/50'}
                  alt={`${schedule.customerId?.firstName}'s profile`}
                  className="w-12 h-12 rounded-full mr-2"
                />
                <button
                  onClick={() => window.open(schedule.profileId.profilePicture || 'https://via.placeholder.com/50', '_blank')}
                  className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'} hover:underline`}
                >
                  <FaEye className="inline mr-1" /> View Picture
                </button>
              </div>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Phone: {schedule.customerProfileId?.phoneNumber}</p>
              <div className="flex space-x-2 mt-2">
                <button
                  onClick={() => {
                    handleResponse(schedule._id, 'accepted');
                    setSelectedSchedule(schedule);
                  }}
                  className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleResponse(schedule._id, 'rejected')}
                  className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Reject
                </button>
                <button
                  onClick={() => {
                    const price = prompt('Enter negotiated price');
                    if (price) {
                      handleResponse(schedule._id, 'negotiating', parseFloat(price));
                      setSelectedSchedule(schedule);
                    }
                  }}
                  className="py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  Negotiate
                </button>
              </div>
            </div>
          ))}

          <h3 className={`text-lg font-bold mb-4 mt-6 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Accepted Schedules</h3>
          {acceptedSchedules.map((schedule) => (
            <div key={schedule._id} className={`p-4 border rounded-lg mb-4 ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Pickup: {schedule.pickUp}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Destination: {schedule.address}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Time: {schedule.time}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Date: {new Date(schedule.date).toLocaleDateString()}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Customer: {schedule.customerId.firstName} {schedule.customerId.lastName}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Email: {schedule.customerId.email}</p>
              <div className="flex items-center mt-2">
                <img
                  src={schedule.profileId.profilePicture || 'https://via.placeholder.com/50'}
                  alt={`${schedule.customerId.firstName}'s profile`}
                  className="w-12 h-12 rounded-full mr-2"
                />
                <button
                  onClick={() => window.open(schedule.profileId.profilePicture || 'https://via.placeholder.com/50', '_blank')}
                  className={`text-sm ${theme === 'light' ? 'text-blue-600' : 'text-blue-400'} hover:underline`}
                >
                  <FaEye className="inline mr-1" /> View Picture
                </button>
              </div>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Phone: {schedule.profileId.phoneNumber}</p>
              <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Status: {schedule.driverResponse.status}</p>
              {schedule.driverResponse.negotiatedPrice && (
                <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Negotiated Price: ₦{schedule.driverResponse.negotiatedPrice}</p>
              )}
              {schedule.calculatedFare > 0 ? (
                <p className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Calculated Fare: ₦{schedule.calculatedFare} (Distance: {schedule.distance} km)</p>
              ) : (
                <button
                  onClick={() => {
                    handleCalculateFare(schedule._id, schedule.pickUp, schedule.address);
                    setSelectedSchedule(schedule);
                  }}
                  className="mt-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Calculate Fare
                </button>
              )}
              {schedule.chatId && (
                <div className="mt-4">
                  <h4 className={`font-semibold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Chat</h4>
                  <div className={`max-h-40 overflow-y-auto border p-2 rounded-lg ${theme === 'light' ? 'border-gray-200' : 'border-gray-600'}`}>
                    {(chatMessages[schedule._id] || []).map((msg, idx) => (
                      <p key={idx} className={`${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>
                        {msg.senderId.firstName}: {msg.content}
                      </p>
                    ))}
                  </div>
                  <div className="flex mt-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className={`flex-1 p-2 border rounded-lg ${theme === 'light' ? 'border-gray-200 bg-white text-gray-800' : 'border-gray-600 bg-[#393737FF] text-white'}`}
                      placeholder="Type a message"
                    />
                    <button
                      onClick={() => handleSendMessage(schedule._id, schedule.chatId)}
                      className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="lg:w-[55%] w-full h-96 lg:h-auto">
          <iframe
            width="100%"
            height="100%"
            style={{ border: 0, borderRadius: '8px', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)' }}
            loading="lazy"
            allowFullScreen
            src={mapUrl}
          />
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default DriverSchedule;