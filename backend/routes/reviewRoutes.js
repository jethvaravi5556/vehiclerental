import express from "express";
import { getReviewsByVehicle, postReviewForVehicle } from "../controllers/reviewController.js";
import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/vehicle/:vehicleId", getReviewsByVehicle);
router.post("/vehicle/:vehicleId", authenticate, postReviewForVehicle);

export default router;
