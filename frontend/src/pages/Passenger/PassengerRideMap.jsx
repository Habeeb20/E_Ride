import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import socket from '../socket';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202179.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -20],
});

const pickupIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/0/614.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const destinationIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/0/619.png',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
  popupAnchor: [0, -15],
});

const PassengerRideMap = ({ rideId, passengerId, initialPickup, initialDestination, initialDistance, initialETA }) => {
  const [ride, setRide] = useState({
    rideId,
    pickupCoordinates: initialPickup,
    destinationCoordinates: initialDestination,
    status: 'accepted',
  });
  const [driverLocation, setDriverLocation] = useState(null);
  const [etaMinutes, setEtaMinutes] = useState(initialETA);
  const [distance, setDistance] = useState(initialDistance);
  const [rideStarted, setRideStarted] = useState(false);
  const [rideCancelled, setRideCancelled] = useState(false);
  const [timer, setTimer] = useState(0);
  const mapRef = useRef(null);

  useEffect(() => {
    socket.on('rideStarted', ({ rideId: emittedRideId, passengerId: emittedPassengerId }) => {
      if (emittedRideId === rideId && emittedPassengerId === passengerId) {
        setRideStarted(true);
      }
    });

    socket.on('rideCancelled', ({ rideId: emittedRideId, cancelledBy, passengerId: emittedPassengerId }) => {
      if (emittedRideId === rideId && emittedPassengerId === passengerId) {
        setRideCancelled(true);
        alert(`Ride cancelled by ${cancelledBy}`);
      }
    });

    socket.on('driverLocationUpdate', ({ location }) => {
      setDriverLocation(location);
      if (mapRef.current) {
        mapRef.current.setView([location.lat, location.lng], 15);
      }
    });

    return () => {
      socket.off('rideStarted');
      socket.off('rideCancelled');
      socket.off('driverLocationUpdate');
    };
  }, [rideId, passengerId]);

  useEffect(() => {
    let interval;
    if (rideStarted && !rideCancelled) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [rideStarted, rideCancelled]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleCancelRide = async () => {
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/eride/${ride.rideId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setRideCancelled(true);
    } catch (error) {
      console.error('Error cancelling ride:', error);
      alert('Failed to cancel ride');
    }
  };

  if (!ride) {
    return <div className="text-center py-10">Loading ride details...</div>;
  }

  if (rideCancelled) {
    return <div className="text-center py-10 text-red-600">Ride has been cancelled.</div>;
  }

  const center = [
    (ride.pickupCoordinates.lat + ride.destinationCoordinates.lat) / 2,
    (ride.pickupCoordinates.lng + ride.destinationCoordinates.lng) / 2,
  ];

  const path = [
    [ride.pickupCoordinates.lat, ride.pickupCoordinates.lng],
    [ride.destinationCoordinates.lat, ride.destinationCoordinates.lng],
  ];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Track Your Ride</h2>
      <div className="mb-4">
        <p><strong>Pickup:</strong> {ride.pickupCoordinates.lat}, {ride.pickupCoordinates.lng}</p>
        <p><strong>Destination:</strong> {ride.destinationCoordinates.lat}, {ride.destinationCoordinates.lng}</p>
        <p><strong>Distance:</strong> {distance ? distance.toFixed(2) : 'N/A'} km</p>
        <p><strong>ETA:</strong> {etaMinutes ? etaMinutes : 'N/A'} minutes</p>
        {rideStarted && (
          <p><strong>Elapsed Time:</strong> {formatTime(timer)}</p>
        )}
      </div>

      <MapContainer
        center={center}
        zoom={13}
        style={{ height: '400px', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[ride.pickupCoordinates.lat, ride.pickupCoordinates.lng]} icon={pickupIcon}>
          <Popup>Pickup Location</Popup>
        </Marker>
        <Marker position={[ride.destinationCoordinates.lat, ride.destinationCoordinates.lng]} icon={destinationIcon}>
          <Popup>Destination</Popup>
        </Marker>
        {driverLocation && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon}>
            <Popup>Driver's Current Location</Popup>
          </Marker>
        )}
        <Polyline positions={path} color="blue" />
      </MapContainer>

      <div className="mt-4">
        <button
          onClick={handleCancelRide}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
          disabled={rideCancelled}
        >
          Cancel Ride
        </button>
      </div>
    </div>
  );
};

export default PassengerRideMap;