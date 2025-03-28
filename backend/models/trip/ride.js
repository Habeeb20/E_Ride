// models/Ride.js
import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: false }, 
  pickupAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  distance: { type: Number, required: true }, 
  price: { type: Number, required: true }, 
  rideOption: { type: String, enum: ["economy", "premium", "shared"], default: "economy" }, 
  status: { type: String, enum: ["pending", "accepted", "in_progress", "completed", "cancelled"], default: "pending" },
  driverResponses: [
    {
      driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
      offeredPrice: { type: Number }, 
      respondedAt: { type: Date, default: Date.now }
    }
  ],
  passengerAcceptedDriver: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", default: null }, 
  chatMessages: [
    {
      sender: { type: String, enum: ["passenger", "driver"], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  driverLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    lastUpdated: { type: Date }
  }, 
  etaToPickup: { type: Number },
  rating: {
    passengerRating: { type: Number, min: 1, max: 5 },
    review: { type: String }
  }
});

export default mongoose.model("Ride", rideSchema);