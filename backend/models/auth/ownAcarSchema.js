import mongoose from "mongoose"


const ownAcarSchema = new mongoose.Schema({
    userId:{
           type: mongoose.Schema.Types.ObjectId,
            ref: "Auth",
    },

    profileId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Profile"
    },
    picture: {
        type:String,
        required: true
    },
    driverLicense: {
        type: String, 
        required: function () {
          return this.role === "driver";
        },
      },

      carDetails: {
        model: {
          type: String,
          required: true,
        },
        product: {
          type: String,
          required: true
        },
        year: {
          type: Number,
          required: true
        },
        color: {
          type: String,
          required: true
        },
        plateNumber: {
          type: String,
          required: true
        },
      },
    
      carPicture:{
          type:String,
          required: true
      },
},   { timestamps: true })

export default mongoose.model('OwnAcar', ownAcarSchema)