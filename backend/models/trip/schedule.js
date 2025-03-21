import mongoose from "mongoose";


const scheduleSchema = new mongoose.Schema({
    time:{
        type:String,
        required: true
    },
    date: {
        type:Date,
        required: true
    },
    state: {
        type:String,
        required: true
    },
    LGA: {
        type: String,
        required: true
    },
    Address: {
        type :String,
        required: true
    }
   
}, {timestamps: true})



export default mongoose.model("Schedule", scheduleSchema)