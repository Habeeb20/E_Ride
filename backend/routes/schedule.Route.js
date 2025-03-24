import OwnAcar from "../models/auth/ownAcarSchema.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary";
import express from "express";
import dotenv from "dotenv";
import Profile from "../models/auth/profileSchema.js";
import User from "../models/auth/authSchema.js";
import { verifyToken } from "../middleware/verifyToken.js";
import Schedule from "../models/trip/schedule.js"; // Only one import needed, removed duplicate
import Chat from "../models/trip/chat.js";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ScheduleRoute = express.Router();


// POST /postschedule
ScheduleRoute.post("/postschedule", verifyToken, async (req, res) => {
  const id = req.user.id;
  const { time, date, state, lga, address, priceRange, description, recurrence, duration, pickUp } = req.body;

  try {
    // Validate required fields
    if (!time || !date || !state || !lga || !address || !priceRange || !pickUp || !priceRange.min || !priceRange.max) {
      return res.status(400).json({
        status: false,
        message: "All fields (time, date, state, lga, address, priceRange.min, priceRange.max) are required",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({
        status: false,
        message: "Profile not found",
      });
    }

    const schedule = new Schedule({
      userId: user._id,
      profileId: profile._id,
      time,
      date,
      pickUp,
      state,
      lga,
      address,
      priceRange: {
        min: priceRange.min,
        max: priceRange.max,
      },
      description: description || undefined,
      recurrence: recurrence || "none",
      duration: duration || 60,
      createdBy: user._id,
      updatedBy: null,
    });

    await schedule.save();
    return res.status(201).json({
      status: true,
      message: "Successfully scheduled",
      data: schedule,
    });
  } catch (error) {
    console.error("Error in /postschedule:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred with the server",
      error: error.message,
    });
  }
});

// POST /respondtoschedule/:scheduleId (For drivers to respond)
ScheduleRoute.post("/respondtoschedule/:scheduleId", verifyToken, async (req, res) => {
  const driverId = req.user.id;
  const { scheduleId } = req.params;
  const { status, negotiatedPrice } = req.body;

  try {
    // Find the schedule
    const schedule = await Schedule.findOne({ _id: scheduleId, isDeleted: false });
    if (!schedule) {
      return res.status(404).json({ status: false, message: "Schedule not found" });
    }

    // Check if the schedule is still available for response
    if (schedule.status !== "pending" || schedule.driverResponse.status !== "pending") {
      return res.status(400).json({ status: false, message: "Schedule is no longer available for response" });
    }

    // Find the driver and check their role
    const driver = await User.findById(driverId);
    if (!driver) {
      return res.status(404).json({ status: false, message: "Driver not found" });
    }

    const isDriver = driver.role === "driver";
    const isPassengerWithCar = driver.role === "passenger" && (await OwnAcar.findOne({ userId: driverId }));

    // Corrected authorization logic
    if (isDriver ||  isPassengerWithCar) {
      return res.status(403).json({
        status: false,
        message: "Only drivers or passengers with registered cars can respond to schedules",
      });
    }

    // Find the driver's profile
    const driverProfile = await Profile.findOne({ userId: driver._id });
    if (!driverProfile) {
      return res.status(404).json({ status: false, message: "Driver profile not found" });
    }

    // Validate the status
    if (!status || !["accepted", "negotiated", "rejected"].includes(status)) {
      return res.status(400).json({
        status: false,
        message: "Valid response (accepted, negotiated, rejected) is required",
      });
    }

    // Validate negotiatedPrice for "negotiated" status
    if (status === "negotiated" && (!negotiatedPrice || negotiatedPrice < 0)) {
      return res.status(400).json({
        status: false,
        message: "Negotiated price is required and must be non-negative",
      });
    }

    // Update driver response
    schedule.driverResponse = {
      status: status,
      negotiatedPrice: status === "negotiated" ? negotiatedPrice : null,
      driverId: driver._id,
      driverProfileId: driverProfile._id,
    };

    // Update schedule status if accepted
    if (status === "accepted") {
      schedule.status = "confirmed";
    }

    // Create chat for accepted or negotiated statuses
    if (status === "accepted" || status === "negotiated") {
      const chat = new Chat({
        scheduleId,
        participants: [schedule.profileId, driverProfile._id],
        messages: [],
      });
      await chat.save();
      schedule.chatId = chat._id;
    }

    // Set updatedBy
    schedule.updatedBy = driver._id;
    await schedule.save();

    // Populate the schedule for the response
    const populatedSchedule = await Schedule.findById(scheduleId)
      .populate("userId", "firstName lastName email phoneNumber profilePicture")
      .populate("profileId", "profilePicture phoneNumber") // Corrected typo
      .populate("driverResponse.driverId", "firstName lastName email profilePicture") // Removed phoneNumber
      .populate(
        "driverResponse.driverProfileId",
        "role profilePicture carDetails.model carDetails.product carDetails.year carDetails.color carDetails.plateNumber carPicture phoneNumber location.lga location.state"
      ); // Corrected CarPicture to carPicture

    return res.status(200).json({
      status: true,
      message: `Schedule ${status} successfully`,
      schedule: populatedSchedule,
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




// GET /getmyschedules (Updated to include driver details)
ScheduleRoute.get("/getmyschedules", verifyToken, async (req, res) => {
  const id = req.user.id;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({
        status: false,
        message: "Profile not found",
      });
    }

    const schedules = await Schedule.find({ profileId: profile._id, isDeleted: false })
      .populate("driverResponse.driverId", "firstName lastName email phoneNumber") // Populate driver details from Auth
      .populate("driverResponse.driverProfileId", "role profilePicture carDetails.model carDetails.product carDetails.year carDetails.color carDetails.plateNumber  phoneNumber carPicture location.lga location.state")


    if (!schedules.length) {
      return res.status(200).json({
        status: true,
        message: "No schedules found",
        schedules: [],
      });
    }


    return res.status(200).json({
      status: true,
      message: "Your schedules",
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

// GET /allschedules (For drivers to see available schedules)
// ScheduleRoute.get("/allschedules", verifyToken, async (req, res) => {
//   try {
//     const schedules = await Schedule.find({
//       isDeleted: false,
//       "driverResponse.status": "pending", 
//     }).populate("userId", "firstName lastName email ")
//       .populate("profileId", "profilePicture location.state phoneNumber")
//       .populate("driverResponse.driverId", "firstName lastName email phoneNumber");



//     return res.status(200).json({
//       status: true,
//       message: "All available schedules",
//       schedules,
//     });
//   } catch (error) {
//     console.error("Error in /allschedules:", error);
//     return res.status(500).json({
//       status: false,
//       message: "An error occurred",
//       error: error.message,
//     });
//   }
// });




ScheduleRoute.get("/allschedules", verifyToken, async (req, res) => {
  const { state, lga } = req.query;
  try {
    // Build the filter object
    const filter = {
      isDeleted: false, // Only include non-deleted schedules
      "driverResponse.status": { $in: ["pending", "rejected"] }, // Include schedules with pending or canceled driver response
    };

    // Add state and lga to filter if provided
    if (state) filter.state = state;
    if (lga) filter.lga = lga;

    // Fetch schedules with the filter
    const schedules = await Schedule.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("profileId", "profilePicture location.state phoneNumber")
      .populate("driverResponse.driverId", "firstName lastName email phoneNumber");

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

///for the driver, get the schedules that i have  accepted

ScheduleRoute.get("/myAcceptedSchedule", verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {

    const user = await Profile.findOne({ userId });
    if (!user) {
      return res.status(404).json({
        message: "Profile details not found",
        status: false,
      });
    }

    const myProfileId = user._id;

    const schedules = await Schedule.find({
   "driverResponse.driverId": userId,
      $or: [
        { "driverResponse.status": "accepted" }, 
        { "driverResponse.status": "negotiated" }, 
      ],
    }).populate("userId", "firstName lastName email")
      .populate("profileId", "phoneNumber, profilePicture ");

    // If no schedules are found
    if (!schedules || schedules.length === 0) {
      return res.status(404).json({
        message: "No accepted or negotiated schedules found",
        status: false,
      });
    }

    // Return the found schedules
    return res.status(200).json({
      status: true,
      message: "Accepted and negotiated schedules retrieved successfully",
      schedules: schedules,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "An error occurred on the server",
    });
  }
});
// GET /schedules/by-state/:state
ScheduleRoute.get("/schedules/by-state/:state", verifyToken, async (req, res) => {
  const id = req.user.id;
  const { state } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({
        status: false,
        message: "Profile not found",
      });
    }

    const schedules = await Schedule.find({
      profileId: profile._id,
      state: { $regex: new RegExp(state, "i") }, // Case-insensitive match
      isDeleted: false, // Exclude soft-deleted schedules
    });

    if (!schedules.length) {
      return res.status(200).json({
        status: true,
        message: `No schedules found for state: ${state}`,
        schedules: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: `Schedules for state: ${state}`,
      schedules,
    });
  } catch (error) {
    console.error("Error in /schedules/by-state:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// GET /schedules/by-lga/:lga
ScheduleRoute.get("/schedules/by-lga/:lga", verifyToken, async (req, res) => {
  const id = req.user.id;
  const { lga } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({
        status: false,
        message: "Profile not found",
      });
    }

    const schedules = await Schedule.find({
      profileId: profile._id,
      lga: { $regex: new RegExp(lga, "i") }, // Changed from LGA to lga
      isDeleted: false, // Exclude soft-deleted schedules
    });

    if (!schedules.length) {
      return res.status(200).json({
        status: true,
        message: `No schedules found for LGA: ${lga}`,
        schedules: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: `Schedules for LGA: ${lga}`,
      schedules,
    });
  } catch (error) {
    console.error("Error in /schedules/by-lga:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});

// GET /schedules/by-state-and-lga/:state/:lga
ScheduleRoute.get("/schedules/by-state-and-lga/:state/:lga", verifyToken, async (req, res) => {
  const id = req.user.id;
  const { state, lga } = req.params;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({
        status: false,
        message: "Profile not found",
      });
    }

    const schedules = await Schedule.find({
      profileId: profile._id,
      state: { $regex: new RegExp(state, "i") }, // Case-insensitive match
      lga: { $regex: new RegExp(lga, "i") }, // Changed from LGA to lga
      isDeleted: false, // Exclude soft-deleted schedules
    });

    if (!schedules.length) {
      return res.status(200).json({
        status: true,
        message: `No schedules found for state: ${state} and LGA: ${lga}`,
        schedules: [],
      });
    }

    return res.status(200).json({
      status: true,
      message: `Schedules for state: ${state} and LGA: ${lga}`,
      schedules,
    });
  } catch (error) {
    console.error("Error in /schedules/by-state-and-lga:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred",
      error: error.message,
    });
  }
});



ScheduleRoute.put("/updateschedule/:id", verifyToken, async (req, res) => {
    const id = req.user.id;
    const scheduleId = req.params.id;
    const updates = req.body;
  
    try {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ status: false, message: "User not found" });
  
      const schedule = await Schedule.findOne({ _id: scheduleId, userId: id, isDeleted: false });
      if (!schedule) return res.status(404).json({ status: false, message: "Schedule not found" });
  
      Object.assign(schedule, updates, { updatedBy: id });
      await schedule.save();
  
      return res.status(200).json({ status: true, message: "Schedule updated", data: schedule });
    } catch (error) {
      console.error("Error in /updateschedule:", error);
      return res.status(500).json({ status: false, message: "An error occurred", error: error.message });
    }
  });




  ScheduleRoute.delete("/deleteschedule/:id", verifyToken, async (req, res) => {
    const id = req.user.id;
    const scheduleId = req.params.id;
  
    try {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ status: false, message: "User not found" });
  
      const schedule = await Schedule.findOneAndUpdate(
        { _id: scheduleId, userId: id, isDeleted: false },
        { isDeleted: true, updatedBy: id },
        { new: true }
      );
      if (!schedule) return res.status(404).json({ status: false, message: "Schedule not found" });
  
      return res.status(200).json({ status: true, message: "Schedule deleted" });
    } catch (error) {
      console.error("Error in /deleteschedule:", error);
      return res.status(500).json({ status: false, message: "An error occurred", error: error.message });
    }
  });



  // Get chat messages
ScheduleRoute.get("/chat/:scheduleId", verifyToken, async (req, res) => {
  const scheduleId = req.params.scheduleId;
  const userId = req.user.id;

  try {
    const profile = await Profile.findOne({ userId });
    const chat = await Chat.findOne({ scheduleId, participants: profile._id }).populate(
      "messages.sender",
      "firstName lastName"
    );
    if (!chat) {
      return res.status(404).json({ status: false, message: "Chat not found" });
    }

    return res.status(200).json({ status: true, chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});

// Send a message
ScheduleRoute.post("/chat/send", verifyToken, async (req, res) => {
  const { scheduleId, content } = req.body;
  const userId = req.user.id;

  try {
    const profile = await Profile.findOne({ userId });
    const chat = await Chat.findOne({ scheduleId, participants: profile._id });
    if (!chat) {
      return res.status(404).json({ status: false, message: "Chat not found" });
    }

    chat.messages.push({ sender: profile._id, content });
    await chat.save();

    return res.status(200).json({ status: true, message: "Message sent", chat });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, message: "Server error" });
  }
});



  
export default ScheduleRoute;




































