import mongoose from "mongoose";

const airportSchema = new mongoose.Schema({
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Auth",
          required: true,
          index: true,
        },
        profileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Profile",
          required: true,
          index: true,
        },
    
   state: {
    type:String,
    required: true
   },
   airportName : {
        type:String,
        required: true
   },
   homeAddress:{
    type:String,
    required: true
   },

   status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
   pickupOrdropoff:{
    type:String,
    required: true
   },
   date:{
    type:String,
    required: true
   },
   time: {
    type: String,
    required: true
   },
     driverResponse: {
     
       driverId: { type: mongoose.Schema.Types.ObjectId, ref: "Auth" },
        
       negotiatedPrice: {
         type: Number,
         min: [0, "Negotiated price cannot be negative"],
         default: null,
       },
       driverId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Auth",
         default: null,
       },
       driverProfileId: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Profile",
         default: null,
       },
 
       chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, 
     },

     chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" }, 


   status: {
    type: String,
    enum: {
      values: ["pending", "confirmed", "completed", "canceled"],
      message: "{VALUE} is not a valid status",
    },
    default: "pending",
   }, 

   isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },

     createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
        required: true,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Auth",
      },
}, {timestamps: true})


export default mongoose.model("Airport", airportSchema)