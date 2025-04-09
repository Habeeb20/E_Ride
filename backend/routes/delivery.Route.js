import express from 'express';
import axios from 'axios';
import Delivery from '../models/delivery/delivery.js';
import Profile from '../models/auth/profileSchema.js';
import User from "../models/auth/authSchema.js"
import {verifyToken} from "../middleware/verifyToken.js"
import dotenv from "dotenv"

dotenv.config()

const router = express.Router();

router.post('/calculate-fare', async (req, res) => {
    const { pickupAddress, destinationAddress } = req.body;
    try {
        const apiKey = 'AIzaSyB58m9sAWsgdU4LjZO4ha9f8N11Px7aeps' 
        const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickupAddress)}&destinations=${encodeURIComponent(destinationAddress)}&units=metric&key=${apiKey}`;
    
        const response = await axios.get(url);
        const data = response.data;
        console.log('Google Maps API Response:', data);
    
        if (data.status !== 'OK') {
          return res.status(400).json({ status: false, message: `API Error: ${data.status}`, details: data.error_message || 'Unknown error' });
        }
    
        const element = data.rows[0]?.elements[0];
        if (!element || element.status !== 'OK') {
          return res.status(400).json({
            status: false,
            message: 'Unable to calculate distance',
            details: element?.status || 'No route data available',
          });
        }
    
        const distanceInMeters = element.distance.value;
        const distanceInKm = distanceInMeters / 1000;
    
        const baseFare = 500;
        const ratePerKm = 100;
        const fare = baseFare + distanceInKm * ratePerKm;


        console.log("results!!",    distanceInKm.toFixed(2),
          Math.round(fare), )
        return res.status(200).json({
          status: true,
          distance: distanceInKm.toFixed(2),
          price: Math.round(fare),
        });
      } catch (error) {
        console.error('Error calculating fare:', error.response?.data || error.message);
        return res.status(500).json({
          status: false,
          message: 'An error occurred while calculating fare',
          error: error.message,
        });
      }
  });
  





// Create a new delivery
router.post('/create', verifyToken, async (req, res) => {
  const passengerId = req.user.id;
  const { pickupAddress, destinationAddress, packageDescription, packagePicture, distance, price, passengerPrice, paymentMethod } = req.body;

  try {

    const user = await User.findOne({_id:passengerId})
    if(!user){
      return res.status(404).json({
        message: "user not found",
        status: false
      })
    }
    // Validate required fields
    if (!pickupAddress || !destinationAddress || !packageDescription || !distance || !price  || !paymentMethod) {
      console.log('Missing required fields:', { pickupAddress, destinationAddress, packageDescription, distance, price,  paymentMethod });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify the passenger exists
    const passenger = await Profile.findOne({ userId: passengerId });
    if (!passenger || passenger.role !== 'passenger') {
      console.log('Passenger not found or invalid role:', passengerId, passenger?.role);
      return res.status(400).json({ error: 'Invalid passenger ID' });
    }

    // Create the delivery without assigning a driver immediately (for broadcasting)
    const delivery = new Delivery({
      passenger: passengerId,
      passengerAuth:user._id,
      pickupAddress,
      destinationAddress,
      packageDescription,
      packagePicture,
      distance,
      price, // Calculated price
      passengerPrice: passengerPrice || price, // Passenger's desired price
   
      paymentMethod,
      status: 'pending',
    });

    await delivery.save();

    // Emit event to broadcast to drivers (assuming io is available globally or passed)
    global.io.emit('newDelivery', delivery);

    console.log('Delivery created successfully:', delivery);
    res.status(201).json(delivery);
  } catch (error) {
    console.error('Error creating delivery:', error.message);
    res.status(500).json({ error: 'Error creating delivery', details: error.message });
  }
});

// Fetch delivery offers for driver
router.get('/driver-offers/:driverId', verifyToken, async (req, res) => {
  const { driverId } = req.params;

  try {
   
    const available = await Delivery.find({
      status: { $in: ['pending', 'negotiating'] },
      driver: { $in: [null, undefined] },
    });

    // Assigned offers: deliveries where this driver is selected
    const assigned = await Delivery.find({
      driver: driverId,
      status: { $in: ['pending', 'accepted', 'in_progress', 'negotiating'] },
    }).populate("passengerAuth", "firstName lastName email ")
      .populate("driverAuth", "firstName lastName email ")
      .populate("driver", "profilePicture phoneNumber ")
      .populate("passenger", "profilePicture phoneNumber ")

    console.log('Assigned deliveries:', assigned);
    console.log('available deliveries', available)
    return res.status(200).json({
      available,
      assigned,
    });
  } catch (error) {
    console.error('Error fetching driver offers:', error);
    res.status(500).json({ error: 'Failed to fetch delivery offers' });
  }
});

// Update delivery status (Passenger side)
router.put('/:id/status', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    // Only allow certain status updates from passenger
    if (!['cancelled'].includes(status)) {
      return res.status(403).json({ error: 'Passenger can only cancel delivery' });
    }

    delivery.status = status;
    await delivery.save();

    if (delivery.driver) {
      global.io.to(delivery.driver.toString()).emit('rideCancelled', { deliveryId: id });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Error updating delivery status' });
  }
});

// Update delivery status for driver (including negotiation)
router.put('/:id/driverstatus', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { status, driverId, negotiatedPrice } = req.body;

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    if (status === 'accepted' && !delivery.driver) {
      delivery.driver = driverId;
      await Profile.updateOne({ _id: driverId }, { $set: { available: false } });
    } else if (status === 'negotiating' && !delivery.driver) {
      delivery.driverNegotiatedPrice = negotiatedPrice;
      delivery.status = 'negotiating';
      global.io.to(delivery.passenger.toString()).emit('driverNegotiation', { deliveryId: id, driverId, negotiatedPrice });
    } else if (status === 'in_progress' && delivery.driver.toString() === driverId) {
      delivery.status = 'in_progress';
      global.io.to(delivery.passenger.toString()).emit('rideStarted', { deliveryId: id });
    } else if (status === 'completed' && delivery.driver.toString() === driverId) {
      delivery.status = 'completed';
      await Profile.updateOne({ _id: driverId }, { $set: { available: true } });
    }

    await delivery.save();
    res.json(delivery);
  } catch (error) {
    console.error('Error updating driver status:', error);
    res.status(500).json({ error: 'Error updating delivery status' });
  }
});

// Add chat message
router.post('/:id/chat', async (req, res) => {
  const { id } = req.params;
  const { sender, text } = req.body;

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    delivery.chatMessages.push({ sender, text });
    await delivery.save();

    global.io.to(delivery.passenger.toString()).emit('newMessage', { senderId: sender, message: text });
    if (delivery.driver) {
      global.io.to(delivery.driver.toString()).emit('newMessage', { senderId: sender, message: text });
    }

    res.json(delivery);
  } catch (error) {
    console.error('Error adding chat message:', error);
    res.status(500).json({ error: 'Error adding chat message' });
  }
});

// Update driver location
router.put('/:id/location', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { lat, lng } = req.body;

  try {
    const delivery = await Delivery.findById(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    delivery.driverLocation = { lat, lng };
    await delivery.save();

    global.io.to(delivery.passenger.toString()).emit('driverLocationUpdate', { lat, lng });
    res.json(delivery);
  } catch (error) {
    console.error('Error updating driver location:', error);
    res.status(500).json({ error: 'Error updating driver location' });
  }
});

// Rate and review driver
router.post('/:id/rate', async (req, res) => {
  const { id } = req.params;
  const { rating, review } = req.body;

  try {
    const delivery = await Delivery.findById(id).populate('driver passenger');
    if (!delivery) {
      return res.status(404).json({ error: 'Delivery not found' });
    }

    const ratingDoc = new Rating({
      delivery: id,
      driver: delivery.driver._id,
      passenger: delivery.passenger._id,
      rating,
    });
    await ratingDoc.save();

    if (review) {
      const reviewDoc = new Review({
        delivery: id,
        driver: delivery.driver._id,
        passenger: delivery.passenger._id,
        review,
      });
      await reviewDoc.save();
    }

    res.status(201).json({ message: 'Rating and review submitted' });
  } catch (error) {
    console.error('Error submitting rating/review:', error);
    res.status(500).json({ error: 'Error submitting rating/review' });
  }
});

// Get deliveries for a passenger (ride history)
router.get('/passenger/:passengerId', async (req, res) => {
  const { passengerId } = req.params;

  try {
    const deliveries = await Delivery.find({ passenger: passengerId }).populate('driver');
    res.json(deliveries);
  } catch (error) {
    console.error('Error fetching deliveries:', error);
    res.status(500).json({ error: 'Error fetching deliveries' });
  }
});

// Get nearby drivers (simulated)
router.get('/nearby', async (req, res) => {
  try {
    const drivers = await Profile.find({ role: 'driver', available: true });
    res.json(drivers.map(driver => ({
      name: driver.name,
      distance: `${(Math.random() * 5).toFixed(1)} km away`, // Simulated distance
      _id: driver._id,
    })));
  } catch (error) {
    console.error('Error fetching nearby drivers:', error);
    res.status(500).json({ error: 'Error fetching nearby drivers' });
  }
});


export default router;















