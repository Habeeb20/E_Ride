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
        const apiKey = 'AIzaSyB58m9sAWsgdU4LjZO4ha9f8N11Px7aeps' // Use .env file
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
  
  // Create a delivery
  router.post('/create', async (req, res) => {
    const { passengerId, pickupAddress, destinationAddress, packageDescription, packagePicture, distance, price, rideOption, paymentMethod } = req.body;
  
    try {
      // Find an available driver
      const driver = await Profile.findOne({ role: 'driver', available: true });
      if (!driver) {
        return res.status(400).json({ error: 'No available drivers' });
      }
  
      const delivery = new Delivery({
        passenger: passengerId,
        driver: driver._id,
        pickupAddress,
        destinationAddress,
        packageDescription,
        packagePicture,
        distance,
        price,
        rideOption,
        paymentMethod,
      });
  
      await delivery.save();
  
      // Update driver availability
      driver.available = false;
      await driver.save();
  
      res.status(201).json(delivery);
    } catch (error) {
      res.status(500).json({ error: 'Error creating delivery' });
    }
  });
  
  // Update delivery status
  router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
  
    try {
      const delivery = await Delivery.findById(id);
      if (!delivery) {
        return res.status(404).json({ error: 'Delivery not found' });
      }
  
      delivery.status = status;
      await delivery.save();
  
      if (status === 'completed') {
        const driver = await Profile.findById(delivery.driver);
        driver.available = true;
        await driver.save();
      }
  
      res.json(delivery);
    } catch (error) {
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
  
      res.json(delivery);
    } catch (error) {
      res.status(500).json({ error: 'Error adding chat message' });
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
      res.status(500).json({ error: 'Error submitting rating/review' });
    }
  });
  
  // Get deliveries for a passenger (for ride history)
  router.get('/passenger/:passengerId', async (req, res) => {
    const { passengerId } = req.params;
  
    try {
      const deliveries = await Delivery.find({ passenger: passengerId });
      res.json(deliveries);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching deliveries' });
    }
  });


  router.get('/nearby', async (req, res) => {
    try {
      const drivers = await Profile.find({ role: 'driver', available: true });
      res.json(drivers.map(driver => ({
        name: driver.name,
        distance: `${(Math.random() * 5).toFixed(1)} km away`, // Simulated distance
      })));
    } catch (error) {
      res.status(500).json({ error: 'Error fetching nearby drivers' });
    }
  });

export default router;