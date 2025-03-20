import { Link } from "react-router-dom";
import React from "react";
import { FaCar, FaWifi, FaMapMarkerAlt } from "react-icons/fa"; // FontAwesome icons for car, Wi-Fi, location

const OnboardingScreen1 = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Icon Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center justify-center space-x-2 bg-green-100 p-4 rounded-full">
          <FaCar size={172} className="text-yellow-500" /> {/* Car icon */}
          <FaWifi size={64} className="text-purple-500" /> {/* Wi-Fi signals */}
          <FaMapMarkerAlt size={64} className="text-purple-500" /> {/* Location pin */}
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          <span className="text-purple-500">•</span>
          <span className="text-gray-300">•</span>
          <span className="text-gray-300">•</span>
        </div>
      </div>

      {/* Text Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Enjoy Seamless Transition</h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Experience smooth rides with our electric vehicles. Navigate effortlessly using real-time GPS and stay connected with our smart technology. Join the purple revolution today!
        </p>
      </div>

      {/* Buttons Section */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <Link to="/pregister">
      <button className="bg-white border border-purple-300 text-purple-600 hover:bg-purple-50 rounded-full px-6 py-2 text-sm sm:text-base">
          SKIP
        </button>

      </Link>
    <Link to="/onboarding2">
    <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2 text-sm sm:text-base">
          CONTINUE
        </button>

    </Link>
      
      </div>
    </div>
  );
};

export default OnboardingScreen1;