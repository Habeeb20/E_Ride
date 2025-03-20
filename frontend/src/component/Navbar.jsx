import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "react-feather";

const Navbar = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const sidebarItems = [
    { id: "E_Ride", label: "E_Ride", icon: Menu },
    // { id: "dashboard", label: "Dashboard", icon: Menu },
    // { id: "settings", label: "Settings", icon: Menu },
    // { id: "logout", label: "Logout", icon: Menu },
  ];

  const handleNavigation = (id) => {
    setActiveTab(id);
    navigate(`/${id}`);
  };

  return (
    <div className="fixed top-0 left-0 w-full z-50 text-white" style={{ backgroundColor: "#BE24AA" }}>

      {/* Mobile Toggle Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-customPink text-white">
        <span className="text-lg font-semibold">E_Ride</span>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="focus:outline-none"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Navbar */}
      <nav
        className={`${
          sidebarOpen ? "block" : "hidden"
        } md:block bg-gray-100 text-gray-700 md:bg-transparent md:text-white`}
      >
        {/* Desktop: Horizontal, Mobile: Vertical Dropdown */}
        <div className="flex flex-col md:flex-row md:space-x-2 max-w-7xl mx-auto">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                handleNavigation(item.id);
                setSidebarOpen(false);
              }}
              className={`w-full md:w-auto flex items-center p-4 hover:text-white transition-colors duration-200 ${
                activeTab === item.id
                  ? "bg-purple-700 text-white shadow-inner"
                  : "text-white md:text-white"
              }`}
            >
              <item.icon size={20} className="mr-3" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;