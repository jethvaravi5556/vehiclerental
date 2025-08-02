import Review from "../models/Review.js";

export const getReviewsByVehicle = async (req, res) => {
  try {
    const reviews = await Review.find({ vehicle: req.params.vehicleId }).populate("user", "name");
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

export const postReviewForVehicle = async (req, res) => {
  try {
    const review = await Review.create({
      user: req.user._id,
      vehicle: req.params.vehicleId,
      rating: req.body.rating,
      comment: req.body.comment,
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: "Failed to post review" });
  }
};
