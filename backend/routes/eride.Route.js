import express from "express";
import Ride from "../models/ride/ride.Schema.js";
import Profile from "../models/auth/profileSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";
import  User from "../models/auth/authSchema.js"
import axios from "axios"
const erideRouter = express.Router()




async function geocodeAddress(address) {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
      { headers: { 'User-Agent': 'e_RideProject/1.0' } } // Add User-Agent to comply with Nominatim policy
    );
    const data = response.data[0];
    return { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
  } catch (error) {
    console.error('Geocoding error:', error);
    return { lat: 0, lng: 0 }; // Fallback
  }
}

export default function ridesRouterWithIO(io) {

  erideRouter.post("/create", verifyToken, async (req, res) => {
    const passengerId = req.user.id; 
    const {
      pickupAddress,
      destinationAddress,
  
      distance,
      calculatedPrice,
      desiredPrice,
      rideOption,
      paymentMethod,
    } = req.body;

    try {
      if (
        !pickupAddress ||
        !destinationAddress ||
        !distance ||
        !calculatedPrice ||
        !rideOption ||
        !paymentMethod
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const passenger = await Profile.findOne({userId:passengerId});
      if (!passenger || passenger.role !== "passenger") {
        return res.status(400).json({ error: "Invalid passenger" });
      }

      const ride = new Ride({
        passenger: passengerId,
        pickupAddress,
        destinationAddress,
        distance,
        calculatedPrice,
        desiredPrice: desiredPrice || calculatedPrice, 
        rideOption,
        paymentMethod,
      });
      await ride.save();

    
      const nearbyDrivers = await Profile.find({ role: "driver" }); 
      nearbyDrivers.forEach((driver) =>
        io.to(driver._id.toString()).emit("newRideRequest", {
          rideId: ride._id,
          pickupAddress,
          destinationAddress,
          distance,
          calculatedPrice,
          desiredPrice,
        })
      );

      res.status(201).json(ride);
    } catch (error) {
      console.error("Error creating ride:", error);
      res.status(500).json({ error: "Failed to create ride" });
    }
  });



  ////fetch available ride request
  erideRouter.get("/available", verifyToken, async (req, res) => {
    try {
      const rides = await Ride.find({ status: 'pending', driver: null })
        .populate({
          path: 'passenger', 
          select: 'userId profilePicture',
          populate: ({
            path: 'userId', 
            model: 'Auth',
            select: 'firstName lastName email phoneNumber'
          })
        })
        .select('-__v');
  
      if (!rides.length) {
        return res.status(200).json([]);
      }
  
      console.log("your rides!!!", rides);
      res.status(200).json(rides);
    } catch (error) {
      console.error('Error fetching available rides:', error);
      res.status(500).json({ error: 'Server error while fetching rides' });
    }
  });
  
  // Fetch nearby rides (Driver)
  erideRouter.get("/nearby", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    try {
      const driver = await Profile.findById(driverId);
      if (!driver || driver.role !== "driver") {
        return res.status(400).json({ error: "Invalid driver" });
      }

      const rides = await Ride.find({ status: "pending", driver: null }).populate(
        "passenger",
        "firstName lastName rating rideCount"
      );

      const nearbyRides = rides.filter((ride) => {
        const distance = calculateDistance(
          driver.location.lat,
          driver.location.lng,
          ride.pickupLatLng.lat,
          ride.pickupLatLng.lng
        );
        return distance <= 10; 
      });

      res.status(200).json(nearbyRides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch nearby rides" });
    }
  });

  // Driver responds to ride (accept or negotiate)
  erideRouter.post("/:rideId/offer", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { rideId } = req.params;
    const { offeredPrice } = req.body; 

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.status !== "pending") {
        return res.status(400).json({ error: "Ride not available" });
      }

      const driver = await Profile.findById(driverId);
      if (!driver || driver.role !== "driver") {
        return res.status(400).json({ error: "Invalid driver" });
      }

      ride.driverOffers.push({
        driver: driverId,
        offeredPrice,
        status: "pending",
      });
      await ride.save();

      io.to(ride.passenger.toString()).emit("driverOffer", {
        rideId,
        driver: { id: driverId, firstName: driver.firstName, lastName: driver.lastName, rating: driver.rating, rideCount: driver.rideCount },
        offeredPrice,
      });

      res.status(200).json({ message: "Offer submitted" });
    } catch (error) {
      res.status(500).json({ error: "Failed to submit offer" });
    }
  });

  erideRouter.post("/:rideId/accept-driver", verifyToken, async (req, res) => {
    const passengerId = req.user.id;
    const { rideId } = req.params;
    const { driverId } = req.body;

    try {
      const ride = await Ride.findById(rideId).populate("driverOffers.driver");
      if (!ride || ride.passenger.toString() !== passengerId || ride.status !== "pending") {
        return res.status(400).json({ error: "Invalid ride or passenger" });
      }

      const offer = ride.driverOffers.find((o) => o.driver._id.toString() === driverId);
      if (!offer) return res.status(404).json({ error: "Driver offer not found" });

      if (ride.driver) return res.status(400).json({ error: "Driver already assigned" });

      ride.driver = driverId;
      ride.status = "accepted";
      ride.finalPrice = offer.offeredPrice;
      offer.status = "accepted";
      ride.driverOffers
        .filter((o) => o.driver.toString() !== driverId)
        .forEach((o) => (o.status = "rejected"));

      await ride.save();

      io.to(driverId).emit("rideAccepted", { rideId, passengerId });
      ride.driverOffers
        .filter((o) => o.driver.toString() !== driverId)
        .forEach((o) => io.to(o.driver.toString()).emit("rideTaken", { rideId }));

      res.status(200).json({ message: "Driver accepted", finalPrice: ride.finalPrice });
    } catch (error) {
      res.status(500).json({ error: "Failed to accept driver" });
    }
  });

  erideRouter.put("/:rideId/start", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.driver.toString() !== driverId || ride.status !== "accepted") {
        return res.status(400).json({ error: "Invalid ride or driver" });
      }

      ride.status = "in_progress";
      ride.rideStartTime = new Date();
      await ride.save();

      io.to(rideId).emit("rideStarted", { rideId });
      res.status(200).json({ message: "Ride started" });
    } catch (error) {
      res.status(500).json({ error: "Failed to start ride" });
    }
  });


  ///accept and reject ride

  erideRouter.put('/:rideId/accept', verifyToken, async (req, res) => {
    const { rideId } = req.params;
  
    try {
     
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }
  
    
      if (ride.status !== 'pending' || ride.driver) {
        return res.status(400).json({ error: 'Ride is no longer available for acceptance' });
      }

      ride.status = 'accepted';
      ride.driver = req.user.id;
      await ride.save();
  
      res.status(200).json({ message: 'Ride accepted successfully', ride });
    } catch (error) {
      console.log(error)
      console.error('Error accepting ride:', error);
      res.status(500).json({ error: 'Server error while accepting ride' });
    }
  });
  
  // Reject a ride
  erideRouter.put('/:rideId/reject', verifyToken, async (req, res) => {
    const { rideId } = req.params;
  
    try {
    
      const ride = await Ride.findById(rideId);
      if (!ride) {
        return res.status(404).json({ error: 'Ride not found' });
      }
  
  
      if (ride.status !== 'pending' || ride.driver) {
        return res.status(400).json({ error: 'Ride is no longer available for rejection' });
      }
  
      // Update ride status
      ride.status = 'rejected';
      await ride.save();
  
      res.status(200).json({ message: 'Ride rejected successfully', ride });
    } catch (error) {
      console.log(error)
      console.error('Error rejecting ride:', error);
      res.status(500).json({ error: 'Server error while rejecting ride' });
    }
  });


  erideRouter.put("/:rideId/negotiate", verifyToken, async(req, res) => {
    try {
      const { driverPrice } = req.body;
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      if (ride.status !== 'pending') return res.status(400).json({ error: 'Ride is not available' });
      if (ride.negotiationStatus === 'pending') return res.status(400).json({ error: 'Negotiation already in progress' });
  
      ride.negotiationStatus = 'pending';
      ride.driverProposedPrice = driverPrice;
      ride.driver = req.user._id;
      ride.interestedDrivers = ride.interestedDrivers || [];
      if (!ride.interestedDrivers.includes(req.user._id)) {
        ride.interestedDrivers.push(req.user._id);
      }
      await ride.save();
  
      res.json({ message: 'Negotiation offer sent', ride });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }
);


erideRouter.get("/my-ride-drivers", verifyToken, async (req, res) => {
  try {
  const userId = req.user.id

  const user = await Profile.findOne({userId})
  if(!user){
    return res.status(404).json({
      status:false,
      message:"you are not authorized"
    })
  }

  const profileId = user._id
    const rides = await Ride.find({ passenger: profileId }) 
      .populate({
        path: 'driver',
        model: 'Profile', 
        populate: {
          path: 'userId',
          model: 'Auth',
          select: 'firstName lastName email phoneNumber',
        },
      })
    
      .select('-__v');

    if (!rides.length) {
      return res.status(200).json({ message: "No rides found for this passenger", data: [] });
    }

    const results = rides.map(ride => {
      const allInterestedDrivers = ride.interestedDrivers.map(driver => ({
        fullName: `${driver.userId.firstName} ${driver.userId.lastName}`,
        email: driver.userId.email,
        phoneNumber: driver.userId.phoneNumber,
        proposedPrice: ride.driverProposedPrice || null,
        status: ride.status === "accepted" && ride.driver?.id === driver.id ? "Accepted" : "Negotiated",
      }));

      return {
        rideId: ride._id,
        desiredPrice: ride.desiredPrice,
        negotiationStatus: ride.negotiationStatus,
        status: ride.status,
        acceptedDriver: ride.driver
          ? {
              fullName: `${ride.driver.userId.firstName} ${ride.driver.userId.lastName}`,
              email: ride.driver.userId.email,
              phoneNumber: ride.driver.userId.phoneNumber,
              status: "Accepted",
              proposedPrice: ride.driverProposedPrice || null,
            }
          : null,
        interestedDrivers: allInterestedDrivers,
      };
    });
    console.log("mu results!!!!",results)
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching ride drivers:", error);
    res.status(500).json({ error: "Server error while fetching ride drivers" });
  }
});


  erideRouter.put("/:rideId/complete", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { rideId } = req.params;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.driver.toString() !== driverId || ride.status !== "in_progress") {
        return res.status(400).json({ error: "Invalid ride or driver" });
      }

      ride.status = "completed";
      ride.rideEndTime = new Date();
      ride.rideDuration = Math.round((ride.rideEndTime - ride.rideStartTime) / 60000); // Duration in minutes
      await ride.save();

      io.to(rideId).emit("rideCompleted", { rideId, rideDuration: ride.rideDuration });
      res.status(200).json({ message: "Ride completed", rideDuration: ride.rideDuration });
    } catch (error) {
      res.status(500).json({ error: "Failed to complete ride" });
    }
  });


  erideRouter.post("/:rideId/rate", verifyToken, async (req, res) => {
    const passengerId = req.user.id;
    const { rideId } = req.params;
    const { rating, review } = req.body;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || ride.passenger.toString() !== passengerId || ride.status !== "completed") {
        return res.status(400).json({ error: "Invalid ride or passenger" });
      }

      ride.rating = rating;
      ride.review = review;
      await ride.save();

      const driver = await Profile.findById(ride.driver);
      driver.rating = ((driver.rating || 0) * (driver.rideCount || 0) + rating) / (driver.rideCount + 1);
      driver.rideCount = (driver.rideCount || 0) + 1;
      await driver.save();

      res.status(200).json({ message: "Driver rated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to rate driver" });
    }
  });


  erideRouter.post("/:rideId/chat", verifyToken, async (req, res) => {
    const { rideId } = req.params;
    const { text } = req.body;
    const senderId = req.user.id;

    try {
      const ride = await Ride.findById(rideId);
      if (!ride || (ride.status !== "accepted" && ride.status !== "in_progress")) {
        return res.status(400).json({ error: "Chat not available" });
      }
      if (ride.passenger.toString() !== senderId && ride.driver.toString() !== senderId) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const message = { sender: senderId, text, timestamp: new Date() };
      ride.chatMessages.push(message);
      await ride.save();

      io.to(rideId).emit("newMessage", message);
      res.status(200).json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });


  erideRouter.get("/history", verifyToken, async (req, res) => {
    const userId = req.user.id;
    try {
      const rides = await Ride.find({
        $or: [{ passenger: userId }, { driver: userId }],
      })
        .populate("passenger", "firstName")
        .populate("driver", "firstName rating rideCount");

      res.status(200).json(rides);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ride history" });
    }
  });










erideRouter.get('/:rideId/interested-drivers', verifyToken, async (req, res) => {
  const userId = req.user.id
  try {
    const ride = await Ride.findById(req.params.rideId).populate('driver');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    if (ride.passenger?.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let pickupCoords = ride.pickupCoordinates;
    if (!pickupCoords || (!pickupCoords.lat && !pickupCoords.lng)) {
      pickupCoords = await geocodeAddress(ride.pickupAddress);
      ride.pickupCoordinates = pickupCoords;
      await ride.save(); 
    }

    const interestedDrivers = await Profile.find({
      _id: { $in: ride.interestedDrivers || [ride.driver] },
      role: 'driver',
    });

    const driverDetails = interestedDrivers.map(driver => {
      const distance = calculateDistance(
        driver.location?.lat || 0,
        driver.location?.lng || 0,
        pickupCoords.lat || 0,
        pickupCoords.lng || 0
      );
      return {
        _id: driver._id,
        firstName: driver.firstName,
        carDetails: driver.carDetails,
        distance: distance.toFixed(2) + ' km',
        driverProposedPrice: ride.negotiationStatus === 'pending' && ride.driver?.toString() === driver._id.toString() ? ride.driverProposedPrice : null,
      };
    });

    res.json(driverDetails);
  } catch (error) {
    console.error('Error fetching interested drivers:', error);
    res.status(500).json({ error: 'Server error while fetching interested drivers' });
  }
});











  erideRouter.put('/:rideId/accept-driver', verifyToken, async (req, res) => {
    try {
      const { driverId } = req.body;
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      if (ride.passenger.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (ride.status !== 'pending') return res.status(400).json({ error: 'Ride is not available' });
  
      const driver = await Profile.findOne({ _id: driverId, role: 'driver' });
      if (!driver) return res.status(404).json({ error: 'Driver not found or not a driver profile' });
  
      ride.status = 'accepted';
      ride.driver = driverId;
      ride.negotiationStatus = 'accepted';
    
      await ride.save();
  
      res.json({ message: 'Driver accepted', ride, driver });
    } catch (error) {
      console.error('Error accepting driver:', error);
      res.status(500).json({ error: 'Server error while accepting driver' });
    }
  });


  erideRouter.put('/:rideId/cancel', verifyToken, async (req, res) => {
    try {
      const ride = await Ride.findById(req.params.rideId);
      if (!ride) return res.status(404).json({ error: 'Ride not found' });
      if (ride.passenger.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      if (ride.status === 'completed') return res.status(400).json({ error: 'Cannot cancel completed ride' });
  
      ride.status = 'cancelled';
      ride.driver = null;
      ride.negotiationStatus = 'none';
      ride.driverProposedPrice = null;
      ride.interestedDrivers = [];
      await ride.save();
  
      res.json({ message: 'Ride cancelled successfully', ride });
    } catch (error) {
      console.error('Error cancelling ride:', error);
      res.status(500).json({ error: 'Server error while cancelling ride' });
    }
  });



  // Helper: Calculate distance (Haversine formula)
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  return erideRouter ;
}

