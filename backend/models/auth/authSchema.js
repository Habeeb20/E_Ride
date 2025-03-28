import mongoose, { Types } from "mongoose";


const authSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  profileId:{
    type:mongoose.Schema.Types.ObjectId,
    ref: "Profile"
  },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },

  email: { type: String, required: true, unique: true },
  password: { type: String },
  
  location: {
    latitude: { type: Number },
    longitude: { type: Number },
    lastUpdated: { type: Date, default: Date.now }
},

    isVerified: {type: Boolean,default: false},
    status: { type: String, enum: ['active', 'blocked', 'pending'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
    registrationDate: { type: Date, default: Date.now },
    uniqueNumber: { type: String, unique: true },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
}, {timestamps: true})

export default mongoose.model("Auth", authSchema)