import User from "../models/User.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js";
import generateOTP from "../utils/generateOTP.js";

const otpStore = new Map(); // In-memory store for OTPs

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = generateOTP();
  otpStore.set(email, otp);

  const html = `<p>Your OTP to reset password is <b>${otp}</b></p>`;

  try {
    await sendEmail(email, "Reset Your Password", html);
    console.log(`[OTP] Sent to ${email}: ${otp}`);
    res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("Email send failed:", err);
    res.status(500).json({ message: "Failed to send email" });
  }
};

export const verifyOtp = (req, res) => {
  const { email, otp } = req.body;
  const storedOtp = otpStore.get(email);

  if (!storedOtp || storedOtp !== otp) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  res.json({ message: "OTP verified" });
};

export const resetPassword = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const hashed = await bcrypt.hash(password, 10);
  user.password = hashed;
  await user.save();

  otpStore.delete(email);
  res.json({ message: "Password reset successful" });
};
