import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import User from "../models/User.js";
import axios from "axios";

export const chatbotController = async (req, res) => {
  try {
    const prompt = req.body.prompt || req.body.message;
    const userId = req.user?._id;
    const lowerPrompt = prompt?.toLowerCase().trim();

    if (!lowerPrompt) {
      return res.json({ message: "Please type something so I can help you." });
    }

    // ✅ Rule-based replies
    if (["hi", "hello", "hey", "hii"].includes(lowerPrompt)) {
      return res.json({ message: "Hello! I'm your assistant at VehicleRent. How can I help you today?" });
    }

    if (lowerPrompt.includes("date") || lowerPrompt.includes("today")) {
      const today = new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      return res.json({ message: `Today is ${today}. Ready to rent a ride?` });
    }

    if (
      lowerPrompt.includes("my total booking") ||
      lowerPrompt.includes("how many bookings") ||
      lowerPrompt.includes("total bookings")
    ) {
      if (!userId) return res.json({ message: "Please login to check your bookings." });
      const totalBookings = await Booking.countDocuments({ user: userId });
      return res.json({ message: `You have made ${totalBookings} booking${totalBookings !== 1 ? "s" : ""}.` });
    }

    if (
      lowerPrompt.includes("my bookings") ||
      lowerPrompt.includes("booking summary") ||
      lowerPrompt.includes("check bookings")
    ) {
      if (!userId) return res.json({ message: "Please login to view your booking details." });

      const bookings = await Booking.find({ user: userId }).populate("vehicle");
      if (!bookings.length) return res.json({ message: "You have no bookings yet." });

      const summary = bookings
        .map((b) => {
          const v = b.vehicle;
          if (!v) return null;
          if (b.bookingType === "daily") {
            const start = new Date(b.startDate).toDateString();
            const end = new Date(b.endDate).toDateString();
            return `• ${v.title} (Daily): ${start} to ${end}`;
          } else {
            return `• ${v.title} (Hourly): ${b.startHour} to ${b.endHour}`;
          }
        })
        .filter(Boolean)
        .join("\n");

      return res.json({ message: `Your bookings:\n${summary}` });
    }

    if (lowerPrompt.includes("saved vehicles") || lowerPrompt.includes("wishlist")) {
      if (!userId) return res.json({ message: "Please login to view your saved vehicles." });

      const user = await User.findById(userId).populate("savedVehicles");
      if (!user?.savedVehicles?.length) return res.json({ message: "You have not saved any vehicles yet." });

      const list = user.savedVehicles.map((v) => `${v.title} (${v.type})`).join(", ");
      return res.json({ message: `You have saved: ${list}` });
    }

    if (
      lowerPrompt.includes("available") ||
      lowerPrompt.includes("how many vehicle") ||
      lowerPrompt.includes("vehicles")
    ) {
      const availableVehicles = await Vehicle.find({ available: true }).limit(5);
      if (!availableVehicles.length) return res.json({ message: "No vehicles are currently available for booking." });

      const list = availableVehicles
        .map((v) => `${v.title} - Rs.${v.pricingMode === "daily" ? v.pricePerDay + "/day" : v.pricePerHour + "/hour"}`)
        .join(", ");

      return res.json({ message: `Here are some available vehicles: ${list}` });
    }

    if (lowerPrompt.includes("price") || lowerPrompt.includes("cost") || lowerPrompt.includes("rate")) {
      return res.json({
        message:
          "Prices vary by vehicle and duration. Bikes: Rs.500–2000/day or Rs.100–300/hour. Cars: Rs.1500–5000/day or Rs.300–800/hour.",
      });
    }

    if (lowerPrompt.includes("best") || lowerPrompt.includes("top") || lowerPrompt.includes("recommend")) {
      const topVehicles = await Vehicle.find().sort({ rating: -1 }).limit(3);
      if (!topVehicles.length) return res.json({ message: "No top vehicles found right now." });

      const list = topVehicles.map((v) => `${v.title} (${v.type}) - Rating: ${v.rating}/5`).join(", ");
      return res.json({ message: `Top-rated vehicles: ${list}` });
    }

    // ✅ AI fallback via Ollama model (like gemma:2b)
    let context = "You're a helpful assistant for a Vehicle Rental service. Help users with bookings, pricing, and vehicle suggestions.";

    const categories = await Vehicle.distinct("type");
    context += ` Available vehicle types: ${categories.join(", ")}.`;

    if (userId) {
      const bookings = await Booking.find({ user: userId }).populate("vehicle");
      const user = await User.findById(userId).populate("savedVehicles");

      if (bookings.length) {
        const vehiclesBooked = bookings.map(b => b.vehicle?.title).filter(Boolean).join(", ");
        context += ` User has booked: ${vehiclesBooked}.`;
      }

      if (user?.savedVehicles?.length) {
        const saved = user.savedVehicles.map(v => v.title).join(", ");
        context += ` User has saved: ${saved}.`;
      }
    }

    const response = await axios.post("http://localhost:11434/api/generate", {
      model: "gemma:2b",
      prompt: `${context}\nUser asked: ${prompt}`,
      stream: false,
    });

    let reply = response.data?.response || "Sorry, I couldn't understand that.";
    reply = reply.replace(/\n/g, " ").trim();
    return res.json({ message: reply });
  } catch (error) {
    console.error("Chatbot error:", error.message);
    res.status(500).json({ message: "Something went wrong while generating a response." });
  }
};

