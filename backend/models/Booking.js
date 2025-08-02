// ---------- models/Booking.js ----------
import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  bookingType: { type: String, enum: ["hourly", "daily"], required: true },
  
  // Daily booking
  startDate: Date,
  endDate: Date,

  // Hourly booking
  startHour: String, // "HH:mm" format
  endHour: String,

  pickupLocation: String,
  dropLocation: String,

  status: {
    type: String,
    enum: ["confirmed", "cancelled", "completed"],
    default: "confirmed"
  },

  amountPaid: Number,
}, { timestamps: true });

export default mongoose.model("Booking", bookingSchema);
