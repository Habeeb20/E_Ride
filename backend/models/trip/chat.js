import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true },
  messages: [
    {
      senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Auth' },
      content: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model('Chat', chatSchema);