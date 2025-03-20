import React from "react";
import { FaMobileAlt, FaShieldAlt } from "react-icons/fa"; // Phone and shield icons
import { Link } from "react-router-dom";
const OnboardingScreen2 = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-4">
      {/* Icon Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative flex items-center justify-center">
          <div className="bg-green-100 p-4 rounded-full">
            <FaMobileAlt size={182} className="text-gray-800" /> {/* Phone icon */}
          </div>
          <FaShieldAlt size={84} className="absolute text-green-500 -right-2 -bottom-2" /> {/* Shield icon */}
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          <span className="text-gray-300">•</span>
          <span className="text-purple-500">•</span>
          <span className="text-gray-300">•</span>
        </div>
      </div>

      {/* Text Section */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Enjoy Seamless Transition</h1>
        <p className="text-gray-600 text-sm max-w-md mx-auto">
          Trust in our secure platform to book your rides safely. Your privacy and safety are our priority, protected by advanced encryption and verified drivers. Ride with confidence!
        </p>
      </div>
      {/* Buttons Section */}
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
      <Link to="/pregister">
      <button className="bg-white border border-purple-300 text-purple-600 hover:bg-purple-50 rounded-full px-6 py-2 text-sm sm:text-base">
          SKIP
        </button>

      </Link>
    <Link to="/onboarding3">
    <button className="bg-purple-600 hover:bg-purple-700 text-white rounded-full px-6 py-2 text-sm sm:text-base">
          CONTINUE
        </button>

    </Link>
      </div>
    </div>
  );
};

export default OnboardingScreen2;