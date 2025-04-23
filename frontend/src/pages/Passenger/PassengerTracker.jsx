import React, { useEffect, useState } from 'react';
import PassengerRideMap from './PassengerRideMap';
import socket from '../socket';

const PassengerRideTracker = () => {
  const [rideDetails, setRideDetails] = useState(null);
  const passengerId = "your-passenger-id"; // Replace with actual passenger ID

  useEffect(() => {
    socket.on('rideConfirmed', ({ driver }) => {
      setRideDetails({
        rideId: driver.rideId,
        pickupCoordinates: driver.pickupCoordinates,
        destinationCoordinates: driver.destinationCoordinates,
        distance: driver.distance,
        etaMinutes: driver.etaMinutes,
      });
    });

    return () => {
      socket.off('rideConfirmed');
    };
  }, []);

  if (!rideDetails) {
    return <div className="text-center py-10">Waiting for driver confirmation...</div>;
  }

  return (
    <PassengerRideMap
      rideId={rideDetails.rideId}
      passengerId={passengerId}
      initialPickup={rideDetails.pickupCoordinates}
      initialDestination={rideDetails.destinationCoordinates}
      initialDistance={rideDetails.distance}
      initialETA={rideDetails.etaMinutes}
    />
  );
};

export default PassengerRideTracker;