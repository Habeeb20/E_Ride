import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  ownerProfile:{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  type: { type: String, enum: ['bus', 'van', 'lorry', 'trailer'], required: true },
  plateNumber: { type: String, required: true, unique: true },
  carPicture: { type: String, required: true }, 
  displayPicture: { type: String, required: true }, 
  ownerOfVehicle: { type: String, required: true },
  color: { type: String, required: true },
  carDocument: { type: String, required: true }, 
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Vehicle', vehicleSchema);