import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: false },
  pickupAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  packageDescription: { type: String, required: true },
  packagePicture: { type: String, required: false }, 
  distance: { type: Number, required: true }, 
  price: { type: Number, required: true }, 
  rideOption: { type: String, enum: ['economy', 'premium', 'shared'], default: 'economy' },
  paymentMethod: { type: String, enum: ['cash', 'card'], required: true },
  status: { type: String, enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
  chatMessages: [{ sender: String, text: String, timestamp: { type: Date, default: Date.now } }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Delivery', deliverySchema);