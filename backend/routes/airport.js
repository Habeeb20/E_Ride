import mongoose from "mongoose";
import Airport from "../models/pickups/airport.js";
import Profile from "../models/auth/profileSchema.js";
import User from "../models/auth/authSchema.js"
import express from "express"
import { verifyToken } from "../middleware/verifyToken.js";
import Chat from "../models/trip/chat.js";
import schedule from "../models/trip/schedule.js";
import OwnAcar from "../models/auth/ownAcarSchema.js";

const airportRoute = express.Router()

airportRoute.post("/postairport", verifyToken, async(req, res)=> {
    const id = req.user.id;

    const {state, airportName, homeAddress, time, pickupOrdropoff, date} = req.body

    try {
        if(!state || !airportName || !homeAddress || !time){
            return res.status(400).json({
                 status: false,
                 message: "All fields  are required"
            })
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

            const airport = new Airport({
                userId: user._id,
                profileId: profile._id,
                state,
                airportName,
                homeAddress,
                time,
                pickupOrdropoff,
                date
            })

            await airport.save()
            return res.status(201).json({
                status: true,
                message: "successfully created",
                data: airport
            })
        
    } catch (error) {
        console.error("Error in booking a ride for airport", error);
        return res.status(500).json({
          status: false,
          message: "An error occurred with the server",
          error: error.message,
        });
    }
})


airportRoute.get("/getmyairport", verifyToken, async(req, res) => {
    const userId = req.user.id

    try {
          const profile = await Profile.findOne({ userId});
            if (!profile) {
              return res.status(404).json({
                status: false,
                message: "Profile not found",
              });
            }
        const airport = await Airport.find({profileId: profile._id})
        .populate("driverResponse.driverId", "firstName lastName email phoneNumber") // Populate driver details from Auth
        .populate("driverResponse.driverProfileId", "role profilePicture carDetails.model carDetails.product carDetails.year carDetails.color carDetails.plateNumber  phoneNumber carPicture location.lga location.state")

        if(!airport.length){
            return res.status(200).json({
                status: true,
                message: "No airport found",
                airport: [],
              });
        }


        return res.status(200).json({
            status: true,
            message: "Your airport",
            airport,
          });
    } catch (error) {
        console.error("Error in /get airport:", error);
        return res.status(500).json({
          status: false,
          message: "An error occurred",
          error: error.message,
        });
    }
})


airportRoute.post("/respondtoairportpickup/:airportId", verifyToken, async (req, res) => {
    const driverId = req.user.id;
    const { airportId } = req.params;
    const { status, negotiatedPrice } = req.body;
    console.log(airportId);
  
    try {
      const airport = await Airport.findOne({ _id: airportId });
      if (!airport) {
        return res.status(404).json({ status: false, message: "Airport not found" });
      }
  
      if (airport.status !== "pending") {
        return res.status(400).json({
          status: false,
          message: "Airport pickup is no longer available",
        });
      }
  
      const driver = await User.findById(driverId);
      if (!driver) {
        return res.status(404).json({ status: false, message: "Driver not found" });
      }
  
      const isDriver = driver.role === "driver";
      const isPassengerWithCar = driver.role === "passenger" && (await OwnAcar.findOne({ userId: driverId }));
      if (isDriver || isPassengerWithCar) { 
        return res.status(403).json({
          status: false,
          message: "Only drivers or passengers with registered cars can respond to airport pickups",
        });
      }
  
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
  
      if (status === "negotiated" && (!negotiatedPrice || negotiatedPrice < 0)) {
        return res.status(400).json({
          status: false,
          message: "Negotiated price is required and must be non-negative",
        });
      }
  
      // Assign driver response
      airport.driverResponse = {
        status: status,
        negotiatedPrice: status === "negotiated" ? negotiatedPrice : null,
        driverId: driver._id,
        driverProfileId: driverProfile._id,
      };
  
      if (status === "accepted") {
        airport.status = "confirmed";
      }
  
      if (status === "accepted" || status === "negotiated") {
        const chat = new Chat({
          scheduled: airportId,
          participants: [airport.profileId, driverProfile._id],
          messages: [],
        });
  
        await chat.save();
        airport.chatId = chat._id;
      }
  
      airport.updatedBy = driver._id;
      await airport.save();
  
      const populatedAirport = await Airport.findById(airportId)
        .populate("userId", "firstName lastName email phoneNumber profilePicture")
        .populate("profileId", "profilePicture phoneNumber")
        .populate("driverResponse.driverId", "firstName lastName email profilePicture")
        .populate(
          "driverResponse.driverProfileId",
          "role profilePicture carDetails.model carDetails.product carDetails.year carDetails.color carDetails.plateNumber carPicture phoneNumber location.lga location.state"
        );
  
      return res.status(200).json({
        status: true,
        message: `Schedule ${status} successfully`,
        airport: populatedAirport,
      });
    } catch (error) {
      console.log("Error in respond to airport:", error);
      return res.status(500).json({
        status: false,
        message: "An error occurred",
        error: error.message,
      });
    }
  });


airportRoute.get("/getmypickupPassengers", verifyToken, async(req, res) => {
    const userId = req.user.id;

    try {
        const user = await Profile.findOne({userId})
        if(!user){
            return res.status(404).json({
                status:false,
                message: "profile not found"

            })
        }

    //    const  profileId = user._id

       const airport = await Airport.find({
        profileId: userId,

        $or:[
            {  "driverResponse.status": "accepted"},
            {"driverResponse.status": "negotiated"}
        ]          
       }).populate("userId", "firstName lastName email")
       .populate("profileId", "phoneNumber, profilePicture ");


       if(!airport || airport.length === 0){
            return res.status(404).json({
                status: false,
                message: "no airport pick up found for you yet"
            })
       }

       return res.status(200).json({
        status: true,
        message: "Accepted and negotiated airport pickups retrieved successfully",
        airport: airport,
      });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
          status: false,
          message: "An error occurred on the server",
        });
    }
})



airportRoute.get("/allAirportPickups", verifyToken, async(req, res) => {
    const {state, lga} = req.query;

    try {
        const filter = {
            isDeleted: false,
            "driverResponse.status": { $in:["pending", "rejected"]}
        }

        if(state) filter.state = state;
        if(lga) filter.lga = lga;

        const airport = await Airport.find()
              .populate("userId", "firstName lastName email")
              .populate("profileId", "profilePicture location.state phoneNumber")
              .populate("driverResponse.driverId", "firstName lastName email phoneNumber")

        
    return res.status(200).json({
        status: true,
        message: "All available airport bookings",
        airport,
      });

    } catch (error) {
        console.log(error)
        return res.status(500).json({

            status: false,
            message: "An error occurred",
            error: error.message,
          });
    }
})



airportRoute.get("/chat/:scheduleId", verifyToken, async (req, res) => {
  const airportId = req.params.airportId;
  const userId = req.user.id;

  try {
    const profile = await Profile.findOne({ userId });
    const chat = await Chat.findOne({ airportId, participants: profile._id }).populate(
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
airportRoute.post("/chat/send", verifyToken, async (req, res) => {
  const { airportId, content } = req.body;
  const userId = req.user.id;

  try {
    const profile = await Profile.findOne({ userId });
    const chat = await Chat.findOne({ airportId, participants: profile._id });
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





export default airportRoute