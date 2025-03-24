import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: "Schedule", required: true },
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
  ],
  messages: [
    {
      sender: { type: mongoose.Schema.Types.ObjectId, ref: "Profile", required: true },
      content: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("Chat", chatSchema);