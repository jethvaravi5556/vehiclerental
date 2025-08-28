import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";

const isTimeOverlap = (start1, end1, start2, end2) => {
  return !(end1 <= start2 || start1 >= end2);
};

export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();

    // attach rating + reviewCount
    const vehiclesWithReviews = await Promise.all(
      vehicles.map(async (vehicle) => {
        const reviews = await Review.find({ vehicle: vehicle._id });
        const reviewCount = reviews.length;
        const avgRating =
          reviewCount > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
            : 0;

        return {
          ...vehicle.toObject(),
          reviewCount,
          rating: avgRating,
        };
      })
    );

    res.json(vehiclesWithReviews);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch vehicles" });
  }
};
// export const getVehicleById = async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id);
//   res.json(vehicle);
// };

import Review from "../models/Review.js";

export const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) return res.status(404).json({ message: "Vehicle not found" });

    // Count reviews for this vehicle
    const reviewCount = await Review.countDocuments({ vehicle: vehicle._id });

    // Average rating
    const reviews = await Review.find({ vehicle: vehicle._id });
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    res.json({
      ...vehicle.toObject(),
      reviewCount,
      rating: avgRating || vehicle.rating, // fallback to vehicle.rating
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


export const createVehicle = async (req, res) => {
  const vehicle = new Vehicle(req.body);
  await vehicle.save();
  res.status(201).json(vehicle);
};

export const updateVehicle = async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(vehicle);
};

export const deleteVehicle = async (req, res) => {
  await Vehicle.findByIdAndDelete(req.params.id);
  res.json({ message: "Vehicle deleted" });
};

// ✅ Get available vehicles
export const getAvailableVehicles = async (req, res) => {
  try {
    const { bookingType, startDate, endDate, startHour, endHour, location } = req.query;

    if (!bookingType || (bookingType === "daily" && (!startDate || !endDate)) ||
        (bookingType === "hourly" && (!startHour || !endHour))) {
      return res.status(400).json({ message: "Missing booking filters" });
    }

    let bookedVehicleIds = new Set();
    const bookings = await Booking.find({ status: "confirmed" });

    for (const booking of bookings) {
      if (booking.bookingType !== bookingType) continue;

      if (bookingType === "daily") {
        const reqStart = new Date(startDate);
        const reqEnd = new Date(endDate);
        const bStart = new Date(booking.startDate);
        const bEnd = new Date(booking.endDate);
        if (isTimeOverlap(reqStart, reqEnd, bStart, bEnd)) {
          bookedVehicleIds.add(booking.vehicle.toString());
        }
      } else if (bookingType === "hourly") {
        const [rStartH, rStartM] = startHour.split(":").map(Number);
        const [rEndH, rEndM] = endHour.split(":").map(Number);
        const rStart = rStartH * 60 + rStartM;
        const rEnd = rEndH * 60 + rEndM;

        const [bStartH, bStartM] = booking.startHour.split(":").map(Number);
        const [bEndH, bEndM] = booking.endHour.split(":").map(Number);
        const bStart = bStartH * 60 + bStartM;
        const bEnd = bEndH * 60 + bEndM;

        if (isTimeOverlap(rStart, rEnd, bStart, bEnd)) {
          bookedVehicleIds.add(booking.vehicle.toString());
        }
      }
    }

    const filter = {
      _id: { $nin: Array.from(bookedVehicleIds) },
    };
    if (location) filter.location = location;

    const availableVehicles = await Vehicle.find(filter);
    res.json(availableVehicles);
  } catch (err) {
    console.error("Error fetching available vehicles", err);
    res.status(500).json({ message: "Server error" });
  }
};
