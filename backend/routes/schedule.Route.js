import OwnAcar from "../models/auth/ownAcarSchema.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary"
import express from "express"
import dotenv from "dotenv"
import Profile from "../models/auth/profileSchema.js";
import User from "../models/auth/authSchema.js"
import { verifyToken } from "../middleware/verifyToken.js";
import Schedule from "../models/trip/schedule.js";

dotenv.config()



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


const ScheduleRoute = express.Router()


ScheduleRoute.post("/postschedule", verifyToken, async(req, res) => {
    
})