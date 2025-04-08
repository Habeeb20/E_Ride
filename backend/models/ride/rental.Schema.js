import mongoose from 'mongoose';

const rentalSchema = new mongoose.Schema({
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  renter: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  ownerProfile:{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  renterProfile:{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  pickupAddress: { type: String, required: true },
  destinationAddress: { type: String, required: true },
  pickupCoordinates: { lat: Number, lng: Number },
  destinationCoordinates: { lat: Number, lng: Number },
  duration: { type: String, required: true }, 
  picture: { type: String, required: true }, 
  status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Rental', rentalSchema);