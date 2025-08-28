// ---------- controllers/authController.js ----------
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Booking from "../models/Booking.js";

const createToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "3d" });
};

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = createToken(user);

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "none" });
    res.status(201).json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = createToken(user);
    res
  .cookie("token", token, {
    httpOnly: true,
    sameSite: "none", // or "None" if cross-origin
    secure: process.env.NODE_ENV === "production",   // set to true in production with HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
  .json({ user });

    // res.status(200).json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token").json({ message: "Logged out" });
};

export const getCurrentUser = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const getSavedVehicles = async (req, res) => {
  const user = await User.findById(req.user._id).populate("savedVehicles");
  res.json(user.savedVehicles);
};

// === controllers/userController.js ===
export const toggleSaveVehicle = async (req, res) => {
  const user = await User.findById(req.user._id);
  const vehicleId = req.params.vehicleId;

  const alreadySaved = user.savedVehicles.includes(vehicleId);
  if (alreadySaved) {
    user.savedVehicles.pull(vehicleId);
  } else {
    user.savedVehicles.push(vehicleId);
  }
  await user.save();
  res.json({ success: true, saved: !alreadySaved });
};
