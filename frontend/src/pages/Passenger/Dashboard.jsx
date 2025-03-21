import React, { useState, useEffect, useRef } from "react";
import im from "../../assets/pic.jpg";
import { Link, useNavigate } from "react-router-dom";
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

const Dashboard = () => {
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
  const [showNotification, setShowNotification] = useState(false); 
  const [carData, setCarData] = useState(null); // State for car details
  const [carForm, setCarForm] = useState({
    carDetails: { model: "", product: "", year: "", color: "", plateNumber: "" },
    picture: "",
    carPicture: "",
    driverLicense: "",
  });
  const animationRef = useRef();
  const navigate = useNavigate();

  const handleCloseNotification = () => {
    setShowNotification(false)
  }


  const handleOwnACarClick = () => {
    setActiveTab("ownACar"); 
    setShowNotification(false); 
  };
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
          // Show notification on successful login
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 15000); // Hide after 5 seconds
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





// Cloudinary upload function
  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "essential"); // Ensure this matches your Cloudinary preset

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dc0poqt9l/image/upload`, // Replace 'dc0poqt9l' with your Cloudinary cloud name
        formData
      );
      return response.data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image to Cloudinary");
    }
  };

  // Fetch car profile
  const fetchCarProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/ownacar/getmyCarProfile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        setCarData(response.data.data);
      } else {
        setCarData(null); // No car registered yet
      }
    } catch (error) {
      console.error("Error fetching car profile:", error);
      setCarData(null);
    }
  };

  // Handle car registration form submission with Cloudinary uploads
  const handleCarSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      setLoading(true); // Indicate loading state

      // Upload images to Cloudinary
      const pictureUrl = carForm.picture ? await uploadToCloudinary(carForm.picture) : null;
      const carPictureUrl = carForm.carPicture ? await uploadToCloudinary(carForm.carPicture) : null;
      const driverLicenseUrl = carForm.driverLicense ? await uploadToCloudinary(carForm.driverLicense) : null;

      // Prepare data for backend
      const carDataToSend = {
        carDetails: carForm.carDetails,
        picture: pictureUrl,
        carPicture: carPictureUrl,
        driverLicense: driverLicenseUrl,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/ownacar/registeryourcar`,
        carDataToSend,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status) {
        toast.success("Car registered successfully", { style: { background: "#4CAF50", color: "white" } });
        fetchCarProfile(); // Refresh car data
        setCarForm({
          carDetails: { model: "", product: "", year: "", color: "", plateNumber: "" },
          picture: null,
          carPicture: null,
          driverLicense: null,
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to register car";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "ownACar") {
      fetchCarProfile();
    }
  }, [activeTab]);


 

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
    { id: "ownACar", label: "own a car?", icon: FaCar},
    { id: "schedule", label: "have a schedule?", icon: FaCalendar},
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

  const rideOptions = [
    { image: im1, label: "Car rides", description: "Daily commuting made easy." },
    { image: im2, label: "Home drop off", description: "Safe and convenient arrival." },
    { image: im3, label: "Office drop off", description: "Stress-free workday start." },
  ];

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
          className="absolute transition-all duration-30 ease-linear"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <FaCar size={40} className="text-yellow-500 animate-bounce" />
        </div>
      ))}

      {/* Notification Grid Box */}
      <div
        className={`fixed top-4 right-0 z-50 w-64 p-4 bg-lime-900 text-white rounded-l-lg shadow-lg transform transition-transform duration-500 ease-in-out ${
          showNotification ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-Wrap ">
        <h3 className="text-lg font-semibold">Welcome Back!</h3> 
        <h3 className="text-sm font-bold pl-7" onClick={() => setShowNotification(false)}>
          close
        </h3>

        </div>
       
        <p className="text-sm">You’ve successfully logged in to e-Ride.</p>
        <p className="text-sm">Do you know that if you own a car,you can also <br/> transport people at your leisure time?</p>
        <p className="text-sm"> click on this link for more information 
          
          
          <button className="bg-customPink p-3 mr-3 text-black rounded-full" onClick={handleOwnACarClick}>
            View more
            </button>
            </p>
      </div>

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

        {/* {activeTab === "ownACar" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">You own a car</h3>
                <p className="text-gray-600">you will have to fill your details.</p>
              </div>
            )} */}

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



        {activeTab === "ownACar" && (
              <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl max-w-md mx-auto transform transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Own a Car?</h3>
                {carData ? (
                  <div className="space-y-3 text-gray-700">
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Model:</strong>{" "}
                      <span className="ml-2">{carData.carDetails.model}</span>
                    </p>
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Product:</strong>{" "}
                      <span className="ml-2">{carData.carDetails.product}</span>
                    </p>
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Year:</strong>{" "}
                      <span className="ml-2">{carData.carDetails.year}</span>
                    </p>
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Color:</strong>{" "}
                      <span className="ml-2">{carData.carDetails.color}</span>
                    </p>
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Plate Number:</strong>{" "}
                      <span className="ml-2">{carData.carDetails.plateNumber}</span>
                    </p>
                    <p className="flex items-center">
                      <FaUser className="mr-2 text-customGreen" /> <strong>Picture:</strong>{" "}
                      <a href={carData.picture} target="_blank" className="ml-2 text-blue-500 hover:underline">
                        View
                      </a>
                    </p>
                    <p className="flex items-center">
                      <FaCar className="mr-2 text-customGreen" /> <strong>Car Picture:</strong>{" "}
                      <a href={carData.carPicture} target="_blank" className="ml-2 text-blue-500 hover:underline">
                        View
                      </a>
                    </p>
                    <p className="flex items-center">
                      <FaShieldAlt className="mr-2 text-customGreen" /> <strong>Driver License:</strong>{" "}
                      <a href={carData.driverLicense} target="_blank" className="ml-2 text-blue-500 hover:underline">
                        View
                      </a>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleCarSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <input
                      type="text"
                      value={carForm.carDetails.model}
                      onChange={(e) =>
                        setCarForm({
                          ...carForm,
                          carDetails: { ...carForm.carDetails, model: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Product</label>
                    <input
                      type="text"
                      value={carForm.carDetails.product}
                      onChange={(e) =>
                        setCarForm({
                          ...carForm,
                          carDetails: { ...carForm.carDetails, product: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <input
                      type="text"
                      value={carForm.carDetails.year}
                      onChange={(e) =>
                        setCarForm({
                          ...carForm,
                          carDetails: { ...carForm.carDetails, year: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Color</label>
                    <input
                      type="text"
                      value={carForm.carDetails.color}
                      onChange={(e) =>
                        setCarForm({
                          ...carForm,
                          carDetails: { ...carForm.carDetails, color: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Plate Number</label>
                    <input
                      type="text"
                      value={carForm.carDetails.plateNumber}
                      onChange={(e) =>
                        setCarForm({
                          ...carForm,
                          carDetails: { ...carForm.carDetails, plateNumber: e.target.value },
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">A different Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCarForm({ ...carForm, picture: e.target.files[0] })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Car Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCarForm({ ...carForm, carPicture: e.target.files[0] })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Driver License</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setCarForm({ ...carForm, driverLicense: e.target.files[0] })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 bg-activeColor text-white rounded-lg hover:bg-customGreen transition-colors ${
                      loading ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  >
                    {loading ? "Uploading..." : "Register Car"}
                  </button>
                </form>
                )}
              </div>
            )}


        {activeTab === "schedule" && (
              <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                <h3 className="text-xl font-semibold mb-4">Will you like to have a schedule so as to avoid a delay for your trip?</h3>
                <p className="text-gray-600">No ride history available yet.</p>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;