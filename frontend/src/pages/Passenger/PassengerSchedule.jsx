import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BACKEND_URL);

const PassengerSchedule= () => {
  const [schedules, setSchedules] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [message, setMessage] = useState('');
  const token = localStorage.getItem('token');
  const embedApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/getmyschedules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSchedules(response.data.schedules);
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
        toast.error(error.response?.data.message || 'Failed to fetch schedules');
      }
    };
    fetchSchedules();

    socket.on('driverResponse', ({ scheduleId, driverResponse }) => {
      setSchedules((prev) =>
        prev.map((s) => (s._id === scheduleId ? { ...s, driverResponse } : s))
      );
    });

    socket.on('newMessage', (newMessage) => {
      setChatMessages((prev) => ({
        ...prev,
        [newMessage.scheduleId]: [...(prev[newMessage.scheduleId] || []), newMessage],
      }));
    });

    return () => {
      socket.off('driverResponse');
      socket.off('newMessage');
    };
  }, []);

  const handleSendMessage = async (scheduleId, chatId) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/chat/send`,
        { scheduleId, content: message },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('');
    } catch (error) {
      toast.error(error.response?.data.message || 'Failed to send message');
    }
  };

  const handleDelete = async (scheduleId) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/deleteschedule/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSchedules((prev) => prev.filter((s) => s._id !== scheduleId));
      toast.success('Schedule deleted');
    } catch (error) {
      toast.error(error.response?.data.message || 'Failed to delete schedule');
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Passenger Dashboard</h2>
      {schedules.map((schedule) => (
        <div key={schedule._id} className="bg-white p-4 rounded-lg shadow-md mb-4">
          <p>Pickup: {schedule.pickUp}</p>
          <p>Destination: {schedule.address}</p>
          <p>Time: {schedule.time}</p>
          <p>Date: {new Date(schedule.date).toLocaleDateString()}</p>
          <p>Price Range: {schedule.priceRange.min} - {schedule.priceRange.max}</p>
          <p>Status: {schedule.status}</p>
          {schedule.driverResponse && (
            <p>Driver Response: {schedule.driverResponse.status} {schedule.driverResponse.negotiatedPrice && `(${schedule.driverResponse.negotiatedPrice})`}</p>
          )}
          {schedule.driverId && (
            <p>Driver: {schedule.driverId.firstName} {schedule.driverId.lastName}</p>
          )}
          {schedule.calculatedFare > 0 && (
            <p>Calculated Fare: {schedule.calculatedFare} (Distance: {schedule.distance} km)</p>
          )}
          <iframe
            width="100%"
            height="300"
            className="mt-4"
            frameBorder="0"
            src={`https://www.google.com/maps/embed/v1/directions?key=${embedApiKey}&origin=${encodeURIComponent(schedule.pickUp)}&destination=${encodeURIComponent(schedule.address)}&mode=driving`}
            allowFullScreen
          ></iframe>
          {schedule.chatId && (
            <div className="mt-4">
              <h3 className="font-semibold">Chat</h3>
              <div className="max-h-40 overflow-y-auto">
                {(chatMessages[schedule._id] || []).map((msg, idx) => (
                  <p key={idx}>{msg.senderId.firstName}: {msg.content}</p>
                ))}
              </div>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded mt-2"
                placeholder="Type a message"
              />
              <button
                onClick={() => handleSendMessage(schedule._id, schedule.chatId)}
                className="mt-2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          )}
          {schedule.status === 'pending' && (
            <button
              onClick={() => handleDelete(schedule._id)}
              className="mt-2 bg-red-600 text-white p-2 rounded hover:bg-red-700"
            >
              Delete
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default PassengerSchedule;