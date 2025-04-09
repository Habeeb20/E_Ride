import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  passengerAuth: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  driverAuth: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: false },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false },
  pickupAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  packageDescription: { type: String, required: true },
  packagePicture: { type: String, required: false },
  distance: { type: Number, required: true },
  price: { type: Number, required: true },
  passengerPrice: { type: Number, required: false },
  driverNegotiatedPrice: { type: Number, required: false },
  // rideOption: { type: String, enum: ['economy', 'premium', 'shared'], default: 'economy' },
  paymentMethod: { type: String, enum: ['cash', 'transfer'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled', 'negotiating'], default: 'pending' },
  chatMessages: [{ sender: String, text: String, timestamp: { type: Date, default: Date.now } }],
  driverLocation: { lat: Number, lng: Number },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Delivery', deliverySchema);
























