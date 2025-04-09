import OwnAcar from "../models/auth/ownAcarSchema.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import express from "express";
import dotenv from "dotenv";
import Profile from "../models/auth/profileSchema.js";
import User from "../models/auth/authSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";
import Schedule from "../models/trip/schedule.js";
import Chat from "../models/trip/chat.js";
import axios from "axios";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ScheduleRoute = express.Router();

// **POST /postschedule** - Passenger creates a new schedule
ScheduleRoute.post('/postschedule', verifyToken, async (req, res) => {
  const {
    pickUp,
    address,
    time,
    date,
    state,
    lga,
    priceRange,
    distance,
    calculatedFare,
  } = req.body;
  const customerId = req.user.id;

  try {
    const customer = await User.findById(customerId);
    if (!customer) {
      return res.status(404).json({ status: false, message: 'Customer not found' });
    }

    const customerProfile = await Profile.findOne({ userId: customerId });
    if (!customerProfile) {
      return res.status(404).json({ status: false, message: 'Customer profile not found' });
    }

    const schedule = new Schedule({
      pickUp,
      address,
      time,
      date,
      state,
      lga,
      priceRange,
      customerId,
      customerProfileId: customerProfile._id,
      distance,
      calculatedFare,
    });

    const savedSchedule = await schedule.save();
    return res.status(201).json({
      status: true,
      message: 'Schedule created successfully',
      data: savedSchedule,
    });
  } catch (error) {
    console.error('Error in /postschedule:', error);
    return res.status(500).json({
      status: false,
      message: 'An error occurred',
      error: error.message,
    });
  }
});

// **POST /respondtoschedule/:scheduleId** - Driver responds to a schedule
ScheduleRoute.post("/respondtoschedule/:scheduleId", verifyToken, async (req, res) => {
  const driverId = req.user.id;
  const { scheduleId } = req.params;
  const { status, negotiatedPrice } = req.body;

  try {
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule || schedule.status !== "pending") {
      return res.status(404).json({ status: false, message: "Schedule not available" });
    }

    const user = await Profile.findOne({userId: driverId});
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }
    
const profileId = user._id

    const isDriver = user.role === 'driver';
    let hasCar = false;
    if (!isDriver) {
      hasCar = await OwnAcar.findOne({ profileId });
    }

    if (!isDriver && !hasCar) {
      return res.status(403).json({
        status: false,
        message: 'Unauthorized: Only drivers or passengers with a registered car can view available schedules',
      });
    }


    if (!["accepted", "rejected", "negotiating"].includes(status)) {
      return res.status(400).json({ status: false, message: "Invalid status. Use 'accepted', 'rejected', or 'negotiating'" });
    }

    if (status === "negotiating" && (!negotiatedPrice || negotiatedPrice <= 0)) {
      return res.status(400).json({ status: false, message: "Negotiated price must be provided and positive" });
    }

    schedule.driverId = isDriver._id;
    schedule.driverProfileId = user._id;
    schedule.driverResponse = {
      status,
      negotiatedPrice: status === "negotiating" ? negotiatedPrice : null,
    };

    if (status === "accepted") {
      schedule.status = "confirmed";
      const chat = new Chat({ scheduleId, participants: [schedule.customerId, isDriver._id] });
      await chat.save();
      schedule.chatId = chat._id;

      global.io.to(schedule.customerId.toString()).emit("driverResponse", {
        scheduleId,
        driverResponse: schedule.driverResponse,
      });
    }

    await schedule.save();
    return res.status(200).json({
      status: true,
      message: `Schedule ${status} successfully`,
      schedule,
    });
  } catch (error) {
    console.error("Error in /respondtoschedule:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

ScheduleRoute.post('/calculate-fare', verifyToken, async (req, res) => {
  const { pickupAddress, destinationAddress } = req.body;

  try {

    const distance = '5.2'; 
    const fare = 1000 + parseFloat(distance) * 100; 

    return res.status(200).json({
      distance, // e.g., "5.2"
      fare,     // e.g., 1520
    });
  } catch (error) {
    console.error('Error in /calculate-fare:', error);
    return res.status(500).json({
      status: false,
      message: 'Failed to calculate fare',
      error: error.message,
    });
  }
});

// **GET /allschedules** - Drivers view available schedules
ScheduleRoute.get('/allschedules', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
  
    const user = await Profile.findOne({userId});
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found',
      });
    }

const profileId = user._id

    const isDriver = user.role === 'driver';
    let hasCar = false;
    if (!isDriver) {
      hasCar = await OwnAcar.findOne({ profileId });
    }

    if (!isDriver && !hasCar) {
      return res.status(403).json({
        status: false,
        message: 'Unauthorized: Only drivers or passengers with a registered car can view available schedules',
      });
    }

    // Fetch pending schedules
    const schedules = await Schedule.find({ status: 'pending', isDeleted: false })
      .populate('customerId', 'firstName lastName email')
      .populate('customerProfileId', 'phoneNumber profilePicture');

    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
      if (!firstSchedule.customerId || !firstSchedule.customerProfileId) {
        console.warn('Population failed for some fields:', {
          schedule: firstSchedule,
          customerIdPopulated: !!firstSchedule.customerId,
          customerProfileIdPopulated: !!firstSchedule.customerProfileId,
        });
      }
    }

    console.log(schedules)
    return res.status(200).json({
      status: true,
      message: 'All available schedules',
      schedules,
    });
  } catch (error) {
    console.error('Error in /allschedules:', error);
    return res.status(500).json({
      status: false,
      message: 'An error occurred',
      error: error.message,
    });
  }
});





// **GET /getmyschedules** - Passenger views their schedules
ScheduleRoute.get("/getmyschedules", verifyToken, async (req, res) => {
  const id = req.user.id;

  try {
    const schedules = await Schedule.find({ customerId: id, isDeleted: false })
      .populate("driverId", "firstName lastName email")
      .populate("driverProfileId", "phoneNumber carDetails");

    return res.status(200).json({
      status: true,
      message: schedules.length ? "Your schedules" : "No schedules found",
      schedules,
    });
  } catch (error) {
    console.error("Error in /getmyschedules:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// **GET /allschedules** - Drivers view available schedules
ScheduleRoute.get("/allschedules", verifyToken, async (req, res) => {
  try {
    const schedules = await Schedule.find({ status: "pending", isDeleted: false })
      .populate("customerId", "firstName lastName email")
      // .populate("profileId", "phoneNumber profilePicture");

    return res.status(200).json({
      status: true,
      message: "All available schedules",
      schedules,
    });
  } catch (error) {
    console.error("Error in /allschedules:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// **GET /myAcceptedSchedule** - Driver views accepted/negotiated schedules
ScheduleRoute.get("/myAcceptedSchedule", verifyToken, async (req, res) => {
  const driverId = req.user.id;

  try {
    const schedules = await Schedule.find({
      driverId,
      "driverResponse.status": { $in: ["accepted", "negotiating"] },
    })
      .populate("customerId", "firstName lastName email")
      .populate("customerProfileId", "phoneNumber profilePicture");

 
    console.log(schedules)
    return res.status(200).json({
      status: true,
      message: "Accepted and negotiated schedules",
      schedules,
    });
  } catch (error) {
    console.error("Error in /myAcceptedSchedule:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// **PUT /updateschedule/:id** - Update a schedule
ScheduleRoute.put("/updateschedule/:id", verifyToken, async (req, res) => {
  const id = req.user.id;
  const scheduleId = req.params.id;
  const updates = req.body;

  try {
    const schedule = await Schedule.findOne({ _id: scheduleId, customerId: id, isDeleted: false });
    if (!schedule) return res.status(404).json({ status: false, message: "Schedule not found or unauthorized" });

    Object.assign(schedule, updates, { updatedBy: id });
    await schedule.save();

    return res.status(200).json({ status: true, message: "Schedule updated", data: schedule });
  } catch (error) {
    console.error("Error in /updateschedule:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// **DELETE /deleteschedule/:id** - Soft delete a schedule
ScheduleRoute.delete("/deleteschedule/:id", verifyToken, async (req, res) => {
  const id = req.user.id;
  const scheduleId = req.params.id;

  try {
    const schedule = await Schedule.findOneAndUpdate(
      { _id: scheduleId, customerId: id, isDeleted: false },
      { isDeleted: true, updatedBy: id },
      { new: true }
    );
    if (!schedule) return res.status(404).json({ status: false, message: "Schedule not found or unauthorized" });

    return res.status(200).json({ status: true, message: "Schedule deleted" });
  } catch (error) {
    console.error("Error in /deleteschedule:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// **GET /chat/:scheduleId** - Get chat messages
ScheduleRoute.get("/chat/:scheduleId", verifyToken, async (req, res) => {
  const { scheduleId } = req.params;
  const userId = req.user.id;

  try {
    const chat = await Chat.findOne({ scheduleId, participants: userId }).populate(
      "messages.sender",
      "firstName lastName"
    );
    if (!chat) return res.status(404).json({ status: false, message: "Chat not found" });

    return res.status(200).json({ status: true, chat });
  } catch (error) {
    console.error("Error in /chat/:scheduleId:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// **POST /chat/send** - Send a chat message
ScheduleRoute.post("/chat/send", verifyToken, async (req, res) => {
  const { scheduleId, content } = req.body;
  const userId = req.user.id;

  try {
    const chat = await Chat.findOne({ scheduleId, participants: userId });
    if (!chat) return res.status(404).json({ status: false, message: "Chat not found" });

    const newMessage = { senderId: userId, content, timestamp: new Date() };
    chat.messages.push(newMessage);
    await chat.save();

    global.io.to(chat.participants.filter(id => id.toString() !== userId.toString())[0].toString()).emit("newMessage", newMessage);

    return res.status(200).json({ status: true, message: "Message sent", chat });
  } catch (error) {
    console.error("Error in /chat/send:", error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// **POST /calculate-fare** - Calculate fare using Google Maps API
ScheduleRoute.post("/calculate-fare", async (req, res) => {
  const { pickupAddress, destinationAddress } = req.body;

  if (!pickupAddress || !destinationAddress) {
    return res.status(400).json({ status: false, message: "Pickup and destination addresses are required" });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || "YOUR_API_KEY_HERE"; // Use .env file in production
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickupAddress)}&destinations=${encodeURIComponent(destinationAddress)}&units=metric&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.status !== "OK") {
      return res.status(400).json({
        status: false,
        message: `API Error: ${data.status}`,
        details: data.error_message || "Unknown error",
      });
    }

    const element = data.rows[0]?.elements[0];
    if (!element || element.status !== "OK") {
      return res.status(400).json({
        status: false,
        message: "Unable to calculate distance",
        details: element?.status || "No route data available",
      });
    }

    const distanceInMeters = element.distance.value;
    const distanceInKm = distanceInMeters / 1000;

    const baseFare = 500;
    const ratePerKm = 100;
    const fare = baseFare + distanceInKm * ratePerKm;

    return res.status(200).json({
      status: true,
      distance: distanceInKm.toFixed(2),
      fare: Math.round(fare),
    });
  } catch (error) {
    console.error("Error calculating fare:", error.response?.data || error.message);
    return res.status(500).json({
      status: false,
      message: "An error occurred while calculating fare",
      error: error.message,
    });
  }
});

export default ScheduleRoute;