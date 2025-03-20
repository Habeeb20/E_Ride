import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import axios from "axios";
import { toast } from "sonner";

const socket = io(import.meta.env.VITE_BACKEND_URL);

const DriverAction = () => {
  const [trips, setTrips] = useState([]);
  const [offeredFare, setOfferedFare] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        socket.emit("driverLocationUpdate", {
          driverId: localStorage.getItem("userId"),
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
        });
      },
      (err) => console.error(err),
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    // Driver goes online
    const driverId = localStorage.getItem("token"); // Assuming stored after login
    navigator.geolocation.getCurrentPosition(
      (position) => {
        socket.emit("driverOnline", {
          driverId,
          location: { lat: position.coords.latitude, lng: position.coords.longitude },
        });
      },
      () => toast.error("Failed to get location")
    );

    socket.on("tripRequest", (trip) => {
      setTrips((prev) => [...prev, trip]);
      toast.info("New trip request available!");
    });

    socket.on("offerAccepted", (trip) => {
      toast.success("Your offer was accepted!");
      navigate("/trip-progress"); // Redirect to trip tracking page
    });

    return () => {
      socket.off("tripRequest");
      socket.off("offerAccepted");
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

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Available Trips</h2>
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
    </div>
  );
};

export default DriverAction;