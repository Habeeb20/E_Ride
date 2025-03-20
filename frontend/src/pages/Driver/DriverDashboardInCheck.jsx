import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "sonner";

const socket = io(import.meta.env.VITE_BACKEND_URL);

const DriverDashboard = () => {
  const [trips, setTrips] = useState([]);
  const [offeredFare, setOfferedFare] = useState("");
  const [activeTrip, setActiveTrip] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const driverId = localStorage.getItem("userId");

    // Real-time location updates
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        socket.emit("driverLocationUpdate", { driverId, location });
      },
      (err) => toast.error("Failed to get location"),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    socket.emit("driverOnline", { driverId, location: { lat: 6.5244, lng: 3.3792 } }); // Initial location

    socket.on("tripRequest", (trip) => {
      setTrips((prev) => [...prev, trip]);
      toast.info("New trip request available!");
    });

    socket.on("offerAccepted", (trip) => {
      setActiveTrip(trip);
      toast.success("Your offer was accepted!");
      navigate("/trip-progress", { state: { trip } });
    });

    socket.on("tripCompleted", () => {
      setActiveTrip(null);
      toast.success("Trip completed!");
      navigate("/driver-dashboard");
    });

    return () => {
      socket.off("tripRequest");
      socket.off("offerAccepted");
      socket.off("tripCompleted");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [navigate]);

  const handleOffer = async (tripId) => {
    if (!offeredFare) {
      toast.error("Please enter an offer");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/trips/offer`,
        { tripId, offeredFare: parseFloat(offeredFare) },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Offer submitted!");
      setOfferedFare("");
    } catch (error) {
      toast.error("Failed to submit offer");
    }
  };

  const handleCompleteTrip = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/trips/complete`,
        { tripId: activeTrip._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Trip marked as completed!");
    } catch (error) {
      toast.error("Failed to complete trip");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Driver Dashboard</h2>
      {activeTrip ? (
        <div className="p-4 border rounded">
          <p>Pickup: {activeTrip.pickup.address}</p>
          <p>Destination: {activeTrip.destination.address}</p>
          <p>Fare: ₦{activeTrip.clientProposedFare}</p>
          <button
            onClick={handleCompleteTrip}
            className="mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            Complete Trip
          </button>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-2">Available Trips</h3>
          {trips.length === 0 ? (
            <p>No trips available</p>
          ) : (
            trips.map((trip) => (
              <div key={trip._id} className="p-4 border rounded mb-4">
                <p>Pickup: {trip.pickup.address}</p>
                <p>Destination: {trip.destination.address}</p>
                <p>Distance: {trip.distance} km</p>
                <p>Duration: {trip.duration} min</p>
                <p>Client Proposed: ₦{trip.clientProposedFare}</p>
                <p>Suggested Fare: ₦{trip.suggestedFare}</p>
                <input
                  type="number"
                  placeholder="Your offer"
                  value={offeredFare}
                  onChange={(e) => setOfferedFare(e.target.value)}
                  className="w-full p-2 border rounded mt-2"
                />
                <button
                  onClick={() => handleOffer(trip._id)}
                  className="mt-2 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                >
                  Submit Offer
                </button>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
};

export default DriverDashboard;