
import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: false }, 
  pickupAddress: { type: String, required: true },
  pickupLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  destinationAddress: { type: String, required: true },
  destinationLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  distance: { type: Number, required: true }, // Distance in km
  price: { type: Number, required: true }, // Passenger-offered price
  rideOption: { type: String, enum: ["economy", "premium", "shared"], default: "economy" },
  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled"],
    default: "pending",
  },
  driverResponses: [
    {
      driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      offeredPrice: { type: Number }, // Driver can counter-offer
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
      respondedAt: { type: Date, default: Date.now },
    },
  ],
  chatMessages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  driverLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
    lastUpdated: { type: Date },
  },
  eta: { type: Number }, // Estimated time in minutes
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Ride", rideSchema);