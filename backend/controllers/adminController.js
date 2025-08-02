import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../utils/sendEmail.js"; // adjust path as needed
import nodemailer from "nodemailer";

// Get all users (already exists)
export const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password");
  res.json(users);
};

// Change user role (already exists)
export const changeUserRole = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role: req.body.role },
    { new: true }
  );
  res.json(user);
};

// Add a new user (admin only)
export const addUser = async (req, res) => {
  const { name, email } = req.body;

  // Dummy password: Must have 1 upper, 1 lower, 1 number, 1 symbol, min 8
  const dummyPassword = "Dummy@123";
  const hashedPassword = await bcrypt.hash(dummyPassword, 10);

  try {
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: "User created", user: newUser });
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
};

// Update user (name/email)
export const updateUser = async (req, res) => {
  const { name, email } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email },
      { new: true }
    ).select("-password");
    res.json({ message: "User updated", user: updatedUser });
  } catch (error) {
    res.status(400).json({ message: "Error updating user", error });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting user", error });
  }
};

// Get all bookings (already exists)
export const getAllBookings = async (req, res) => {
  const bookings = await Booking.find().populate("vehicle user");
  res.json(bookings);
};

// controllers/adminController.js


export const sendInvoiceEmail = async (req, res) => {
  try {
    console.log("📦 req.body:", req.body);
    console.log("📄 req.file:", req.file); // This must show file details!

    const { bookingId, customerEmail, customerName } = req.body;
    const file = req.file;

    console.log("file.buffer type:", typeof file.buffer);
console.log("file.originalname:", file.originalname);
console.log("file.size:", file.size);

    // ✅ Improved error checking
    if (!file || !file.buffer || !file.originalname) {
      return res.status(400).json({ message: "Invoice file missing or invalid" });
    }

    if (!customerEmail || !bookingId) {
      return res.status(400).json({ message: "Customer email or booking ID missing" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: customerEmail,
      subject: `Invoice for Booking #${bookingId.slice(-8).toUpperCase()}`,
      html: `
        <p>Dear ${customerName || "Customer"},</p>
        <p>Attached is your invoice for booking <b>#${bookingId.slice(-8).toUpperCase()}</b>.</p>
        <p>Thank you for choosing us!</p>
      `,
      attachments: [
        {
          filename: file.originalname,
          content: file.buffer,
          contentType: "application/pdf",
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
    res.status(200).json({ success: true, message: "Email sent successfully" });
  } catch (err) {
    console.error("❌ Email send error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
