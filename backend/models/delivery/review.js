import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  review: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Review', reviewSchema);