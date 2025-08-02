// ---------- models/Vehicle.js ----------
import mongoose from "mongoose";
const vehicleSchema = new mongoose.Schema({
  title: String,
  brand: String,
  type: String,
  pricingMode: { type: String, enum: ["hourly", "daily"], default: "daily" },
  pricePerDay: Number,
  pricePerHour: Number,
  specs: Object,
  images: [String],
  available: { type: Boolean, default: true },
  location: String,
  rating: { type: Number, default: 0 },
}, { timestamps: true });
export default mongoose.model("Vehicle", vehicleSchema);