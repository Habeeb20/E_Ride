
import mongoose from "mongoose";


const rideSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId, ref: "Auth", required: false
  },
  passenger: {
    type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true
   },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: false },
  driverId: {type: mongoose.Schema.Types.ObjectId, ref:"Auth", required: false},
  pickupAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  pickupCoordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },

  destinationCoordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  calculatedPrice: { type: Number, required: true },
  desiredPrice: { type: Number, required: false },
  finalPrice: { type: Number, required: false },
  passengerNum:{type:Number, required: false},
  distance: { type: Number, required: true },
  rideOption: { type: String, enum: ["economy", "premium", "shared"], default: "economy" },
  paymentMethod: { type: String, enum: ["cash", "transfer"], required: true },
  interestedDrivers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  status: {
    type: String,
    enum: ["pending", "accepted", "in_progress", "completed", "cancelled", "rejected"],
    default: "pending",
  },
  driverOffers: [
    {
      driver: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      offeredPrice: { type: Number, required: true },
      status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  chatMessages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "Profile" },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  driverLocation: { lat: Number, lng: Number },
  eta: { type: Number },
  rideStartTime: { type: Date },
  rideEndTime: { type: Date },
  rideDuration: { type: Number },
  rating: { type: Number, min: 1, max: 5 },
  review: { type: String },
  createdAt: { type: Date, default: Date.now },
});


export default mongoose.model("Ride", rideSchema);