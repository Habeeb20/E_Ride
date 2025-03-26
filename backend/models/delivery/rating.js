import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  delivery: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery', required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  passenger: { type: mongoose.Schema.Types.ObjectId, ref: 'Profile', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Rating', ratingSchema);