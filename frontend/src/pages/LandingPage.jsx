import { useState, useEffect, useRef } from "react";
import { FaCar } from "react-icons/fa";
import { Button } from "@mui/material";
import im from "../assets/pic.jpg";

const LandingPage = () => {
  const [carPositions, setCarPositions] = useState([
    { x: 50, y: 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Top-left
    { x: window.innerWidth - 50, y: 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Top-right
    { x: 50, y: window.innerHeight - 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Bottom-left
    { x: window.innerWidth - 50, y: window.innerHeight - 50, targetX: window.innerWidth / 2, targetY: window.innerHeight / 2 }, // Bottom-right
  ]);
  const animationRef = useRef();

  // Simulate moving cars toward the center and reset
  useEffect(() => {
    console.log("Starting car movement animation...");
    animationRef.current = setInterval(() => {
      setCarPositions(prevPositions => {
        const newPositions = prevPositions.map(pos => {
          // Move towards the center
          const dx = pos.targetX - pos.x;
          const dy = pos.targetY - pos.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const speed = 5; // Adjust speed of movement

          if (distance < speed) {
            // Reset to initial position if close to center
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

          // Move toward center
          const newX = pos.x + (dx / distance) * speed;
          const newY = pos.y + (dy / distance) * speed;

          return { ...pos, x: newX, y: newY };
        });
        console.log("Updated car positions:", newPositions);
        return newPositions;
      });
    }, 100); // Update every 100ms for smoother animation

    return () => {
      console.log("Cleaning up car movement animation...");
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden bg-cover bg-center"
      style={{ 
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${im})`
      }}
    >
      {/* Moving Car Icons */}
      {carPositions.map((position, index) => (
        <div
          key={index}
          className="absolute transition-all duration-100 ease-linear"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -50%)', // Center the icon
          }}
        >
          <FaCar size={40} className="text-yellow-500 animate-bounce" />
        </div>
      ))}

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
                color: "white"
              }}
              href="/onboarding1"
            >
              Sign Up
            </Button>
            <Button
              variant="outlined"
              size="large"
              className="rounded-full Iqpx-8 py-3 text-lg font-medium shadow-lg"
              style={{ 
                borderColor: "#BDCE22FF",
                color: "white",
                backgroundColor: "transparent"
              }}
              sx={{
                '&:hover': {
                  backgroundColor: "#BDCE22FF",
                  color: "white",
                  borderColor: "#BDCE22FF"
                }
              }}
              href="/plogin"
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