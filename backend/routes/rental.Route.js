import express from 'express';
import Ride from '../models/ride/ride.Schema.js';
import Profile from '../models/auth/profileSchema.js';
import { verifyToken } from '../middleware/verifyToken.js';
import User from '../models/auth/authSchema.js';
import axios from 'axios';
import Vehicle from '../models/ride/vehicle.Schema.js';
import Rental from '../models/ride/rental.Schema.js';




export default (io) => {
  const erideRouter = express.Router();

  const vehicleRoute = express.Router();

  async function geocodeAddress(address) {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`,
        { headers: { 'User-Agent': 'e_RideProject/1.0' } }
      );
      const data = response.data[0];
      return { lat: parseFloat(data.lat), lng: parseFloat(data.lon) };
    } catch (error) {
      console.error('Geocoding error:', error);
      return { lat: 0, lng: 0 };
    }
  }

  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Register Vehicle
  vehicleRoute.post('/vehicles', verifyToken, async (req, res) => {
    const { type, plateNumber, ownerOfVehicle, color, carPicture, displayPicture, carDocument } = req.body;
    const userId = req.user.id



    try {

        const profile = await Profile({userId})
        if(!profile){
            return res.status(400).json({
                message:"user not found",
                status: false
            })
        }
      if (!carPicture || !displayPicture || !carDocument) {
        return res.status(400).json({ error: 'All image URLs are required' });
      }

      const vehicle = new Vehicle({
        owner: req.user.id,
        ownerProfile: profile._id,
        type,
        plateNumber,
        carPicture, // URL from Cloudinary
        displayPicture, // URL from Cloudinary
        ownerOfVehicle,
        color,
        carDocument, // URL from Cloudinary
      });

      await vehicle.save();
      res.status(201).json(vehicle);
    } catch (error) {
        console.log(error)
      res.status(500).json({ error: error.message });
    }
  });

  // Get Available Vehicles
  vehicleRoute.get('/vehicles/available', verifyToken,  async (req, res) => {
    const userId = req.user.id
    try {

        const user = await Profile.findOne({userId})
        if(!user){
            return res.status(404).json({
                status:false,
                message: "user not found"
            })
        }


      const vehicles = await Vehicle.find({ available: true })
        .populate('owner', 'firstName lastName email')
        .populate('ownerProfile', 'phoneNumber profilePicture' )
        console.log(vehicles)
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

vehicleRoute.post('/rentals', verifyToken, async (req, res) => {
    const {
      vehicleId,
      pickupAddress,
      destinationAddress,
      duration,
      pickupLat,
      pickupLng,
      destLat,
      destLng,
      picture,
    } = req.body;

    try {
      if (!picture) return res.status(400).json({ error: 'Picture URL is required' });

      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle || !vehicle.available) return res.status(404).json({ error: 'Vehicle not available' });

      const renter = await User.findById(req.user.id);
      if (!renter) return res.status(404).json({ error: 'Renter not found' });

      const owner = await User.findById(vehicle.owner);
      if (!owner) return res.status(404).json({ error: 'Owner not found' });

      // Fetch profiles for renter and owner
      const renterProfile = await Profile.findOne({ userId: renter._id });
      const ownerProfile = await Profile.findOne({ userId: owner._id });
      if (!renterProfile || !ownerProfile) {
        return res.status(404).json({ error: 'Profile not found for renter or owner' });
      }

      const rental = new Rental({
        vehicle: vehicleId,
        renter: renter._id,
        owner: owner._id,
        ownerProfile: ownerProfile._id,
        renterProfile: renterProfile._id,
        pickupAddress,
        destinationAddress,
        pickupCoordinates: { lat: parseFloat(pickupLat), lng: parseFloat(pickupLng) },
        destinationCoordinates: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
        duration,
        picture,
      });

      await rental.save();
      vehicle.available = false;
      await vehicle.save();

      io.emit('rentalRequest', {
        rental,
        renter: {
          firstName: renter.firstName,
          lastName: renter.lastName,
          phoneNumber: renter.phoneNumber,
          homeAddress: renter.homeAddress,
        },
      });

      res.status(201).json(rental);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Owner's Rentals
  vehicleRoute.get('/owner', verifyToken, async (req, res) => {
    try {
      const rentals = await Rental.find({ owner: req.user.id })
        .populate('vehicle', 'type plateNumber carPicture displayPicture color')
        .populate('renter', 'firstName lastName phoneNumber homeAddress')
        .populate('ownerProfile', 'phoneNumber profilePicture') 
        .populate('renterProfile', 'phoneNumber profilePicture'); 

      res.json(rentals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  return vehicleRoute
}