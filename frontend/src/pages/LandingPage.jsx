import  { useState, useEffect, useRef,  } from "react";
import { FaCar } from "react-icons/fa";
import { Button } from "@mui/material";
import im from "../assets/pic.jpg";

const LandingPage = () => {
  const [carPositions, setCarPositions] = useState([
    { lat: 37.7749, lng: -122.4194 }, // Initial positions (will be converted to pixels)
    { lat: 37.7750, lng: -122.4184 },
    { lat: 37.7748, lng: -122.4204 },
  ]);
  const animationRef = useRef();

  // Simulate moving cars
  useEffect(() => {
    console.log("Starting car movement animation...");
    animationRef.current = setInterval(() => {
      setCarPositions(prevPositions => {
        const newPositions = prevPositions.map(pos => {
          // Simple random movement within reasonable bounds
          let newLat = pos.lat + (Math.random() - 0.5) * 0.001;
          let newLng = pos.lng + (Math.random() - 0.5) * 0.001;
          
          // Keep within reasonable bounds (adjusted for pixel conversion later)
          newLat = Math.max(37.77, Math.min(37.78, newLat));
          newLng = Math.max(-122.42, Math.min(-122.41, newLng));
          
          return { lat: newLat, lng: newLng };
        });
        console.log("Updated car positions:", newPositions);
        return newPositions;
      });
    }, 2000);

    return () => {
      console.log("Cleaning up car movement animation...");
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  // Convert lat/lng to approximate pixel positions (simplified)
  const getPixelPosition = (position) => {
    const scale = 10000; // Adjust this scale factor based on your image size
    const x = (position.lng + 122.42) * scale; // Normalize lng relative to min bound
    const y = (37.78 - position.lat) * scale; // Normalize lat and invert for top-down
    return { x: Math.min(Math.max(x, 0), window.innerWidth * 0.8), y: Math.min(Math.max(y, 0), window.innerHeight * 0.8) };
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-cover bg-center"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${im})` // Darken with overlay
      }}
    >
      {/* Moving Car Icons */}
      {carPositions.map((position, index) => {
        const { x, y } = getPixelPosition(position);
        return (
          <div
            key={index}
            className="absolute transition-all duration-2000 ease-in-out"
            style={{
              left: `${x}px`,
              top: `${y}px`,
              transform: 'translate(-50%, -50%)', // Center the icon
            }}
          >
            <FaCar size={40} className="text-yellow-500 animate-bounce" />
          </div>
        );
      })}

      <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-gradient-to-t from-black/60 to-transparent">
        <div className="absolute top-4 left-4 bg-e-ride-green/20 p-4 rounded-full">
          <FaCar size={48} className="text-yellow-500 animate-bounce" />
        </div>

        <div className="text-center max-w-xl px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-lg">
            Ride Green, Ride Smart
          </h1>
          <p className="text-lg md:text-xl mb-8 text-gray-200 drop-shadow-md">
            Book eco-friendly rides with seamless navigation, secure bookings, and real-time tracking. Join the future of transportation today!
          </p>

          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
            <Button
              variant="contained"
              size="large"
              className="rounded-full px-8 py-3 text-lg font-medium shadow-lg"
              style={{ 
                backgroundColor: "#BDCE22FF",
                color: "white" // White text for Sign Up
              }}
              href="/onboarding1"
            >
              Sign Up
            </Button>
            <Button
              variant="outlined"
              size="large"
              className="rounded-full px-8 py-3 text-lg font-medium shadow-lg"
              style={{ 
                borderColor: "#BDCE22FF",
                color: "white", // White text for Login
                backgroundColor: "transparent"
              }}
              sx={{
                '&:hover': {
                  backgroundColor: "#BDCE22FF",
                  color: "white",
                  borderColor: "#BDCE22FF"
                }
              }}
              href="/login"
            >
              Login
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 text-sm text-gray-200">
        © 2025 E-Ride. All rights reserved.
      </div>
    </div>
  );
};

// Add Tailwind animations
const styles = `
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  @keyframes pulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.05); opacity: 0.8; }
    100% { transform: scale(1); opacity: 1; }
  }

  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  .animate-pulse {
    animation: pulse 2s infinite ease-in-out;
  }

  .animate-bounce {
    animation: bounce 2s infinite ease-in-out;
  }
`;

export default LandingPage;