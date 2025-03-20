import React from "react";
import { FaMobileAlt, FaFileAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
const OnboardingScreen3 = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Icon Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative flex items-center justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <FaMobileAlt size={202} className="text-gray-800" /> 
          </div>
          <FaFileAlt size={54} className="absolute text-green-500 -right-2 -bottom-2" /> 
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          <span className="text-gray-300">•</span>
          <span className="text-gray-300">•</span>
          <span className="text-purple-500">•</span>
        </div>
      </div>

      {/* Text Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Enjoy Seamless Transition</h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Manage your rides effortlessly with our intuitive app. Track your trips, view receipts, and enjoy a paperless experience. Get started with eco-friendly travel now!
        </p>
      </div>

      {/* Buttons Section */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <Link to="/pregister">
      <button className="bg-white border border-purple-300 text-purple-600 hover:bg-purple-50 rounded-full px-6 py-2 text-sm sm:text-base">
          SKIP
        </button>

      </Link>
    <Link to="/pregister">
    <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2 text-sm sm:text-base">
          CONTINUE
        </button>

    </Link>
      </div>
    </div>
  );
};

export default OnboardingScreen3;