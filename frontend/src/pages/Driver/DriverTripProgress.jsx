import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import io from "socket.io-client";
import { toast } from "sonner";
import axios from "axios";

const socket = io(import.meta.env.VITE_BACKEND_URL);

const DriverTripProgress = () => {
  const [trip, setTrip] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tripData = location.state?.trip;
    if (!tripData) {
      toast.error("No trip data found");
      navigate("/driver-dashboard");
      return;
    }
    setTrip(tripData);

    const directionsService = new google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: tripData.pickup.lat, lng: tripData.pickup.lng },
        destination: { lat: tripData.destination.lat, lng: tripData.destination.lng },
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
        } else {
          toast.error("Failed to load route");
        }
      }
    );

    setMapCenter({ lat: tripData.pickup.lat, lng: tripData.pickup.lng });

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = { lat: position.coords.latitude, lng: position.coords.longitude };
        setDriverLocation(location);
        socket.emit("driverLocationUpdate", {
          driverId: localStorage.getItem("userId"),
          location,
        });
      },
      (err) => toast.error("Failed to get location"),
      { enableHighAccuracy: true }
    );

    socket.on("tripCompleted", () => {
      toast.success("Trip completed!");
      navigate("/driver-dashboard");
    });

    return () => {
      socket.off("tripCompleted");
      navigator.geolocation.clearWatch(watchId);
    };
  }, [location, navigate]);

  const handleCompleteTrip = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/trips/complete`,
        { tripId: trip._id },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Trip marked as completed!");
    } catch (error) {
      toast.error("Failed to complete trip");
    }
  };

  if (!trip) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">Trip Progress</h2>
      <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={{ height: "500px", width: "100%" }}
          center={mapCenter}
          zoom={12}
        >
          <Marker
            position={{ lat: trip.pickup.lat, lng: trip.pickup.lng }}
            label="P"
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
          />
          <Marker
            position={{ lat: trip.destination.lat, lng: trip.destination.lng }}
            label="D"
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
          />
          {driverLocation && (
            <Marker
              position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
              label="Me"
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
            />
          )}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </LoadScript>

      <div className="mt-4">
        <p>Pickup: {trip.pickup.address}</p>
        <p>Destination: {trip.destination.address}</p>
        <p>Fare: ₦{trip.clientProposedFare || trip.suggestedFare}</p>
        <p>Status: {trip.status}</p>
        <button
          onClick={handleCompleteTrip}
          className="mt-2 bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Complete Trip
        </button>
      </div>
    </div>
  );
};

export default DriverTripProgress;