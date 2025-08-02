// === backend/routes/authRoutes.js ===
import express from "express";
import jwt from "jsonwebtoken";
import passport from "passport";
import {
  register,
  login,
  logout,
  getCurrentUser,
  getSavedVehicles, toggleSaveVehicle
} from "../controllers/authController.js";
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from "../controllers/passwordResetController.js";
import { authenticate } from "../middlewares/authMiddleware.js";
// import { getSavedVehicles, toggleSaveVehicle, getMyBookings } from "../controllers/userController.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/me", getCurrentUser);


router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.get("/saved", authenticate, getSavedVehicles);
router.post("/toggle-save/:vehicleId", authenticate, toggleSaveVehicle);
// router.get("/bookings", authenticate, getMyBookings);

// --- Google Auth Routes ---
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
      expiresIn: "3d",
    });

    res.cookie("token", token, {
  httpOnly: true,
  secure: false,        // true in production (HTTPS)
  sameSite: "Lax",      // "None" for cross-origin
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
res.redirect("http://localhost:5173"); // ✅ redirect safely

  }
);

export default router;