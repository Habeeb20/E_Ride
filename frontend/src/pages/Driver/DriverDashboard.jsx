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
  FaCalendar
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
    { x: 50, y: 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Top-left
    { x: window.innerWidth - 50, y: 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Top-right
    { x: 50, y: window.innerHeight - 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Bottom-left
    { x: window.innerWidth - 50, y: window.innerHeight - 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Bottom-right
  ]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
   const [allSchedules, setAllSchedules] = useState([])
  const [negotiationPrice, setNegotiationPrice] = useState({});
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [negotiatedPriceInput, setNegotiatedPriceInput] = useState("");
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
        console.log("No token found in localStorage");
        setError("Please log in to access the dashboard");
        toast.error("Please log in to access the dashboard", {
          style: { background: "#F44336", color: "white" },
        });
        navigate("/plogin");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/auth/dashboard`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Dashboard response:", response.data);
        if (response.data.status) {
          toast.success("Successfully logged in", {
            style: { background: "#4CAF50", color: "white" },
          });
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
        console.error("Fetch profile error:", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "An error occurred while fetching profile";
        setError(errorMessage);
        toast.error(errorMessage, {
          style: { background: "#F44336", color: "white" },
        });
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
              x: pos === prevPositions[0] ? 50 :
                pos === prevPositions[1] ? window.innerWidth - 50 :
                pos === prevPositions[2] ? 50 :
                window.innerWidth - 50,
              y: pos === prevPositions[0] ? 50 :
                pos === prevPositions[1] ? 50 :
                pos === prevPositions[2] ? window.innerHeight - 50 :
                window.innerHeight - 50,
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
      setData({ ...data, data: { ...data.data, userId: { ...data.data.userId, ...editedProfile }, phoneNumber: editedProfile.phoneNumber, location: editedProfile.location } });
      setIsEditing(false);
      toast.success("Profile updated successfully", { style: { background: "#4CAF50", color: "white" } });
    } catch (error) {
      console.error("Update profile error:", error);
      toast.error("Failed to update profile", { style: { background: "#F44336", color: "white" } });
    }
  };



    // New: Fetch all schedules
    const fetchAllSchedules = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/allschedules`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.status) {
          setAllSchedules(response.data.schedules);
          console.log("all schedules", response.data.schedules)
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
      if(activeTab === "schedules"){
        const isDriver = data?.data?.role === "driver";
        if (isDriver ) {
          fetchAllSchedules();
        }
      }
    })
  

    // Add this function for handling responses
    const handleScheduleResponse = async (scheduleId, action, negotiatedPrice = null) => {
      const token = localStorage.getItem("token");
      try {
        if (action === "negotiated" && negotiatedPrice) {
          setSelectedScheduleId(scheduleId);
          setNegotiatedPriceInput(negotiatedPrice);
          setShowNegotiationModal(true); // Show modal for confirmation
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
          fetchAllSchedules(); // Refresh schedules
        }
      } catch (error) {
        const errorMessage = error.response?.data?.message || `Failed to ${action} schedule`;
        toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
      }
    };
    

  const profile = data?.data;

  const sidebarItems = [
    { id: "bookRide", label: "Book a Ride", icon: FaCar },
    { id: "suggestions", label: "Suggestions", icon: FaCar },
    { id: "city", label: "City to City", icon: FaRoute },
    { id: "freight", label: "Freight", icon: FaTruck },
    { id: "safety", label: "Safety", icon: FaShieldAlt },
    { id: "rides", label: "Rides", icon: FaRoute },
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "settings", label: "Settings", icon: FaCog },
    { id: "schedules", label: "All schedule?", icon: FaCalendar},
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

  const isDriver = profile?.role === "driver";
  return (
    <div
      className="relative w-full h-screen flex overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${im})`, // Background with reduced opacity
      }}
    >
      {/* Car Icons Moving from Four Sides */}
      {carPositions.map((position, index) => (
        <div
          key={index}
          className="absolute transition-all duration-100 ease-linear"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <FaCar size={40} className="text-yellow-500 animate-bounce" />
        </div>
      ))}

      {/* Sidebar */}
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

      {/* Toggle Button for Mobile */}
      <button
        className="md:hidden fixed top-4 left-4 z-30 p-2 bg-customPink text-white rounded-full shadow-md"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <FaBars size={20} />
      </button>

      {/* Main Content */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex flex-col">
          {/* Header */}
          <header className="bg-activeColor text-white p-4 flex items-center justify-between shadow-md">
            <div>
              {profile ? (
                <h2 className="text-xl font-bold">Welcome, {profile.userId.firstName} {profile.userId.lastName}!</h2>
              ) : (
                <h2 className="text-xl font-bold">Welcome!</h2>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button onClick={handleFaceAuth}>face-Auth</button>
              <button onClick={handleLogout} className="font-semibold">Logout</button>
              <FaBell size={20} className="cursor-pointer hover:text-gray-200" />
              <img src={profile?.profilePicture} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white" />
            </div>
          </header>

          {/* Dynamic Content */}
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
                        onChange={(e) => setEditedProfile({ ...editedProfile, location: { ...editedProfile.location, state: e.target.value } })}
                        className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">LGA</label>
                      <input
                        type="text"
                        value={editedProfile.location.lga}
                        onChange={(e) => setEditedProfile({ ...editedProfile, location: { ...editedProfile.location, lga: e.target.value } })}
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
                    <p className="flex items-center"><FaUser className="mr-2 text-customGreen" /> <strong>Name:</strong> <span className="ml-2">{profile.userId.firstName} {profile.userId.lastName}</span></p>
                    <p className="flex items-center"><FaEnvelope className="mr-2 text-customGreen" /> <strong>Email:</strong> <span className="ml-2">{profile.userId.email}</span></p>
                    <p className="flex items-center"><FaCar className="mr-2 text-customGreen" /> <strong>Role:</strong> <span className="ml-2 capitalize">{profile.role}</span></p>
                    <p className="flex items-center"><FaMapMarkerAlt className="mr-2 text-customGreen" /> <strong>Location:</strong> <span className="ml-2">{profile.location.state}, {profile.location.lga}</span></p>
                    <p className="flex items-center"><FaPhone className="mr-2 text-customGreen" /> <strong>Phone:</strong> <span className="ml-2">{profile.phoneNumber}</span></p>
                    {profile.role === "driver" && profile.carDetails && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-lg text-e-ride-purple">Car Details</h4>
                        <p><strong>Model:</strong> {profile.carDetails.model}</p>
                        <p><strong>Product:</strong> {profile.carDetails.product}</p>
                        <p><strong>Year:</strong> {profile.carDetails.year}</p>
                        <p><strong>Color:</strong> {profile.carDetails.color}</p>
                        <p><strong>Plate:</strong> {profile.carDetails.plateNumber}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "bookRide" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Want to book a ride</h3>
              </div>
            )}

            {activeTab === "city" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Want to travel from one city to another?</h3>
                <p className="text-gray-600">No ride history available yet.</p>
              </div>
            )}

            {activeTab === "freight" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Want to transfer your goods ?</h3>
                <p className="text-gray-600">No ride history available yet.</p>
              </div>
            )}

            {activeTab === "safety" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Your safety</h3>
                <p className="text-gray-600">No history available yet.</p>
              </div>
            )}

            {activeTab === "rides" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Your Rides</h3>
                <p className="text-gray-600">No ride history available yet.</p>
              </div>
            )}

            {activeTab === "suggestions" && (
              <div className="bg-opacity-90 p-6 rounded-lg shadow-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl text-white font-semibold">Suggestions</h3>
                  <button className="text-sm text-e-ride-purple hover:underline">See all</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {suggestions.map((suggestion, index) => {
                    const Icon = suggestion.icon;
                    return (
                      <button
                        key={index}
                        className={`${suggestion.color} p-4 rounded-lg flex items-center justify-center gap-2 text-gray-800 hover:shadow-md transition-shadow`}
                      >
                        <Icon size={24} />
                        <span className="text-sm font-medium">{suggestion.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Settings</h3>
                <p className="text-gray-600">Settings options will be added here.</p>
              </div>
            )}


            
                    {activeTab === "schedules" && (
                          <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-2xl">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Schedules</h3>
            
                          
                            {/* Schedules List */}
                            <div>
                              <h4 className="text-xl font-semibold text-gray-800 mb-4">All Schedules</h4>
                              {allSchedules.length === 0 ? (
                                <p className="text-gray-600">No schedules found.</p>
                              ) : (
                                <div className="space-y-4">
                                  {allSchedules.map((schedule) => (
                                    <div key={schedule._id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                                     <div className="flex items-center space-x-4">
  <img
    className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
    src={schedule.profileId?.profilePicture || "https://via.placeholder.com/150"}
    alt={`${schedule.profileId?.firstName} ${schedule.customerId?.lastName}`}
  />
  <button
    onClick={() => window.open(schedule.profileId?.profilePicture || "https://via.placeholder.com/150", "_blank")}
    className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
  >
    View
  </button>
</div>
                                       <p><strong>Name:</strong> {schedule.userId.firstName} {schedule.userId.lastName}</p>
                                       <p><strong>Email:</strong> {schedule.userId.email}</p>
                                       <p><strong>phone number:</strong> {schedule.profileId.phoneNumber}</p>
                                       <p><strong>Location:</strong> {schedule.profileId.location?.lga}, {schedule.profileId.location?.state},</p>
                                      <p><strong>Time:</strong> {schedule.formattedTime}</p>
                                      <p><strong>Location:</strong> {schedule.state}, {schedule.lga}, {schedule.address}</p>
                                      <p><strong>Price Range:</strong> ₦{schedule.priceRange.min} - ₦{schedule.priceRange.max}</p>
                                      {schedule.description && <p><strong>Description:</strong> {schedule.description}</p>}
                                      <p><strong>Status:</strong> {schedule.status}</p>
                                      <p><strong>Driver Response:</strong> {schedule.driverResponse.status}</p>
                                      {schedule.driverResponse.status === "negotiated" && (
                                        <p><strong>Negotiated Price:</strong> ₦{schedule.driverResponse.negotiatedPrice}</p>
                                      )}
                                      {schedule.driverResponse.driverId && (
                                        <div className="mt-2">
                                          <p><strong>Driver:</strong> {schedule.driverResponse.driverId.firstName} {schedule.driverResponse.driverId.lastName}</p>
                                          <p><strong>Email:</strong> {schedule.driverResponse.driverId.email}</p>
                                          <p><strong>Phone:</strong> {schedule.driverResponse.driverId.phoneNumber}</p>
                                          <p><strong>Location:</strong> {schedule.driverResponse.driverProfileId.location.state}, {schedule.driverResponse.driverProfileId.location.lga}</p>
                                        </div>
                                      )}
                                    </div>
                                    
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;