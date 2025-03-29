import express from "express";
import Ride from "../models/trip/ride.js";
import Profile from "../models/auth/profileSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";

const ridesRouter = express.Router();

// Pass Socket.IO instance to the router
export default function ridesRouterWithIO(io) {
  // Create a ride (passenger)
  ridesRouter.post("/create", verifyToken, async (req, res) => {
    const passengerId = req.user.id; // Assuming verifyToken sets req.user.id
    const { pickupAddress, destinationAddress, pickupLatLng, destinationLatLng, distance, price, rideOption } = req.body;
    try {
      if (!pickupAddress || !destinationAddress || !pickupLatLng || !destinationLatLng || !distance || !price || !rideOption) {
        console.log("Missing required fields:", { pickupAddress, destinationAddress, pickupLatLng, destinationLatLng, distance, price, rideOption });
        return res.status(400).json({ error: "Missing required fields" });
      }

      const passenger = await Profile.findOne({ userId: passengerId });
      if (!passenger || passenger.role !== "passenger") {
        console.log("Passenger not found or invalid role:", passengerId, passenger?.role);
        return res.status(400).json({ error: "Invalid passenger ID" });
      }

      const ride = new Ride({
        passenger: passengerId,
        pickupAddress,
        destinationAddress,
        pickupLatLng,
        destinationLatLng,
        distance,
        price,
        rideOption,
      });
      await ride.save();

      // Notify nearby drivers
      const nearbyDrivers = await Profile.find({ role: "driver" }); // Simplified; add geospatial query later
      nearbyDrivers.forEach((driver) =>
        io.to(driver._id.toString()).emit("newRideRequest", ride)
      );

      res.status(201).json(ride);
    } catch (error) {
      console.error("Error creating ride:", error);
      res.status(500).json({ error: "Failed to create ride" });
    }
  });

  // Fetch nearby rides (driver)
  ridesRouter.get("/nearby", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    try {
      const driver = await Profile.findOne({ userId: driverId });
      if (!driver || driver.role !== "driver") return res.status(400).json({ error: "Invalid driver" });

      const rides = await Ride.find({ status: "pending", driver: null }).populate(
        "passenger",
        "firstName lastName location"
      );

      const nearbyRides = rides.filter((ride) => {
        const distance = calculateDistance(
          driver.location.lat,
          driver.location.lng,
          ride.pickupLatLng.lat,
          ride.pickupLatLng.lng
        );
        return distance <= 10; // 10 km radius
      });

      res.status(200).json(nearbyRides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby rides" });
    }
  });

  // Driver responds to ride
  ridesRouter.post("/:rideId/respond", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { offeredPrice, action } = req.body; // action: "accept" or "reject"
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.status !== "pending") return res.status(404).json({ error: "Ride not available" });

      const driver = await Profile.findOne({ userId: driverId });
      if (!driver || driver.role !== "driver") return res.status(400).json({ error: "Invalid driver" });

      const response = {
        driver: driverId,
        offeredPrice: offeredPrice || ride.price,
        status: action === "accept" ? "pending" : "rejected",
      };

      ride.driverOffers.push(response);
      await ride.save();

      // Notify passenger
      io.to(ride.passenger.toString()).emit("driverResponse", { rideId, response });

      res.status(200).json({ message: `${action}ed ride` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Passenger accepts/rejects driver offer
  ridesRouter.post("/:rideId/accept-driver", verifyToken, async (req, res) => {
    const passengerId = req.user.id;
    const { driverId, action } = req.body; // action: "accept" or "decline"
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId).populate("driverOffers.driver");
      if (!ride || ride.passenger.toString() !== passengerId || ride.status !== "pending") {
        return res.status(400).json({ error: "Invalid ride or passenger" });
      }

      const offer = ride.driverOffers.find((r) => r.driver._id.toString() === driverId);
      if (!offer) return res.status(404).json({ error: "Driver offer not found" });

      if (action === "accept") {
        if (ride.driver) return res.status(400).json({ error: "Driver already assigned" });
        ride.driver = driverId;
        ride.status = "accepted";
        offer.status = "accepted";
        ride.driverOffers
          .filter((r) => r.driver.toString() !== driverId)
          .forEach((r) => (r.status = "rejected"));
      } else {
        offer.status = "rejected";
      }

      await ride.save();

      // Notify driver
      io.to(driverId).emit("passengerDecision", { rideId, status: action });
      // Notify other drivers
      ride.driverOffers
        .filter((r) => r.driver.toString() !== driverId)
        .forEach((r) => io.to(r.driver.toString()).emit("rideTaken", { rideId }));

      res.status(200).json({ message: `${action}ed driver` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update driver location and calculate ETA
  ridesRouter.put("/:rideId/driver-location", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { lat, lng } = req.body;
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.driver.toString() !== driverId || ride.status !== "in_progress") {
        return res.status(400).json({ error: "Invalid ride or driver" });
      }

      ride.driverLocation = { lat, lng };
      const distanceKm = calculateDistance(
        lat,
        lng,
        ride.pickupLatLng.lat,
        ride.pickupLatLng.lng
      );
      const etaMin = calculateETA(lat, lng, ride.pickupLatLng.lat, ride.pickupLatLng.lng);
      ride.eta = etaMin;

      await ride.save();

      io.to(rideId).emit("driverLocationUpdate", { lat, lng, eta: ride.eta });
      res.status(200).json({ distance: distanceKm, eta: ride.eta });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start ride (driver)
  ridesRouter.put("/:rideId/start", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.driver.toString() !== driverId || ride.status !== "accepted") {
        return res.status(400).json({ error: "Ride not accepted or invalid driver" });
      }

      ride.status = "in_progress";
      await ride.save();

      io.to(rideId).emit("rideStarted", ride);
      res.status(200).json(ride);
    } catch (error) {
      res.status(500).json({ error: "Failed to start ride" });
    }
  });

  // Complete ride (driver or passenger)
  ridesRouter.put("/:rideId/complete", verifyToken, async (req, res) => {
    const userId = req.user.id;
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.status !== "in_progress") return res.status(400).json({ error: "Ride not in progress" });
      if (ride.passenger.toString() !== userId && ride.driver.toString() !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      ride.status = "completed";
      await ride.save();

      io.to(rideId).emit("rideCompleted", ride);
      res.status(200).json(ride);
    } catch (error) {
      res.status(500).json({ error: "Failed to complete ride" });
    }
  });

  // Rate driver (passenger)
  ridesRouter.post("/:rideId/rate", verifyToken, async (req, res) => {
    const passengerId = req.user.id;
    const { rideId } = req.params; // Fixed: Correctly access rideId
    const { rating } = req.body;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.passenger.toString() !== passengerId || ride.status !== "completed") {
        return res.status(400).json({ error: "Invalid ride or passenger" });
      }

      const driver = await Profile.findById(ride.driver);
      driver.ratings = driver.ratings || [];
      driver.ratings.push(rating);
      driver.ratingAverage = driver.ratings.reduce((a, b) => a + b, 0) / driver.ratings.length;
      driver.rideCount = (driver.rideCount || 0) + 1;
      await driver.save();

      res.status(200).json({ message: "Driver rated" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Chat message
  ridesRouter.post("/:rideId/chat", verifyToken, async (req, res) => {
    const { rideId } = req.params;
    const { sender, text } = req.body;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || (ride.status !== "accepted" && ride.status !== "in_progress")) {
        return res.status(400).json({ error: "Chat not available" });
      }
      if (ride.passenger.toString() !== sender && ride.driver.toString() !== sender) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const message = { sender, text, timestamp: new Date() };
      ride.chatMessages.push(message);
      await ride.save();

      io.to(rideId).emit("newMessage", message);
      res.status(200).json(message);
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
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  // Helper function to calculate ETA
  function calculateETA(lat1, lon1, lat2, lon2) {
    const distance = calculateDistance(lat1, lon1, lat2, lon2);
    const speed = 40; // Assume 40 km/h average speed
    return Math.round((distance / speed) * 60); // ETA in minutes
  }

  return ridesRouter;
}