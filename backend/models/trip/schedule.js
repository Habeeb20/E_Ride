import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema({
  pickUp: { type: String, required: true },
  address: { type: String, required: true },
  time: { type: String, required: true },
  date: { type: Date, required: true },
  state: { type: String, required: true },
  lga: { type: String, required: true },
  priceRange: {
    min: { type: Number, required: true },
    max: { type: Number, required: true },
  },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth', required: true },
  customerProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
  driverProfileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile' },
  driverResponse: {
    status: { type: String, enum: ['accepted', 'pending','rejected', 'negotiating'], default: 'pending' },
    negotiatedPrice: { type: Number },
  },
  status: { type: String, enum: ['pending', 'confirmed', 'completed', 'cancelled'], default: 'pending' },
  distance: { type: String }, 
  calculatedFare: { type: Number }, 
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  isDeleted: { type: Boolean, default: false },
});



export default mongoose.model('Schedule', scheduleSchema);