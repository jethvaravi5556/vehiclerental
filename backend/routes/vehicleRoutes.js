// ---------- routes/vehicleRoutes.js ----------
import express from "express";
import { authenticate } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";
import {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableVehicles
} from "../controllers/vehicleController.js";

const router = express.Router();

router.get("/", getAllVehicles);
router.get("/available", getAvailableVehicles); // ✅ NEW ROUTE
router.get("/:id", getVehicleById);
router.post("/", authenticate, authorizeRoles("admin"), createVehicle);
router.put("/:id", authenticate, authorizeRoles("admin"), updateVehicle);
router.delete("/:id", authenticate, authorizeRoles("admin"), deleteVehicle);

export default router;
