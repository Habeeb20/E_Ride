import express from "express";
import connectDb from "./db.js";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import morgan from "morgan";
import multer from "multer";
import http from "http";
import { Server } from "socket.io";

// Import route files
import authRouter from "./routes/auth.Route.js";
import profileRoute from "./routes/profile.Route.js";
import ownACarRoute from "./routes/ownAcar.Route.js";
import ScheduleRoute from "./routes/schedule.Route.js";
import airportRoute from "./routes/airport.js";
import rideRoute from "./routes/fare.Route.js";
import deliveryRouter from "./routes/delivery.Route.js";
import ridesRouterWithIO from "./routes/eride.Route.js";
import erideRouter from "./routes/eride.Route.js";
import vehicleRoute from "./routes/rental.Route.js";



dotenv.config();

// Connect to MongoDB
connectDb();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: ["http://localhost:5173", "http://localhost:5174"], credentials: true },
});

// Middleware
app.set("timeout", 60000);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(multer().any());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(morgan("dev"));

// Root route
app.get("/", (req, res) => {
  res.send("App is listening on port...");
});

// Mount routes
app.use("/api/auth", authRouter);
app.use("/api/profile", profileRoute);
app.use("/api/ownacar", ownACarRoute);
app.use("/api/schedule", ScheduleRoute);
app.use("/api/airport", airportRoute);
app.use("/api/fare", rideRoute);
app.use("/api/delivery", deliveryRouter);
app.use('/api/rides', erideRouter(io));
app.use("/api/rentals", vehicleRoute(io)  ) 

// Socket.IO setup
io.on("connection", (socket) => {
  socket.on('joinChat', (chatId) => socket.join(chatId));
  console.log("User connected:", socket.id);

  socket.on("joinRide", (rideId) => {
    socket.join(rideId); 
    console.log(`User ${socket.id} joined ride ${rideId}`);
  });




  socket.on('joinRental', (rentalId) => {
    socket.join(rentalId);
    console.log(`User ${socket.id} joined rental ${rentalId}`);
  });
  
  // Location updates
  socket.on('locationUpdate', (data) => {
    io.to(data.rentalId).emit('locationUpdated', data);
  });
  
  // Rental status updates
  socket.on('rentalStatusUpdate', (data) => {
    io.to(data.rentalId).emit('statusUpdated', data);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});


app.set("io", io)
// Start server
const port = process.env.PORT || 2000;
server.listen(port, () => {
  console.log(`Your app is working on port ${port}`);
});


































