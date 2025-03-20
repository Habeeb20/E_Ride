import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from "@react-google-maps/api";
import io from "socket.io-client";
import { toast } from "sonner";
import axios from "axios";

const socket = io(import.meta.env.VITE_BACKEND_URL);

const TripProgress = () => {
  const [trip, setTrip] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [directions, setDirections] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 6.5244, lng: 3.3792 });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Assuming trip data is passed via state or fetched from API
    const tripData = location.state?.trip;
    if (!tripData) {
      toast.error("No trip data found");
      navigate("/client-dashboard"); // Redirect if no trip
      return;
    }
    setTrip(tripData);

    // Fetch directions
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

    // Set initial map center to pickup
    setMapCenter({ lat: tripData.pickup.lat, lng: tripData.pickup.lng });

    // Socket.IO listeners
    socket.emit("join", tripData.clientId.toString()); // Join client room

    socket.on("tripStarted", (updatedTrip) => {
      setTrip(updatedTrip);
      toast.success("Trip started!");
    });

    socket.on("driverLocation", ({ driverId, location }) => {
      setDriverLocation(location);
    });

    socket.on("tripCompleted", () => {
      toast.success("Trip completed!");
      navigate("/client-dashboard");
    });

    return () => {
      socket.off("tripStarted");
      socket.off("driverLocation");
      socket.off("tripCompleted");
    };
  }, [location, navigate]);

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
          {/* Pickup Marker */}
          <Marker
            position={{ lat: trip.pickup.lat, lng: trip.pickup.lng }}
            label="P"
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png" }}
          />

          {/* Destination Marker */}
          <Marker
            position={{ lat: trip.destination.lat, lng: trip.destination.lng }}
            label="D"
            icon={{ url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png" }}
          />

          {/* Driver Marker */}
          {driverLocation && (
            <Marker
              position={{ lat: driverLocation.lat, lng: driverLocation.lng }}
              label="Driver"
              icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }}
            />
          )}

          {/* Route Line */}
          {directions && <DirectionsRenderer directions={directions} />}
        </GoogleMap>
      </LoadScript>

      <div className="mt-4">
        <p>Pickup: {trip.pickup.address}</p>
        <p>Destination: {trip.destination.address}</p>
        <p>Fare: ₦{trip.clientProposedFare || trip.suggestedFare}</p>
        <p>Status: {trip.status}</p>
      </div>
    </div>
  );
};

export default TripProgress;