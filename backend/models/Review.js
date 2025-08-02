// ---------- models/Review.js ----------
import mongoose from "mongoose";
const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  vehicle: { type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" },
  rating: Number,
  comment: String,
}, { timestamps: true });
export default mongoose.model("Review", reviewSchema);