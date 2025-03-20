import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
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
  FaShieldAlt
} from "react-icons/fa";
import { toast } from "sonner";
import im1 from "../../assets/Rectangle 90 (1).png";
import im2 from "../../assets/Rectangle 90 (2).png";
import im3 from "../../assets/Rectangle 90.png";
import axios from "axios";
import TripForm from "./TripForm";

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [carPositions, setCarPositions] = useState([
    { lat: 37.7749, lng: -122.4194 },
    { lat: 37.7750, lng: -122.4184 },
    { lat: 37.7748, lng: -122.4204 },
  ]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false); // Toggle edit mode
  const [editedProfile, setEditedProfile] = useState({}); // Store editable profile data
  const mapRef = useRef();
  const navigate = useNavigate();

  const handleLogout=(() => {
    navigate("/plogin")
  })

  const handleFaceAuth =(() => {
    navigate("/face-auth")
  })

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
    if (!isMapLoaded || !mapRef.current) return;
    const interval = setInterval(() => {
      setCarPositions((prev) =>
        prev.map((pos) => ({
          lat: pos.lat + (Math.random() - 0.5) * 0.001,
          lng: pos.lng + (Math.random() - 0.5) * 0.001,
        }))
      );
    }, 2000);
    return () => clearInterval(interval);
  }, [isMapLoaded]);

  const handleSaveProfile = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/profile/update`, // Assuming an update endpoint
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

  const mapContainerStyle = { height: "100vh", width: "100%" };
  const center = { lat: 37.7749, lng: -122.4194 };
  const profile = data?.data;

  const sidebarItems = [
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "bookRide", label: "Book a Ride", icon: FaCar },
    { id: "suggestions", label: "Suggestions", icon: FaCar },
    { id: "city", label: "City to City", icon: FaRoute },
    { id: "freight", label: "Freight", icon: FaTruck },
    { id: "safety", label: "Safety", icon: FaShieldAlt },
    { id: "rides", label: "Rides", icon: FaRoute },
 
    { id: "settings", label: "Settings", icon: FaCog },
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
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_APP_GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
      onLoad={() => setIsMapLoaded(true)}
      onError={(error) => console.error("Google Maps API error:", error)}
    >
      <div className="relative w-full h-screen flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-20 w-56 bg-customPink text-white transform transition-transform duration-300 ease-in-out ${
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
                className={`w-full flex items-center p-4 hover:bg-activeColor transition-colors duration-200 ${
                  activeTab === item.id ? "bg-activeColor shadow-inner" : ""
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
          {isMapLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={center}
              zoom={13}
              options={{
                styles: [{ featureType: "all", elementType: "geometry", stylers: [{ saturation: -100 }, { lightness: 10 }] }],
                disableDefaultUI: true,
              }}
              onLoad={(map) => (mapRef.current = map)}
              className="opacity-10"
            >
              {carPositions.map((position, index) => (
                <Marker
                  key={index}
                  position={position}
                  icon={{ url: "https://img.icons8.com/?size=512&id=1378&format=png", scaledSize: new window.google.maps.Size(40, 40) }}
                />
              ))}
            </GoogleMap>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">Loading map...</div>
          )}

          <div className="absolute inset-0 flex flex-col">
            {/* Header */}
            <header className="bg-customPink text-white p-4 flex items-center justify-between shadow-md">
              <div>
                {profile ? (
                  <h2 className="text-xl font-bold">Welcome, {profile.userId.firstName} {profile.userId.lastName}!</h2>
                ) : (
                  <h2 className="text-xl font-bold">Welcome!</h2>
                )}
              </div>
              <div className="flex items-center space-x-4">
              <button 
              onClick={handleFaceAuth}>
                face-Auth
              </button>
              <button 
              onClick={handleLogout}
              className="font-semibold"
              >

                Logout
              </button>

                <FaBell size={20} className="cursor-pointer hover:text-gray-200" />
                <img src= "https://i.pravatar.cc/30?img" alt="Profile" className="w-10 h-10 rounded-full border-2 border-white" />
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
                      className="p-2 bg-e-ride-purple text-white rounded-full hover:bg-purple-700 transition-colors"
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
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-e-ride-purple"
                        />
                      </div>
                      <button
                        onClick={handleSaveProfile}
                        className="w-full py-2 bg-e-ride-purple text-white rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Save Changes
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-gray-700">
                      <p className="flex items-center"><FaUser className="mr-2 text-e-ride-purple" /> <strong>Name:</strong> <span className="ml-2">{profile.userId.firstName} {profile.userId.lastName}</span></p>
                      <p className="flex items-center"><FaEnvelope className="mr-2 text-e-ride-purple" /> <strong>Email:</strong> <span className="ml-2">{profile.userId.email}</span></p>
                      <p className="flex items-center"><FaCar className="mr-2 text-e-ride-purple" /> <strong>Role:</strong> <span className="ml-2 capitalize">{profile.role}</span></p>
                      <p className="flex items-center"><FaMapMarkerAlt className="mr-2 text-e-ride-purple" /> <strong>Location:</strong> <span className="ml-2">{profile.location.state}, {profile.location.lga}</span></p>
                      <p className="flex items-center"><FaPhone className="mr-2 text-e-ride-purple" /> <strong>Phone:</strong> <span className="ml-2">{profile.phoneNumber}</span></p>
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
                  <TripForm />
                  {/* <p className="text-gray-600">No ride history available yet.</p> */}
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
                  <p className="text-gray-600">No  history available yet.</p>
                </div>
              )}

              {activeTab === "rides" && (
                <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                  <h3 className="text-xl font-semibold mb-4">Your Rides</h3>
                  <p className="text-gray-600">No ride history available yet.</p>
                </div>
              )}

              {activeTab === "suggestions" && (
                <div className=" bg-opacity-90 p-6 rounded-lg shadow-lg">
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
                  {/* <div className="mt-6">
                    <h3 className="text-xl font-semibold mb-4">More Ways to Use eRide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rideOptions.map((option, index) => (
                        <div key={index} className="p-4 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
                          <img src={option.image} alt={option.label} className="w-full h-32 object-cover rounded-md mb-2" />
                          <h4 className="text-lg font-semibold">{option.label}</h4>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      ))}
                    </div>
                  </div> */}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-lg mx-auto">
                  <h3 className="text-xl font-semibold mb-4">Settings</h3>
                  <p className="text-gray-600">Settings options will be added here.</p>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    </LoadScript>
  );
};

export default Dashboard;