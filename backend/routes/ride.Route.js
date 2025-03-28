import express from "express";
import Ride from "../models/trip/ride.js";
import Profile from "../models/auth/profileSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";

const ridesRouter = express.Router();

// Create a ride (passenger)
ridesRouter.post("/create", verifyToken, async (req, res) => {
    const passengerId = req.user.id;
  const {  pickupAddress, destinationAddress, distance, price, rideOption } = req.body;
  try {

    if (!pickupAddress || !destinationAddress  || !distance || !price || !rideOption ) {
        console.log('Missing required fields:', { pickupAddress, destinationAddress,  distance, price, rideOption,  });
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const passenger = await Profile.findOne({ userId: passengerId });
            if (!passenger || passenger.role !== 'passenger') {
              console.log('Passenger not found or invalid role:', passengerId, passenger?.role);
              return res.status(400).json({ error: 'Invalid passenger ID' });
            }
    const ride = new Ride({
      passenger: passengerId,
      pickupAddress,
      destinationAddress,
      distance,
      price,
      rideOption,
    });
    await ride.save();
    res.status(201).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to create ride" });
  }
});


ridesRouter.get("/nearby", verifyToken, async (req, res) => {
  const { driverId } = req.user.id; 
  try {
    const driver = await Profile.findOne({userId: driverId});
    const rides = await Ride.find({ status: "pending", driver: null })
      .populate("passenger", "firstName lastName location");
  
    const nearbyRides = rides.filter(ride => {
      const distance = calculateDistance(
        driver.location.latitude,
        driver.location.longitude,
        ride.passenger.location.latitude,
        ride.passenger.location.longitude
      );
      return distance <= 10; 
    });
    res.status(200).json(nearbyRides);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch nearby rides" });
  }
});

// Driver responds to ride
ridesRouter.post("/:rideId/respond", verifyToken, async (req, res) => {
  const { rideId } = req.params;
  const {driverId} = req.user.id
  const { status, offeredPrice } = req.body;
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "pending") return res.status(400).json({ error: "Ride not available" });

    ride.driverResponses.push({ driverId, status, offeredPrice });
    await ride.save();
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to respond to ride" });
  }
});

// Passenger views driver responses and accepts/rejects
ridesRouter.post("/:rideId/accept-driver", verifyToken, async (req, res) => {
  const { rideId } = req.params;
  const { driverId, accept } = req.body;
  try {
    const ride = await Ride.findById(rideId).populate("driverResponses.driverId", "firstName rating totalRides");
    if (!ride || ride.passengerAcceptedDriver) return res.status(400).json({ error: "Ride already assigned or invalid" });

    const response = ride.driverResponses.find(r => r.driverId.toString() === driverId);
    if (!response) return res.status(404).json({ error: "Driver response not found" });

    if (accept) {
      ride.passengerAcceptedDriver = driverId;
      ride.driver = driverId; 
      ride.status = "accepted";
    } else {
      response.status = "rejected";
    }
    await ride.save();
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to process driver acceptance" });
  }
});

// Update driver location and calculate ETA
ridesRouter.put("/:rideId/driver-location", async (req, res) => {
  const { rideId } = req.params;
  const { latitude, longitude } = req.body;
  try {
    const ride = await Ride.findById(rideId).populate("passenger", "location");
    if (!ride || ride.status !== "accepted") return res.status(400).json({ error: "Ride not in progress" });

    ride.driverLocation = { latitude, longitude, lastUpdated: new Date() };
    const eta = calculateETA(
      latitude,
      longitude,
      ride.passenger.location.latitude,
      ride.passenger.location.longitude
    );
    ride.etaToPickup = eta;
    await ride.save();
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to update driver location" });
  }
});

// Start ride (driver)
ridesRouter.put("/:rideId/start", verifyToken, async (req, res) => {
  const { rideId } = req.params;
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "accepted") return res.status(400).json({ error: "Ride not accepted" });

    ride.status = "in_progress";
    await ride.save();
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to start ride" });
  }
});

// Complete ride (driver or passenger)
ridesRouter.put("/:rideId/complete", verifyToken, async (req, res) => {
  const { rideId } = req.params;
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "in_progress") return res.status(400).json({ error: "Ride not in progress" });

    ride.status = "completed";
    await ride.save();
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to complete ride" });
  }
});

// Rate driver (passenger)
ridesRouter.post("/:rideId/rate", async (req, res) => {
  const { rideId } = req.params;
  const { rating, review } = req.body;
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "completed") return res.status(400).json({ error: "Ride not completed" });

    ride.rating = { passengerRating: rating, review };
    await ride.save();

    // Update driver's rating in Profile
    const driver = await Profile.findById(ride.driver);
    const newRating = (driver.rating * driver.totalRides + rating) / (driver.totalRides + 1);
    driver.rating = newRating;
    driver.totalRides += 1;
    await driver.save();

    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to rate driver" });
  }
});

// Chat message
ridesRouter.post("/:rideId/chat", async (req, res) => {
  const { rideId } = req.params;
  const { sender, text } = req.body;
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "accepted" && ride.status !== "in_progress") return res.status(400).json({ error: "Chat not available" });

    ride.chatMessages.push({ sender, text });
    await ride.save();
    res.status(200).json(ride);
  } catch (error) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

// Helper function to calculate distance (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Helper function to calculate ETA (simplified)
function calculateETA(lat1, lon1, lat2, lon2) {
  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  const speed = 40; // Assume 40 km/h average speed
  return Math.round((distance / speed) * 60); // ETA in minutes
}

export default router;