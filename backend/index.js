import express from "express"
import connectDb from "./db.js"
import dotenv from "dotenv"
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";

import morgan from "morgan";
import multer from "multer";
import authRouter from "./routes/auth.Route.js";
import profileRoute from "./routes/profile.Route.js";
import ownACarRoute from "./routes/ownAcar.Route.js";


dotenv.config()
connectDb()


const app = express()


app.set("timeout", 60000);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(multer().any());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true, 
}));
app.use(bodyParser.json());
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("app is listening on port....")
  })
  

app.use("/api/auth", authRouter)
app.use("/api/profile", profileRoute)
app.use("/api/ownacar", ownACarRoute)
  

const port= process.env.PORT || 2000

app.listen(port, () => {
    console.log(`your app is working on port ${port}`)
})
