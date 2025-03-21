import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema(
  {
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
    time: {
      type: String,
      required: [true, "Time is required"],
      match: [/^(1[0-2]|0?[1-9]):([0-5][0-9]) (AM|PM)$/, "Time must be in HH:MM AM/PM format"],
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
      index: true,
    },
    lga: {
      type: String,
      required: [true, "LGA is required"],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      required: [true, "Address is required"],
      trim: true,
      minlength: [5, "Address must be at least 5 characters long"],
    },
    priceRange: {
      min: {
        type: Number,
        required: [true, "Minimum price is required"],
        min: [0, "Minimum price cannot be negative"],
      },
      max: {
        type: Number,
        required: [true, "Maximum price is required"],
        validate: {
          validator: function (value) {
            return value >= this.priceRange.min;
          },
          message: "Maximum price must be greater than or equal to minimum price",
        },
      },
    },
    driverResponse: {
      status: {
        type: String,
        enum: {
          values: ["pending", "accepted", "negotiated", "rejected"],
          message: "{VALUE} is not a valid driver response status",
        },
        default: "pending",
      },
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
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "confirmed", "completed", "canceled"],
        message: "{VALUE} is not a valid status",
      },
      default: "pending",
    },
    description: {
      type: String,
      maxlength: [200, "Description cannot exceed 200 characters"],
      trim: true,
    },
    recurrence: {
      type: String,
      enum: {
        values: ["none", "daily", "weekly", "monthly"],
        message: "{VALUE} is not a valid recurrence type",
      },
      default: "none",
    },
    duration: {
      type: Number,
      min: [1, "Duration must be at least 1 minute"],
      default: 60,
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
  },
  {
    timestamps: {
      createdAt: "scheduleCreatedAt",
      updatedAt: "scheduleUpdatedAt",
    },
  }
);

// Compound index for state and LGA filtering
scheduleSchema.index({ state: 1, lga: 1 });

// Pre-save hook to normalize state and LGA
scheduleSchema.pre("save", function (next) {
  if (this.state) this.state = this.state.charAt(0).toUpperCase() + this.state.slice(1).toLowerCase();
  if (this.lga) this.lga = this.lga.charAt(0).toUpperCase() + this.lga.slice(1).toLowerCase();
  next();
});

// Virtual field for formatted schedule time
scheduleSchema.virtual("formattedTime").get(function () {
  return `${this.date.toDateString()} at ${this.time}`;
});

// Ensure virtuals are included in toJSON and toObject
scheduleSchema.set("toJSON", { virtuals: true });
scheduleSchema.set("toObject", { virtuals: true });

export default mongoose.model("Schedule", scheduleSchema);