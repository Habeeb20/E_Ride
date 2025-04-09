import  { useState, useEffect, useRef } from "react";
import im from "../../assets/pic.jpg";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { nigeriaAirportsByState } from "../../airportAndState";
import io from "socket.io-client"
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
  FaCalendarCheck
} from "react-icons/fa";
import { toast } from "sonner";
import im1 from "../../assets/Rectangle 90 (1).png";
import im2 from "../../assets/Rectangle 90 (2).png";
import im3 from "../../assets/Rectangle 90.png";
import axios from "axios";
import { statesAndLgas } from "../../stateAndLga";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa"; // Import arrow icons
import Fare from "../Fare";
import Ride from "./Ride";
import RideHistory from "./RideHistory";
import RideTracking from "./RideTracking";
import PassengerRides from "./PassengerRides";
import RegisterVehicle from "../Vehicle/RegisterVehicle";
import AvailableVehicles from "../Vehicle/AvailableVehicle";
import OwnerDashboard from "../Vehicle/OwnerDashboard";
import BookSchedule from "./BookSchedule";
import DriverSchedule from "../Driver/DriverSchedule";
import Freight from "./Freight";


// Inside your Dashboard component:
const Dashboard = () => {
  const sliderRef = useRef(null);
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
  const [activeTab, setActiveTab] = useState("bookRide");
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState({});
  const [showNotification, setShowNotification] = useState(false);
  const [allSchedules, setAllSchedules] = useState([]);
  const [carData, setCarData] = useState(null);
  const [driverDetailsModal, setDriverDetailsModal] = useState(false); // Fixed syntax
  const [selectedDriverSchedule, setSelectedDriverSchedule] = useState(null); 
  const [chatModal, setChatModal] = useState(false); 
  const [selectedChatScheduleId, setSelectedChatScheduleId] = useState(null); // Track chat schedule
  const [airport, setAirport] = useState([])
  const [carForm, setCarForm] = useState({
    carDetails: { model: "", product: "", year: "", color: "", plateNumber: "" },
    picture: "",
    carPicture: "",
    driverLicense: "",
  });
  const [scheduleForm, setScheduleForm] = useState({
    time: "",
    date: "",
    state: "",
    lga: "",
    pickUp: "",
    address: "",
    priceRange: { min: "", max: "" },
    description: "",
  });
  const [schedules, setSchedules] = useState([]);
  const animationRef = useRef();
  const navigate = useNavigate();
  const [negotiationPrice, setNegotiationPrice] = useState({});
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState(null);
  const [negotiatedPriceInput, setNegotiatedPriceInput] = useState("");
  const [showLorryModal, setShowLorryModal] = useState(false);
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [pickup, setPickup] = useState({
    state:"",
    airportName:"",
    homeAddress:"",
    time:"",
    pickupOrdropoff: "",
    date:""
  })
  const [pickupModal, setPickupModals] = useState(false)

  const [rideForm, setRideForm] = useState({
    pickupAddress: "",
    destinationAddress: "",
    distance: "",
    calculatedPrice: "",
    desiredPrice: "",
    rideOption: "",
    paymentMethod: "",
  });

  const handleCloseNotification = () => {
    setShowNotification(false);
  };

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

  const token = localStorage.getItem("token");

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
          setShowNotification(true);
          setTimeout(() => setShowNotification(false), 15000);
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
              x:
                pos === prevPositions[0]
                  ? 50
                  : pos === prevPositions[1]
                    ? window.innerWidth - 50
                    : pos === prevPositions[2]
                      ? 50
                      : window.innerWidth - 50,
              y:
                pos === prevPositions[0]
                  ? 50
                  : pos === prevPositions[1]
                    ? 50
                    : pos === prevPositions[2]
                      ? window.innerHeight - 50
                      : window.innerHeight - 50,
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
        data: {
          ...data.data,
          userId: { ...data.data.userId, ...editedProfile },
          phoneNumber: editedProfile.phoneNumber,
          location: editedProfile.location,
        },
      });
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
    formData.append("upload_preset", "essential");

    try {
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/dc0poqt9l/image/upload`,
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
        setCarData(null);
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
      setLoading(true);

      const pictureUrl = carForm.picture ? await uploadToCloudinary(carForm.picture) : null;
      const carPictureUrl = carForm.carPicture ? await uploadToCloudinary(carForm.carPicture) : null;
      const driverLicenseUrl = carForm.driverLicense ? await uploadToCloudinary(carForm.driverLicense) : null;

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
        fetchCarProfile();
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





  const [location, setLocation] = useState({ latitude: null, longitude: null, name: null });


  useEffect(() => {
      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
              async (position) => {
                  const { latitude, longitude } = position.coords;

                  // Fetch location name using Nominatim API
                  try {
                      const response = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                      );
                      const data = await response.json();
                      const locationName = data.display_name || 'Unknown location';

                      // Update state with coordinates and name
                      setLocation({ latitude, longitude, name: locationName });

                      // Send location to backend
                      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/save-location`, {
                          method: 'POST',
                          body: JSON.stringify({ latitude, longitude, userId: token }),
                          headers: { 'Content-Type': 'application/json' }
                      });
                  } catch (error) {
                      console.error('Error fetching location name:', error);
                      setLocation({ latitude, longitude, name: 'Error fetching location' });
                  }
              },
              (error) => {
                  console.error("Location access denied:", error.message);
                  setLocation({ latitude: null, longitude: null, name: 'Location access denied' });
              }
          );
      } else {
          setLocation({ latitude: null, longitude: null, name: 'Geolocation not supported' });
      }
  }, []);

  




    useEffect(() => {
     
      fetch(`${import.meta.VITE_BACKEND_URL}/api/auth/get-location/${token}`)
          .then(response => response.json())
          .then(data => {
              if (data.latitude && data.longitude) {
                  setLocation({ latitude: data.latitude, longitude: data.longitude });
              }
          })
          .catch(err => console.error('Error fetching location:', err));
  
      // Then try to update with current location
      if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
              (position) => {
                  const { latitude, longitude } = position.coords;
                  setLocation({ latitude, longitude });
  
                  fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/save-location`, {
                      method: 'POST',
                      body: JSON.stringify({ latitude, longitude, userId: token }),
                      headers: { 'Content-Type': 'application/json' }
                  });
              },
              (error) => console.error("Location access denied:", error.message)
          );
      }
  }, []);


  
  const fetchMySchedules = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/getmyschedules`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        setSchedules(response.data.schedules);
        console.log(response.data.schedules);
      } else {
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSchedules([]);
      toast.error("Failed to fetch schedules", { style: { background: "#F44336", color: "white" } });
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    try {
      setLoading(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/postschedule`,
        scheduleForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.status) {
        toast.success("Schedule posted successfully", { style: { background: "#4CAF50", color: "white" } });
        fetchMySchedules();
        setScheduleForm({
          time: "",
          date: "",
          state: "",
          lga: "",
          address: "",
          priceRange: { min: "", max: "" },
          description: "",
        });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to post schedule";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    } finally {
      setLoading(false);
    }
  };

 

  useEffect(() => {
    if (activeTab === "ownACar") {
      fetchCarProfile();
    } else if (activeTab === "schedule") {
      fetchMySchedules();
    } else if (activeTab === "allSchedules") {
      const isDriver = data?.data?.role === "driver";
      const isPassengerWithCar = data?.data?.role === "passenger" && carData;
      if (isDriver || isPassengerWithCar) {
        fetchAllSchedules();
      }
    }
  }, [activeTab, data, carData]);

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
        fetchAllSchedules();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || `Failed to ${action} schedule`;
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    }
  };

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


  const [chatMessages, setChatMessages] = useState({});
  const [chatInput, setChatInput] = useState("");

  const [filter, setFilter] = useState({ state: "", lga: "" });

  // Fetch chat messages
  const fetchChatMessages = async (scheduleId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/chat/${scheduleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        setChatMessages((prev) => ({ ...prev, [scheduleId]: response.data.chat.messages }));
      }
    } catch (error) {
      console.error("Error fetching chat:", error);
      toast.error("Failed to fetch chat messages");
    }
  };

  // Send chat message
  const sendChatMessage = async (scheduleId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/schedule/chat/send`,
        { scheduleId, content: chatInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.status) {
        setChatMessages((prev) => ({
          ...prev,
          [scheduleId]: response.data.chat.messages,
        }));
        setChatInput("");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  // Update fetchAllSchedules with filter
  const fetchAllSchedules = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/schedule/allschedules`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filter, // Pass filter as query params
      });
      if (response.data.status) {
        setAllSchedules(response.data.schedules);
      } else {
        setAllSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching all schedules:", error);
      setAllSchedules([]);
      toast.error("Failed to fetch all schedules");
    }
  };

  // Update useEffect to include filter changes
  useEffect(() => {
    if (activeTab === "ownACar") {
      fetchCarProfile();
    } else if (activeTab === "schedule") {
      fetchMySchedules();
    } else if (activeTab === "allSchedules") {
      const isDriver = data?.data?.role === "driver";
      const isPassengerWithCar = data?.data?.role === "passenger" && carData;
      if (isDriver || isPassengerWithCar) {
        fetchAllSchedules();
      }
    }
  }, [activeTab, data, carData, filter]);

  const fetchMyAirportsPickups= async () => {
    const token = localStorage.getItem("token")
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/airport/getmyairport`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.status) {
        setAirport(response.data.airport);
        console.log(response.data.airport);
      } else {
        setAirport([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setAirport([]);
      toast.error("Failed to fetch schedules", { style: { background: "#F44336", color: "white" } });
    }
  }


  const handleAirportPickup = async(e) => {
    e.preventDefault()
    const token = localStorage.getItem("token");
    try {
      setLoading(true)
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/airport/postairport`, pickup,{
        headers: {Authorization: `Bearer ${token}`}
      })
      if(response.data.status){
        toast.success("your airport pickup/dropoff posted, available  driver will accept or negotiate with you shortly",  { style: { background: "#4CAF50", color: "white" } })
        fetchMyAirportsPickups()
        setPickup({
          state:"",
          homeAddress:"",
          airportName:"",
          time:""
        })
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Failed to post schedule";
      toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {

    fetchMyAirportsPickups()
  }, [])


    // Handle ride submission aligned with /create route
    const handleRideSubmit = async (e) => {
      e.preventDefault();
      const token = localStorage.getItem("token");
      try {
        setLoading(true);
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/api/rides/create`,
          rideForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success("Ride request created successfully", { style: { background: "#4CAF50", color: "white" } });
        setRideForm({
          pickupAddress: "",
          destinationAddress: "",
       
          distance: "",
          calculatedPrice: "",
          desiredPrice: "",
          rideOption: "",
          paymentMethod: "",
        });
      } catch (error) {
        const errorMessage = error.response?.data?.error || "Failed to create ride request";
        toast.error(errorMessage, { style: { background: "#F44336", color: "white" } });
      } finally {
        setLoading(false);
      }
    };


  

  const profile = data?.data;

  const sidebarItems = [
    { id: "bookRide", label: "Book a Ride", icon: FaCar },
    { id: "suggestions", label: "Suggestions", icon: FaCar },
  
    { id: "freight", label: "Freight", icon: FaTruck },
    { id: "safety", label: "My-Rides", icon: FaShieldAlt },
    { id: "ownACar", label: "own a car?", icon: FaCar },
    { id: "profile", label: "Profile", icon: FaUser },
    { id: "settings", label: "Settings", icon: FaCog },
    { id: "rideAlong", label: "ride along?", icon: FaCar },
    { id: "schedule", label: "have a schedule?", icon: FaCalendar },
    { id: "bookings", label: "Your Bookings", icon: FaCalendarCheck },
    { id: "rides", label: "rent your vehicle?", icon: FaRoute },
    { id: "vehicle", label: "who wants to rent your vehicle?", icon: FaRoute },
  ];

  const suggestions = [

    { icon: FaPlane, label: "airport pickup", color: "bg-purple-100", onClick: () => setPickupModals(true)},
    { icon: FaPlane, label: "airport drop off", color: "bg-gray-100", onClick: () => setPickupModals(true) },
    { icon: FaTruck, label: 'pickup lorry', color: 'bg-blue-100', onClick: () => setShowLorryModal(true) },
    { icon: FaBus, label: "bus travel", color: "bg-yellow-100",  onClick: () => setShowLorryModal(true) },
    { icon: FaTruck, label: "pickup van", color: "bg-green-100",  onClick: () => setShowLorryModal(true) },
    { icon: FaTrailer, label: "pickup trailer", color: "bg-pink-100",  onClick: () => setShowLorryModal(true) },
  
  ];

  const isDriver = profile?.role === "driver";
  const isPassengerWithCar = profile?.role === "passenger" && carData;

  return (
    <div
      className="relative w-full h-screen flex overflow-hidden bg-cover bg-center"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${im})`,
      }}
    >
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


      {/* Modal for Pickup Lorry */}
      {showLorryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Available Lorries</h2>
              <button
                onClick={() => setShowLorryModal(false)}
                className="text-gray-600 hover:text-gray-800 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <AvailableVehicles onClose={() => setShowLorryModal(false)} filterType="lorry" />
          </div>
        </div>
      )}

      <div
        className={`fixed top-4 right-0 z-50 w-64 p-4 bg-lime-900 text-white rounded-l-lg shadow-lg transform transition-transform duration-500 ease-in-out ${showNotification ? "translate-x-0" : "translate-x-full"
          }`}
      >
        <div className="flex flex-wrap">
          <h3 className="text-lg font-semibold">Welcome Back!</h3>
          <h3 className="text-sm font-bold pl-7" onClick={() => setShowNotification(false)}>
            close
          </h3>
        </div>
        <p className="text-sm">You’ve successfully logged in to e-Ride.</p>
        <p className="text-sm">Do you know that if you own a car, you can also <br /> transport people at your leisure time?</p>
        <p className="text-sm">
          click on this link for more information
          <button className="bg-customPink p-3 mr-3 text-black rounded-full" onClick={handleOwnACarClick}>
            View more
          </button>
        </p>
      </div>

      <div
        className={`fixed inset-y-0 left-0 z-20 w-56 bg-activeColor text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
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
              className={`w-full flex items-center p-4 hover:bg-customColor transition-colors duration-200 ${activeTab === item.id ? "bg-customPink shadow-inner" : ""
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
            {location.name ? (
                <p>Your Location: <span className="text-customPink  rounded-lg">{location.name}</span></p>
            ) : (
                <p>Fetching location...</p>
            )}
            <div className="flex items-center space-x-4">
              <button onClick={handleFaceAuth}>face-Auth</button>
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

            {activeTab === "bookRide" && (
              <div className="">
             
                  <Ride />
             
              </div>
            )}

            {activeTab === "city" && (
              <div className="">
                  {/* <RideTracking /> */}
              </div>
            )}

{activeTab === "rideAlong" && (
              <div className="">
                 <DriverSchedule />
              </div>
            )}


            {activeTab === "freight" && (
              <div className="">
               <Freight />
              </div>
            )}

            {activeTab === "safety" && (
              <div className="">
                <PassengerRides />
              </div>
            )}

            {activeTab === "rides" && (
              <div className="">
                <h2 className="text-white font-bold text-align-center">Do you own a vehicle to rent out?</h2>
                <RegisterVehicle />
                
              </div>
            )}

{activeTab === "vehicle" && (
              <div className="">
              <OwnerDashboard />
                
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
                        onClick={suggestion.onClick}
                      >
                        <Icon size={24} />
                        <span className="text-sm font-medium">{suggestion.label}</span>
                      </button>
                    );
                  })}

{pickupModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-y-auto transform transition-all duration-300 hover:shadow-3xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Pick Up / Drop Off</h3>
              <button
                onClick={() => setPickupModals(false)}
                className="text-gray-500 hover:text-gray-700 font-medium text-sm transition-colors"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleAirportPickup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <select
                  value={pickup.pickupOrdropoff}
                  onChange={(e) => setPickup({ ...pickup, pickupOrdropoff: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-800"
                  required
                >
                  <option value="">Select</option>
                  <option value="pickup">Pick Up</option>
                  <option value="dropoff">Drop Off</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pick Up/Drop Off Address</label>
                <input
                  type="text"
                  value={pickup.homeAddress}
                  onChange={(e) => setPickup({ ...pickup, homeAddress: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">State (Destination)</label>
                <select
                  value={pickup.state}
                  onChange={(e) => setPickup({ ...pickup, state: e.target.value, airportName: "" })} // Reset airportName when state changes
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-800"
                  required
                >
                  <option value="">Select a State</option>
                  {Object.keys(nigeriaAirportsByState).map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airport</label>
                {/* Debugging log */}
                {console.log("Selected state:", pickup.state)}
                {console.log("Airports:", pickup.state ? nigeriaAirportsByState[pickup.state] : "No state selected")}
                <select
                  value={pickup.airportName}
                  onChange={(e) => setPickup({ ...pickup, airportName: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-800 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                  disabled={!pickup.state}
                >
                  <option value="">Select an Airport</option>
                  {pickup.state &&
                    nigeriaAirportsByState[pickup.state].map((airport) => (
                      <option key={airport} value={airport}>
                        {airport}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input
                  type="time"
                  value={pickup.time}
                  onChange={(e) => setPickup({ ...pickup, time: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-800"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={pickup.date}
                  onChange={(e) => setPickup({ ...pickup, date: e.target.value })}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-gray-50 text-gray-800"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 bg-customPink text-white rounded-lg font-semibold text-base tracking-tight hover:bg-activeColor text-black transition-all duration-200 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Posting..." : "Post Your Request"}
              </button>
            </form>
          </div>
        </div>
      )}
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
              <>
                 <div className="">
                <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl transform transition-all duration-300 hover:shadow-2xl">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                    <FaCar className="mr-2 text-customGreen" /> Own a Car?
                  </h3>
                  {carData ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4 text-gray-700">
                        <p className="flex items-center">
                          <FaCar className="mr-2 text-customGreen" /> <strong className="font-semibold">Model:</strong>
                          <span className="ml-2">{carData.carDetails.model}</span>
                        </p>
                        <p className="flex items-center">
                          <FaCar className="mr-2 text-customGreen" /> <strong className="font-semibold">Product:</strong>
                          <span className="ml-2">{carData.carDetails.product}</span>
                        </p>
                        <p className="flex items-center">
                          <FaCar className="mr-2 text-customGreen" /> <strong className="font-semibold">Year:</strong>
                          <span className="ml-2">{carData.carDetails.year}</span>
                        </p>
                        <p className="flex items-center">
                          <FaCar className="mr-2 text-customGreen" /> <strong className="font-semibold">Color:</strong>
                          <span className="ml-2">{carData.carDetails.color}</span>
                        </p>
                        <p className="flex items-center">
                          <FaCar className="mr-2 text-customGreen" /> <strong className="font-semibold">Plate Number:</strong>
                          <span className="ml-2">{carData.carDetails.plateNumber}</span>
                        </p>
                      </div>
                      <div className="space-y-4 text-gray-700">
                        <p className="flex items-center">
                          <FaUser className="mr-2 text-customGreen" /> <strong className="font-semibold">Picture:</strong>
                          <a
                            href={carData.picture}
                            target="_blank"
                            className="ml-2 text-blue-500 hover:underline hover:text-blue-700 transition-colors"
                          >
                            View
                          </a>
                        </p>
                        <p className="flex items-center">
                          <FaCar className="mr-2 text-customGreen" /> <strong className="font-semibold">Car Picture:</strong>
                          <a
                            href={carData.carPicture}
                            target="_blank"
                            className="ml-2 text-blue-500 hover:underline hover:text-blue-700 transition-colors"
                          >
                            View
                          </a>
                        </p>
                        <p className="flex items-center">
                          <FaShieldAlt className="mr-2 text-customGreen" /> <strong className="font-semibold">Driver License:</strong>
                          <a
                            href={carData.driverLicense}
                            target="_blank"
                            className="ml-2 text-blue-500 hover:underline hover:text-blue-700 transition-colors"
                          >
                            View
                          </a>
                        </p>
                      </div>
                   
                    </div>
                  ) : (
                    <form onSubmit={handleCarSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Model</label>
                          <input
                            type="text"
                            value={carForm.carDetails.model}
                            onChange={(e) =>
                              setCarForm({ ...carForm, carDetails: { ...carForm.carDetails, model: e.target.value } })
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Product</label>
                          <input
                            type="text"
                            value={carForm.carDetails.product}
                            onChange={(e) =>
                              setCarForm({ ...carForm, carDetails: { ...carForm.carDetails, product: e.target.value } })
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Year</label>
                          <input
                            type="text"
                            value={carForm.carDetails.year}
                            onChange={(e) =>
                              setCarForm({ ...carForm, carDetails: { ...carForm.carDetails, year: e.target.value } })
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Color</label>
                          <input
                            type="text"
                            value={carForm.carDetails.color}
                            onChange={(e) =>
                              setCarForm({ ...carForm, carDetails: { ...carForm.carDetails, color: e.target.value } })
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Plate Number</label>
                          <input
                            type="text"
                            value={carForm.carDetails.plateNumber}
                            onChange={(e) =>
                              setCarForm({ ...carForm, carDetails: { ...carForm.carDetails, plateNumber: e.target.value } })
                            }
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-customGreen focus:border-transparent transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCarForm({ ...carForm, picture: e.target.files[0] })}
                            className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-customGreen file:text-white hover:file:bg-green-700 transition-all"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Car Picture</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCarForm({ ...carForm, carPicture: e.target.files[0] })}
                            className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-customGreen file:text-white hover:file:bg-green-700 transition-all"
                            required
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">Driver License</label>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCarForm({ ...carForm, driverLicense: e.target.files[0] })}
                            className="w-full p-3 border border-gray-300 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-customGreen file:text-white hover:file:bg-green-700 transition-all"
                            required
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 bg-customGreen text-white rounded-lg font-semibold hover:bg-green-700 transition-colors duration-300 ${loading ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                      >
                        {loading ? "Uploading..." : "Register Car"}
                      </button>
                    </form>
                  )}
                </div>
               


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
              </div>
            
              </>
           
            )}

            {activeTab === "schedule" && (
              <div className="">
                <BookSchedule />
             
              </div>
            )}


            {activeTab === "bookings" && (
              <div className="bg-white bg-opacity-95 p-6 rounded-xl shadow-xl max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-2xl">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Bookings</h3>

            
                <div>
                  <h4 className="text-xl font-semibold text-gray-800 mb-4">Your Bookings</h4>
                  {airport.length === 0 ? (
                    <p className="text-gray-600">you havnt made any bookings yet</p>
                  ) : (
                    <div className="space-y-4">
                      <Slider
                        ref={sliderRef} // Attach ref to slider
                        dots={true}
                        infinite={true}
                        speed={500}
                        slidesToShow={1}
                        slidesToScroll={1}
                        arrows={false} // Disable default arrows
                        className="w-full"
                        prevArrow={<button className="slick-prev bg-gray-800 text-white p-2 rounded-full" />}
                        nextArrow={<button className="slick-next bg-gray-800 text-white p-2 rounded-full" />}
                      >
                        {airport.map((schedule) => (
                          <div key={schedule._id} className="p-4 bg-gray-50 rounded-lg shadow-sm">
                              <p>
                              <strong>mode:</strong> {schedule.pickupOrdropoff}
                            </p>
                            {schedule.airportName && (
                              <> 
                                  <p>
                               <strong>Airport name:</strong> {schedule.airportName}
                             </p>
                                 <p>
                                 <strong>state:</strong> {schedule.state}
                               </p>
                              </>
                           

                            )

                            }
                            <p>
                              <strong>Time:</strong> {schedule.time}
                            </p>
                            <p>
                              <strong>Date:</strong> {schedule.date}
                            </p>
                            <p>
                              <strong>Location:</strong> {schedule.state}, {schedule.lga}, {schedule.address}
                            </p>
    
                         
                            <p>
                              <strong>Status: </strong>
                              <span
                                className={
                                  schedule.status === "confirmed"
                                    ? "text-green-600"
                                    : schedule.status === "pending"
                                      ? "text-yellow-600"
                                      : "text-red-600"
                                }
                              >
                                {schedule.status}
                              </span>
                            </p>

                            <h3 className="font-bold text-customPink text-center">Driver details</h3>

                            <p>
                              <strong>Driver Response:</strong>{" "}
                              <span
                                className={
                                  schedule.driverResponse.status === "accepted"
                                    ? "text-green-600 font-bold"
                                    : schedule.driverResponse.status === "pending"
                                      ? "text-yellow-500 font-bold"
                                      : schedule.driverResponse.status === "negotiated"
                                        ? "text-blue-600 font-bold"
                                        : "text-red-600 font-bold"
                                }
                              >
                                {schedule.driverResponse.status}
                              </span>
                            </p>
                            {schedule.driverResponse.status === "negotiated" && (
                              <p>
                                <strong>Negotiated Price:</strong> ₦{schedule.driverResponse.negotiatedPrice}
                              </p>
                            )}
                          {schedule.driverResponse.driverId && (schedule.driverResponse.status === "accepted" || schedule.driverResponse.status === "negotiated") && (
                              <div className="mt-2">
                                <p>
                                  <strong>Driver:</strong> {schedule.driverResponse.driverId.firstName}{" "}
                                  {schedule.driverResponse.driverId.lastName}
                                </p>
                                <p>
                                  <strong>Email:</strong> {schedule.driverResponse.driverId.email}
                                </p>
                                <p>
                                  <strong>Phone:</strong> {schedule.driverResponse.driverProfileId.phoneNumber}
                                </p>
                                <p>
                                  <strong>Location:</strong> {schedule.driverResponse.driverProfileId.location.state},{" "}
                                  {schedule.driverResponse.driverProfileId.location.lga}
                                </p>
                                <div className="flex flex-wrap space-x-2">
                                <button
                                  onClick={() => {
                                    setDriverDetailsModal(true);
                                    setSelectedDriverSchedule(schedule);
                                  }}
                                  className="bg-green-700 p-3 text-white rounded-lg ml-17"
                                >
                                  view driver details
                                </button>
                                <button
                            onClick={() => {
                              setChatModal(true);
                              setSelectedChatScheduleId(schedule._id);
                              fetchChatMessages(schedule._id); // Fetch messages when opening chat
                            }}
                            className="bg-blue-600 p-3 text-white rounded-lg"
                          >
                            Chat with Driver
                          </button>

                                </div>
                          
                              </div>
                            )}
                          </div>
                        ))}
                      </Slider>
                      <button
                        onClick={() => sliderRef.current.slickPrev()}
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-12 bg-gray-800 text-white p-3 rounded-full hover:bg-gray-600"
                      >
                        <FaArrowLeft size={20} />
                      </button>
                      <button
                        onClick={() => sliderRef.current.slickNext()}
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-12 bg-gray-800 text-white p-3 rounded-full hover:bg-gray-600"
                      >
                        <FaArrowRight size={20} />
                      </button>
                    </div>
                  )}

{chatModal && selectedChatScheduleId && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-xl shadow-xl max-w-md w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Chat with Driver</h3>
                <div className="h-64 overflow-y-auto mb-4 p-2 bg-gray-100 rounded-lg">
                  {chatMessages[selectedChatScheduleId]?.length > 0 ? (
                    chatMessages[selectedChatScheduleId].map((msg, index) => (
                      <div
                        key={index}
                        className={`mb-2 ${
                          msg.sender._id === data?.data?._id ? "text-right" : "text-left"
                        }`}
                      >
                        <p className="inline-block p-2 rounded-lg bg-blue-100">{msg.content}</p>
                        <p className="text-xs text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-600">No messages yet</p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 p-2 border border-gray-300 rounded-lg"
                    placeholder="Type a message..."
                  />
                  <button
                    onClick={() => sendChatMessage(selectedChatScheduleId)}
                    className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Send
                  </button>
                </div>
                <button
                  onClick={() => {
                    setChatModal(false);
                    setSelectedChatScheduleId(null);
                    setChatInput("");
                  }}
                  className="mt-4 py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          )} 

                  {/* Driver Details Modal */}
                  {driverDetailsModal && selectedDriverSchedule && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full p-6 transform transition-all duration-300 scale-95 sm:scale-100">
                        <div className="flex justify-between items-center mb-6">
                          <h2 className="text-2xl font-bold text-gray-800">Driver Details</h2>
                          <button
                            onClick={() => setDriverDetailsModal(false)}
                            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
                          >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <img
                              src={selectedDriverSchedule.driverResponse.driverProfileId.profilePicture}
                              alt="Driver Profile"
                              className="w-full h-40 object-cover rounded-lg"
                            />
                            <button
                              onClick={() =>
                                window.open(
                                  selectedDriverSchedule.driverResponse.driverProfileId.profilePicture,
                                  "_blank"
                                )
                              }
                              className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
                            >
                              View
                            </button>
                          </div>
                          <div className="space-y-2">
                            <p>
                              <strong>Driver:</strong> {selectedDriverSchedule.driverResponse.driverId.firstName}{" "}
                              {selectedDriverSchedule.driverResponse.driverId.lastName}
                            </p>
                            <p>
                              <strong>Email:</strong> {selectedDriverSchedule.driverResponse.driverId.email}
                            </p>
                            <p>
                              <strong>Phone:</strong> {selectedDriverSchedule.driverResponse.driverProfileId.phoneNumber}
                            </p>
                            <p>
                              <strong>Location:</strong>{" "}
                              {selectedDriverSchedule.driverResponse.driverProfileId.location.state},{" "}
                              {selectedDriverSchedule.driverResponse.driverProfileId.location.lga}
                            </p>
                            <p>
                              <strong>Role:</strong> {selectedDriverSchedule.driverResponse.driverProfileId.role}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">Car Details</h3>
                            <p>
                              <strong>Car Picture:</strong>{" "}
                              <img
                                className="w-16 h-16 rounded-full border-4 border-customGreen shadow-lg object-cover transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-customGreen-dark"
                                src={selectedDriverSchedule.driverResponse.driverProfileId.carPicture || "https://via.placeholder.com/150"}
                                alt={`${selectedDriverSchedule.driverResponse.driverId?.firstName} ${selectedDriverSchedule.driverResponse.driverId?.lastName}`}
                              />
                              <button
                                onClick={() =>
                                  window.open(
                                    selectedDriverSchedule.driverResponse.driverProfileId.carPicture,
                                    "_blank"
                                  )
                                }
                                className="py-1 px-3 bg-customGreen text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
                              >
                                View
                              </button>

                            </p>
                            <p>
                              <strong>Car Color:</strong>{" "}
                              {selectedDriverSchedule.driverResponse.driverProfileId.carDetails.color}
                            </p>
                            <p>
                              <strong>Car Model:</strong>{" "}
                              {selectedDriverSchedule.driverResponse.driverProfileId.carDetails.model}
                            </p>
                            <p>
                              <strong>Car Product:</strong>{" "}
                              {selectedDriverSchedule.driverResponse.driverProfileId.carDetails.product}
                            </p>
                            <p>
                              <strong>Plate Number:</strong>{" "}
                              {selectedDriverSchedule.driverResponse.driverProfileId.carDetails.plateNumber}
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 flex justify-end">
                          <button
                            onClick={() => setDriverDetailsModal(false)}
                            className="px-4 py-2 bg-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-400 transition-colors duration-200"
                          >
                            Close
                          </button>
                        </div>
                      </div>
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

export default Dashboard;