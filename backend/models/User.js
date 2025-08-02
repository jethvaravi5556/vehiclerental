import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    savedVehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Vehicle" }],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);