import OwnAcar from "../models/auth/ownAcarSchema.js";
import mongoose from "mongoose";
import cloudinary from "cloudinary"
import express from "express"
import dotenv from "dotenv"
import Profile from "../models/auth/profileSchema.js";
import User from "../models/auth/authSchema.js"
import { verifyToken } from "../middleware/verifyToken.js";


dotenv.config()

const ownACarRoute = express.Router()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


ownACarRoute.post("/registeryourcar", verifyToken, async (req, res) => {
    const { carDetails, picture, carPicture, driverLicense } = req.body;
    const id = req.user.id;
  
    try {
      console.log("Request body:", req.body);
  
      if (!carDetails || !picture || !carPicture || !driverLicense) {
        return res.status(400).json({
          status: false,
          message: "All fields (carDetails, picture, carPicture, driverLicense) must be filled",
        });
      }
  
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
  
      let profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        return res.status(404).json({
          status: false,
          message: "Profile not found",
        });
      }
  
      const carExists = await OwnAcar.findOne({ profileId: profile._id });
      if (carExists) {
        return res.status(400).json({
          status: false,
          message: "You have already registered a car; update it instead",
        });
      }
  
      let parsedCarDetails = carDetails;
      if (typeof carDetails === "string") {
        try {
          parsedCarDetails = JSON.parse(carDetails);
        } catch (error) {
          return res.status(400).json({
            status: false,
            message: "Invalid carDetails JSON format",
          });
        }
      }
  
      const requiredFields = ["model", "product", "year", "color", "plateNumber"];
      const missingFields = requiredFields.filter((field) => !parsedCarDetails[field]);
      if (missingFields.length > 0) {
        return res.status(400).json({
          status: false,
          message: `Missing required car details: ${missingFields.join(", ")}`,
        });
      }
  
      const isValidUrl = (url) => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };
      if (!isValidUrl(picture) || !isValidUrl(carPicture) || !isValidUrl(driverLicense)) {
        return res.status(400).json({
          status: false,
          message: "Picture, carPicture, and driverLicense must be valid URLs",
        });
      }
  
      // Create new OwnAcar document
      const car = new OwnAcar({
        profileId: profile._id,
        carDetails: parsedCarDetails,
        picture,
        carPicture,
        driverLicense,
      });
  
      await car.save();
  
      // Optionally update profile if needed
    //   profile.carDetails = parsedCarDetails; // Remove if not needed in Profile
    //   profile.picture = picture;
    //   profile.carPicture = carPicture;
    //   profile.driverLicense = driverLicense;
    //   await profile.save();
  
      res.status(201).json({
        status: true,
        message: "Car registered successfully",
        role: user.role,
        data: car,
      });
    } catch (error) {
      console.error("Error in /registeryourcar:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({
          status: false,
          message: "Validation error: " + error.message,
        });
      }
      res.status(500).json({
        status: false,
        message: "Server error",
        error: error.message,
      });
    }
  });




ownACarRoute.get("/getmyCarProfile", verifyToken, async (req, res) => {
  const id = req.user.id;

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "User account not found",
      });
    }

    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return res.status(404).json({
        status: false,
        message: "Profile not found",
      });
    }

    const carprofile = await OwnAcar.findOne({ profileId: profile._id });
    if (!carprofile) {
      return res.status(404).json({
        status: false,
        message: "Your car details not found",
      });
    }

    return res.status(200).json({
      status: true,
      message: "Car profile retrieved successfully",
      data: carprofile,
    });
  } catch (error) {
    console.error("Error in /getmyCarProfile:", error);
    return res.status(500).json({
      status: false,
      message: "An error occurred on the server",
      error: error.message,
    });
  }
});



ownACarRoute.put("/updatecarDetails", verifyToken, async (req, res) => {
    const { carDetails, carPicture } = req.body;
    const id = req.user.id;
  
    try {
      console.log("Request body:", req.body);
  
      // Find the user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
  
      // Find the profile
      const profile = await Profile.findOne({ userId: user._id });
      if (!profile) {
        return res.status(404).json({
          status: false,
          message: "Profile not found",
        });
      }
  
      // Find the existing car profile
      const car = await OwnAcar.findOne({ profileId: profile._id });
      if (!car) {
        return res.status(404).json({
          status: false,
          message: "Car details not found; register a car first",
        });
      }
  
      // Validate and update carDetails if provided
      if (carDetails) {
        let parsedCarDetails = carDetails;
        if (typeof carDetails === "string") {
          try {
            parsedCarDetails = JSON.parse(carDetails);
          } catch (error) {
            return res.status(400).json({
              status: false,
              message: "Invalid carDetails JSON format",
            });
          }
        }
  
        const requiredFields = ["model", "product", "year", "color", "plateNumber"];
        const missingFields = requiredFields.filter((field) => !parsedCarDetails[field]);
        if (missingFields.length > 0) {
          return res.status(400).json({
            status: false,
            message: `Missing required car details: ${missingFields.join(", ")}`,
          });
        }
        car.carDetails = parsedCarDetails;
      }
  
      // Validate and update carPicture if provided
      if (carPicture) {
        const isValidUrl = (url) => {
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        };
        if (!isValidUrl(carPicture)) {
          return res.status(400).json({
            status: false,
            message: "carPicture must be a valid URL",
          });
        }
        car.carPicture = carPicture;
      }
  
      // Save updated car profile
      await car.save();
  
      // Optionally update Profile if needed
      if (carDetails) profile.carDetails = car.carDetails;
      if (carPicture) profile.carPicture = car.carPicture;
      await profile.save();
  
      res.status(200).json({
        status: true,
        message: "Car details updated successfully",
        data: car,
      });
    } catch (error) {
      console.error("Error in /updatecarDetails:", error);
      if (error.name === "ValidationError") {
        return res.status(400).json({
          status: false,
          message: "Validation error: " + error.message,
        });
      }
      res.status(500).json({
        status: false,
        message: "Server error",
        error: error.message,
      });
    }
  });
export default ownACarRoute