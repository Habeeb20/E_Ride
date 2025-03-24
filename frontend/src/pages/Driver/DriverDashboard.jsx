import React, { useState, useEffect, useRef } from "react";
import im from "../../assets/pic.jpg";
import { useNavigate } from "react-router-dom";
import {
  FaBell,
  FaSearch,
  FaCar,
  FaPlane,
  FaTruck,
  FaBus,
  FaTrailer,
  FaSuitcase,
  FaUser,
  FaRoute,
  FaCog,
  FaBars,
  FaEdit,
  FaSave,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
  FaCalendar,
} from "react-icons/fa";
import { toast } from "sonner";
import im1 from "../../assets/Rectangle 90 (1).png";
import im2 from "../../assets/Rectangle 90 (2).png";
import im3 from "../../assets/Rectangle 90.png";
import axios from "axios";

const DriverDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carPositions, setCarPositions] = useState([
    { x: 50, y: 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 },
    { x: window.innerWidth - 50, y: 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 },
    { x: 50, y: window.innerHeight - 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 },
    { x: window.innerWidth - 50, y: window.innerHeight - 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 },
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [allSchedules, setAllSchedules] = useState([]);
  const [negotiationPrice, setNegotiationPrice] = useState({});
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [negotiatedPriceInput, setNegotiatedPriceInput] = useState("");
  const [myAcceptedSchedule, setMyAcceptedSchedule] = useState([])
  const animationRef = useRef();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/plogin");
  };

  const handleFaceAuth = () => {
    navigate("/face-auth");
  };

  useEffect(() => {
    const fetchMyProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please log in to access the dashboard");
        toast.error("Please log in to access the dashboard", { style: { background: "#F44336", color: "white" } });
        navigate("/plogin");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status) {
          toast.success("Successfully logged in", { style: { background: "#4CAF50", color: "white" } });
          setData(response.data);
          setEditedProfile({
            firstName: response.data.data.userId.firstName,
            lastName: response.data.data.userId.lastName,
            email: response.data.data.userId.email,
            phoneNumber: response.data.data.phoneNumber,
            location: { state: response.data.data.location.state, lga: response.data.data.location.lga },
          });
        } else {
          throw new Error(response.data.message || "Failed to fetch profile");
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || "An error occurred while fetching profile";
        setError(errorMessage);
        toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/plogin");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMyProfile();
  }, [navigate]);

  useEffect(() => {
    animationRef.current = setInterval(() => {
      setCarPositions((prevPositions) =>
        prevPositions.map((pos) => {
          const dx = pos.targetX - pos.x;
          const dy = pos.targetY - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const speed = 20;

          if (distance < speed) {
            return {
              ...pos,
              x: pos === prevPositions[0] ? 50 : pos === prevPositions[1] ? window.innerWidth - 50 : pos === prevPositions[2] ? 50 : window.innerWidth - 50,
              y: pos === prevPositions[0] ? 50 : pos === prevPositions[1] ? 50 : pos === prevPositions[2] ? window.innerHeight - 50 : window.innerHeight - 50,
            };
          }
          const newX = pos.x + (dx / distance) * speed;
          const newY = pos.y + (dy / distance) * speed;
          return { ...pos, x: newX, y: newY };
        })
      );
    }, 100);

    return () => clearInterval(animationRef.current);
  }, []);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/profile/update`,
        {
          userId: profile.userId._id,
          firstName: editedProfile.firstName,
          lastName: editedProfile.lastName,
          email: editedProfile.email,
          phoneNumber: editedProfile.phoneNumber,
          location: editedProfile.location,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData({
        ...data,
        data: { ...data.data, userId: { ...data.data.userId, ...editedProfile }, phoneNumber: editedProfile.phoneNumber, location: editedProfile.location },
      });
      setIsEditing(false);
      toast.success("Profile updated successfully", { style: { background: "#4CAF50", color: "white" } });
    } catch (error) {
      toast.error("Failed to update profile", { style: { background: "#F44336", color: "white" } });
    }
  };

  const fetchAllSchedules = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/allschedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        setAllSchedules(response.data.schedules);
      } else {
        setAllSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching all schedules:", error);
      setAllSchedules([]);
      toast.error("Failed to fetch all schedules", { style: { background: "#F44336", color: "white" } });
    }
  };

  useEffect(() => {
    if (activeTab === "schedules") {
      const isDriver = data?.data?.role === "driver";
      if (isDriver) {
        fetchAllSchedules();
      }
    }
  }, [activeTab, data]);

  const handleScheduleResponse = async (scheduleId, action, negotiatedPrice = null) => {
    const token = localStorage.getItem("token");
    try {
      if (action === "negotiated" && negotiatedPrice) {
        setSelectedScheduleId(scheduleId);
        setNegotiatedPriceInput(negotiatedPrice);
        setShowNegotiationModal(true);
        return;
      }

      const payload = { status: action };
      if (action === "negotiated") payload.negotiatedPrice = negotiatedPrice;

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/respondtoschedule/${scheduleId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status) {
        toast.success(`Schedule ${action} successfully`, { style: { background: "#4CAF50", color: "white" } });
        fetchAllSchedules(); // Refresh schedules to show updated status and driver details
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to ${action} schedule`;
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    }
  };


  useEffect(() => {
    const fetchMyAccepedtSchedule = async() => {
      try {
        const token = localStorage.getItem("token")
        const response  = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/myAcceptedSchedule`, {
          headers:{
            Authorization: `Beare ${token}`
          }
        })
        setMyAcceptedSchedule(response.data.schedules)
        console.log("you accepted schedules!!",response.data.schedules)
      } catch (error) {
        console.log(error)
      }
    }
    fetchMyAccepedtSchedule()
  })

  const confirmNegotiation = async () => {
    const token = localStorage.getItem("token");
    try {
      const payload = { status: "negotiated", negotiatedPrice: negotiatedPriceInput };
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/respondtoschedule/${selectedScheduleId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status) {
        toast.success("Negotiation submitted successfully", { style: { background: "#4CAF50", color: "white" } });
        fetchAllSchedules();
        setShowNegotiationModal(false);
        setNegotiatedPriceInput("");
        setSelectedScheduleId(null);
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to submit negotiation";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    }
  };

  const profile = data?.data;
  const isDriver = profile?.role === "driver";

  const sidebarItems = [
    { id: "bookRide", label: "Book a Ride", icon: FaCar },
    { id: "appointments", label: "Your appointments", icon: FaCar },
    { id: "city", label: "City to City", icon: FaRoute },
    { id: "freight", label: "Freight", icon: FaTruck },
    { id: "safety", label: "Safety", icon: FaShieldAlt },
    { id: "rides", label: "Rides", icon: FaRoute },
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "settings", label: "Settings", icon: FaCog },
    { id: "schedules", label: "All Schedules", icon: FaCalendar },
  ];

  const suggestions = [
    { icon: FaCar, label: "e-ride hauling", color: "bg-green-100" },
    { icon: FaCar, label: "car hire per hour", color: "bg-pink-100" },
    { icon: FaPlane, label: "airport pickup", color: "bg-purple-100" },
    { icon: FaPlane, label: "airport drop off", color: "bg-gray-100" },
    { icon: FaTruck, label: "pickup lorry", color: "bg-blue-100" },
    { icon: FaBus, label: "bus travel", color: "bg-yellow-100" },
    { icon: FaTruck, label: "pickup van", color: "bg-green-100" },
    { icon: FaTrailer, label: "pickup trailer", color: "bg-pink-100" },
    { icon: FaSuitcase, label: "airport drop off", color: "bg-gray-100" },
  ];

  return (
    <div
      className="relative w-full h-screen flex overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${im})` }}
    >
      {carPositions.map((position, index) => (
        <div
          key={index}
          className="absolute transition-all duration-100 ease-linear"
          style={{ left: `${position.x}px`, top: `${position.y}px`, transform: "translate(-50%, -50%)" }}
        >
          <FaCar size={40} className="text-yellow-500 animate-bounce" />
        </div>
      ))}

      <div
        className={`fixed inset-y-0 left-0 z-20 w-56 bg-activeColor text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:static md:w-1/6`}
      >
        <div className="p-4 flex items-center justify-between md:justify-start">
          <h2 className="text-2xl font-bold tracking-wide">e-Ride</h2>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <FaBars size={24} />
          </button>
        </div>
        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-4 hover:bg-customColor transition-colors duration-200 ${
                activeTab === item.id ? "bg-customPink shadow-inner" : ""
              }`}
            >
              <item.icon size={20} className="mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <button
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-customPink text-white rounded-full shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars size={20} />
      </button>

      <div className="flex-1 relative">
        <div className="absolute inset-0 flex flex-col">
          <header className="bg-activeColor text-white p-4 flex items-center justify-between shadow-md">
            <div>
              {profile ? (
                <h2 className="text-xl font-bold">
                  Welcome, {profile.userId.firstName} {profile.userId.lastName}!
                </h2>
              ) : (
                <h2 className="text-xl font-bold">Welcome!</h2>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleFaceAuth}>Face-Auth</button>
              <button onClick={handleLogout} className="font-semibold">
                Logout
              </button>
              <FaBell size={20} className="cursor-pointer hover:text-gray-200" />
              <img src={profile?.profilePicture} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white" />
            </div>
          </header>

          <main className="flex-1 p-6 overflow-y-auto bg-transparent">
            {activeTab === "profile" && profile && (
              <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl max-w-md mx-auto transform transition-all duration-300 hover:shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-800">Profile</h3>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 bg-activeColor text-white rounded-full hover:bg-customGreen transition-colors"
                  >
                    {isEditing ? <FaSave size={20} /> : <FaEdit size={20} />}
                  </button>
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <input
                        type="text"
                        value={editedProfile.firstName}
                        onChange={(e) => setEditedProfile({ ...editedProfile, firstName: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <input
                        type="text"
                        value={editedProfile.lastName}
                        onChange={(e) => setEditedProfile({ ...editedProfile, lastName: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={editedProfile.email}
                        onChange={(e) => setEditedProfile({ ...editedProfile, email: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <input
                        type="text"
                        value={editedProfile.phoneNumber}
                        onChange={(e) => setEditedProfile({ ...editedProfile, phoneNumber: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">State</label>
                      <input
                        type="text"
                        value={editedProfile.location.state}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, location: { ...editedProfile.location, state: e.target.value } })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LGA</label>
                      <input
                        type="text"
                        value={editedProfile.location.lga}
                        onChange={(e) =>
                          setEditedProfile({ ...editedProfile, location: { ...editedProfile.location, lga: e.target.value } })
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-activeColor"
                      />
                    </div>
                    <button
                      onClick={handleSaveProfile}
                      className="w-full py-2 bg-activeColor text-white rounded-lg hover:bg-activeColor transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 text-gray-700">
                    <p className="flex items-center">
                      <FaUser className="mr-2 text-customGreen" /> <strong>Name:</strong>{" "}
                      <span className="ml-2">
                        {profile.userId.firstName} {profile.userId.lastName}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <FaEnvelope className="mr-2 text-customGreen" /> <strong>Email:</strong>{" "}
                      <span className="ml-2">{profile.userId.email}</span>
                    </p>
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Role:</strong>{" "}
                      <span className="ml-2 capitalize">{profile.role}</span>
                    </p>
                    <p className="flex items-center">
                      <FaMapMarkerAlt className="mr-2 text-customGreen" /> <strong>Location:</strong>{" "}
                      <span className="ml-2">
                        {profile.location.state}, {profile.location.lga}
                      </span>
                    </p>
                    <p className="flex items-center">
                      <FaPhone className="mr-2 text-customGreen" /> <strong>Phone:</strong>{" "}
                      <span className="ml-2">{profile.phoneNumber}</span>
                    </p>
                    {profile.role === "driver" && profile.carDetails && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-lg text-e-ride-purple">Car Details</h4>
                        <p>
                          <strong>Model:</strong> {profile.carDetails.model}
                        </p>
                        <p>
                          <strong>Product:</strong> {profile.carDetails.product}
                        </p>
                        <p>
                          <strong>Year:</strong> {profile.carDetails.year}
                        </p>
                        <p>
                          <strong>Color:</strong> {profile.carDetails.color}
                        </p>
                        <p>
                          <strong>Plate:</strong> {profile.carDetails.plateNumber}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "schedules" && (
              <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">All Schedules</h3>
                {isDriver ? (
                  allSchedules.length === 0 ? (
                    <p className="text-gray-600">No schedules found.</p>
                  ) : (
                    <div className="space-y-4">
                      {allSchedules.map((schedule) => (
                        <div key={schedule._id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center space-x-4">
                                <img
                                  className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                                  src={schedule.profileId?.profilePicture || "https://via.placeholder.com/150"}
                                  alt={`${schedule.profileId?.firstName} ${schedule.profileId?.lastName}`}
                                />
                                <button
                                  onClick={() =>
                                    window.open(
                                      schedule.profileId?.profilePicture || "https://via.placeholder.com/150",
                                      "_blank"
                                    )
                                  }
                                  className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
                                >
                                  View
                                </button>
                              </div>
                              <p>
                                <strong>Name:</strong> {schedule.userId?.firstName} {schedule.userId?.lastName}
                              </p>
                              <p>
                                <strong>Email:</strong> {schedule.userId?.email}
                              </p>
                              <p>
                                <strong>Phone:</strong> {schedule.profileId?.phoneNumber}
                              </p>
                              <p>
                                <strong>Time:</strong> {schedule.formattedTime}
                              </p>
                              <p>
                                <strong>Location:</strong> {schedule.state}, {schedule.lga}, {schedule.address}
                              </p>
                              <p>
                                <strong>Price Range:</strong> ₦{schedule.priceRange.min} - ₦{schedule.priceRange.max}
                              </p>
                              {schedule.description && (
                                <p>
                                  <strong>Description:</strong> {schedule.description}
                                </p>
                              )}
                              <p>
                                <strong>Status:</strong>{" "}
                                <span
                                  className={`capitalize ${
                                    schedule.status === "accepted" ? "text-green-600" : "text-yellow-600"
                                  }`}
                                >
                                  {schedule.status}
                                </span>
                              </p>
                              <p>
                                <strong>Driver Response:</strong>{" "}
                                <span
                                  className={`capitalize ${
                                    schedule.driverResponse.status === "accepted"
                                      ? "text-green-600"
                                      : schedule.driverResponse.status === "rejected"
                                      ? "text-red-600"
                                      : "text-gray-600"
                                  }`}
                                >
                                  {schedule.driverResponse.status}
                                </span>
                              </p>
                              {schedule.driverResponse.status === "negotiated" && (
                                <p>
                                  <strong>Negotiated Price:</strong> ₦{schedule.driverResponse.negotiatedPrice}
                                </p>
                              )}
                              {schedule.driverResponse.driverId && (
                                <div className="mt-2 p-2 bg-gray-100 rounded-lg">
                                  <p>
                                    <strong>Accepted By Driver:</strong> {schedule.driverResponse.driverId.firstName}{" "}
                                    {schedule.driverResponse.driverId.lastName}
                                  </p>
                                  <p>
                                    <strong>Email:</strong> {schedule.driverResponse.driverId.email}
                                  </p>
                                  <p>
                                    <strong>Phone:</strong> {schedule.driverResponse.driverId.phoneNumber}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                          {isDriver && schedule.driverResponse.status === "pending" && (
                            <div className="mt-4 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                              <button
                                onClick={() => handleScheduleResponse(schedule._id, "accepted")}
                                className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                              >
                                Accept
                              </button>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  placeholder="Negotiate Price (NGN)"
                                  value={negotiationPrice[schedule._id] || ""}
                                  onChange={(e) =>
                                    setNegotiationPrice({ ...negotiationPrice, [schedule._id]: e.target.value })
                                  }
                                  className="w-32 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent"
                                />
                                <button
                                  onClick={() =>
                                    handleScheduleResponse(schedule._id, "negotiated", negotiationPrice[schedule._id])
                                  }
                                  className="py-2 px-4 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors duration-200"
                                >
                                  Negotiate
                                </button>
                              </div>
                              <button
                                onClick={() => handleScheduleResponse(schedule._id, "rejected")}
                                className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <p className="text-gray-600">
                    Only drivers can view and respond to schedules.
                  </p>
                )}
              </div>
            )}

            {/* Negotiation Confirmation Modal */}
            {showNegotiationModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full transform transition-all duration-300">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Negotiation</h3>
                  <p className="text-gray-600 mb-4">Are you sure you want to negotiate this price?</p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Negotiated Price (NGN)</label>
                    <input
                      type="number"
                      value={negotiatedPriceInput}
                      onChange={(e) => setNegotiatedPriceInput(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setShowNegotiationModal(false)}
                      className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmNegotiation}
                      className="py-2 px-4 bg-customGreen text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              </div>
            )}


{activeTab === "appointments" && (
  <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-2xl">
    <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
      <FaCalendar className="mr-2 text-customGreen" /> My Appointments
    </h3>
    {myAcceptedSchedule && myAcceptedSchedule.length > 0 ? (
      <div className="space-y-4">
        {myAcceptedSchedule.map((schedule) => (
          <div key={schedule._id} className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                <img
                                  className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                                  src={schedule.profileId?.profilePicture || "https://via.placeholder.com/150"}
                                  alt={`${schedule.profileId?.firstName} ${schedule.profileId?.lastName}`}
                                />
                                <button
                                  onClick={() =>
                                    window.open(
                                      schedule.profileId?.profilePicture || "https://via.placeholder.com/150",
                                      "_blank"
                                    )
                                  }
                                  className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
                                >
                                  View
                                </button>
             <p>
              <strong>Full Name:</strong> {schedule.userId.firstName} {schedule.userId.lastName}
            </p>
            <p>
              <strong>Email:</strong> {schedule.userId.email} 
            </p>
            <p>
              <strong>phoneNumber:</strong> {schedule.profileId.phoneNumber} 
            </p>
            <p>
              <strong>Time:</strong> {schedule.formattedTime}
            </p>
            <p>
              <strong>Location:</strong> {schedule.state}, {schedule.lga}, {schedule.address}
            </p>
            <p>
              <strong>Price Range:</strong> ₦{schedule.priceRange.min} - ₦{schedule.priceRange.max}
            </p>
            {schedule.driverResponse.status === "negotiated" && (
              <p>
                <strong>Negotiated Price:</strong> ₦{schedule.driverResponse.negotiatedPrice}
              </p>
            )}
            <p>
              <strong>Status:</strong>{" "}
              <span
                className={
                  schedule.driverResponse.status === "accepted" ? "text-green-600" : "text-yellow-600"
                }
              >
                {schedule.driverResponse.status}
              </span>
            </p>
          </div>
        ))}
      </div>
    ) : (
      <h4 className="text-gray-600 text-center">You have not accepted any schedule yet</h4>
    )}
  </div>
)}

          </main>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;