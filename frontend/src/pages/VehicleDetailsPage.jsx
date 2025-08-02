import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Star,
  Heart,
  MapPin,
  Users,
  Fuel,
  Settings,
  Calendar,
  ArrowLeft,
  Shield,
  Award,
  CheckCircle,
  Clock,
  Phone,
  MessageCircle,
  Share2,
  Camera,
  Zap,
  TrendingUp,
  X,
  Sparkles,
} from "lucide-react";
import { useVehicle } from "../contexts/VehicleContext";
import { useAuth } from "../contexts/AuthContext";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import axios from "../axiosConfig";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

const VehicleDetailsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicleId');
  
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { getVehicleById, toggleSaveVehicle, isVehicleSaved, formatPrice } = useVehicle();
  const { isAuthenticated } = useAuth();

  const [reviews, setReviews] = useState([]);
  const [reviewLoading, setReviewLoading] = useState(true);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");

  const fetchReviews = async () => {
    if (!vehicleId) return;
    try {
      const res = await axios.get(`/api/reviews/vehicle/${vehicleId}`);
      setReviews(res.data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setReviewLoading(false);
    }
  };

  const fetchVehicleDetails = async () => {
    if (!vehicleId) {
      setLoading(false);
      return;
    }
    
    try {
      const vehicleData = await getVehicleById(vehicleId);
      if (vehicleData) {
        setVehicle(vehicleData);
      }
    } catch (error) {
      console.error("Failed to fetch vehicle details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to submit a review", {
        icon: "🔒",
        style: {
          borderRadius: '10px',
          background: '#F59E0B',
          color: '#fff',
        },
      });
      navigate("/login");
      return;
    }

    if (!vehicleId) return;

    try {
      setReviewLoading(true);
      await axios.post(`/api/reviews/vehicle/${vehicleId}`, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewComment("");
      setReviewRating(0);
      fetchReviews();
      toast.success("Review submitted successfully!", {
        icon: "⭐",
        style: {
          borderRadius: '10px',
          background: '#10B981',
          color: '#fff',
        },
      });
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    if (vehicleId) {
      fetchVehicleDetails();
      fetchReviews();
    }
  }, [vehicleId]);

  const handleSaveVehicle = async () => {
    if (!isAuthenticated) {
      toast.error("Please login to save vehicles", {
        icon: "🔒",
        style: {
          borderRadius: '10px',
          background: '#F59E0B',
          color: '#fff',
        },
      });
      navigate("/login");
      return;
    }

    if (vehicleId && vehicle?.title) {
      await toggleSaveVehicle(vehicleId, vehicle.title, 'details');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!", {
      icon: "🔗",
      style: {
        borderRadius: '10px',
        background: '#8B5CF6',
        color: '#fff',
      },
    });
  };

  const handleBackToFleet = () => {
    navigate("/vehicles");
  };

  // Show error if no vehicleId in URL
  if (!vehicleId) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Shield className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Invalid Request
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            No vehicle ID provided. Please select a vehicle from our fleet.
          </p>
          <Button
            onClick={handleBackToFleet}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Browse Vehicles
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 font-medium text-lg">
            Loading vehicle details...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="text-center">
          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6 mx-auto">
            <Shield className="h-16 w-16 text-gray-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vehicle not found
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The vehicle you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={handleBackToFleet}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Fleet
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToFleet}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium bg-white px-4 py-2 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Fleet</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative group"
            >
              <div className="overflow-hidden rounded-xl shadow-xl">
                <img
                  src={
                    vehicle.images?.[activeImageIndex] ||
                    "https://via.placeholder.com/800x500?text=Vehicle+Image"
                  }
                  alt={vehicle.title}
                  className="w-full h-96 lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Image Overlay with Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-6 right-6 flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
                    >
                      <Share2 className="h-5 w-5 text-gray-700" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSaveVehicle}
                      className="p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
                    >
                      <Heart
                        className={`h-5 w-5 transition-all duration-300 ${
                          isVehicleSaved(vehicleId)
                            ? "text-red-500 fill-current"
                            : "text-gray-700 hover:text-red-500"
                        }`}
                      />
                    </motion.button>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsImageModalOpen(true)}
                    className="absolute bottom-6 right-6 bg-white/90 px-4 py-2 rounded-lg shadow-lg hover:bg-white transition-all flex items-center gap-2"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="font-medium">View Gallery</span>
                  </motion.button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-6 left-6">
                  <span
                    className={`px-4 py-2 rounded-lg text-sm font-bold shadow-lg ${
                      vehicle.available
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    <Zap className="inline h-4 w-4 mr-2" />
                    {vehicle.available ? "Available Now" : "Not Available"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Thumbnail Gallery */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {vehicle.images.map((image, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveImageIndex(index)}
                    className={`relative rounded-lg overflow-hidden shadow-md transition-all border-2 ${
                      activeImageIndex === index
                        ? "ring-2 ring-blue-500 shadow-lg border-blue-500"
                        : "hover:shadow-lg border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <img
                      src={image || "https://via.placeholder.com/200x150?text=Image"}
                      alt={`${vehicle.title} ${index + 1}`}
                      className="w-full h-24 object-cover"
                    />
                    {activeImageIndex === index && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-white shadow-lg" />
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Info Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-white shadow-lg border">
                <div className="p-6">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium border border-blue-200">
                        <Sparkles className="inline h-4 w-4 mr-1" />
                        {vehicle.type}
                      </span>
                      <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-1 rounded-full border border-yellow-200">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900">
                          {vehicle.rating || "4.8"}
                        </span>
                        <span className="text-gray-600 text-sm">
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    </div>

                    <h1 className="text-3xl font-bold text-gray-900 mb-3">
                      {vehicle.title}
                    </h1>

                    <div className="flex items-center text-gray-600 mb-4">
                      <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                      <span className="font-medium">{vehicle.location}</span>
                    </div>

                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                      {vehicle.description ||
                        "Experience luxury and performance with this premium vehicle. Perfect for city drives and long journeys with advanced safety features and comfortable seating."}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="mb-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-900 flex items-center">
                      <Settings className="h-5 w-5 mr-2 text-purple-500" />
                      Specifications
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                      {vehicle.specs?.transmission && (
                        <div className="flex items-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <Settings className="h-5 w-5 text-purple-500 mr-3" />
                          <div>
                            <span className="font-medium text-gray-900">
                              Transmission
                            </span>
                            <p className="text-gray-600 text-sm">
                              {vehicle.specs.transmission}
                            </p>
                          </div>
                        </div>
                      )}
                      {vehicle.specs?.seats && (
                        <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <Users className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <span className="font-medium text-gray-900">
                              Seating Capacity
                            </span>
                            <p className="text-gray-600 text-sm">
                              {vehicle.specs.seats} passengers
                            </p>
                          </div>
                        </div>
                      )}
                      {(vehicle.specs?.fuel || vehicle.specs?.fuelType) && (
                        <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-200">
                          <Fuel className="h-5 w-5 text-green-500 mr-3" />
                          <div>
                            <span className="font-medium text-gray-900">
                              Fuel Type
                            </span>
                            <p className="text-gray-600 text-sm">
                              {vehicle.specs.fuel || vehicle.specs.fuelType}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {vehicle.specs?.features && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-3 text-gray-900 flex items-center">
                          <Award className="h-4 w-4 mr-2 text-orange-500" />
                          Features
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {vehicle.specs.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium border border-blue-200"
                            >
                              <CheckCircle className="inline h-3 w-3 mr-1" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-100 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-3xl font-bold text-blue-600">
                          {formatPrice(vehicle.pricePerDay)}/day
                        </div>
                        {vehicle.pricePerHour && (
                          <div className="text-lg text-gray-600 font-medium">
                            {formatPrice(vehicle.pricePerHour)}/hour
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">
                            Best Price
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-yellow-500" />
                          <span className="text-sm text-gray-600 font-medium">
                            Premium Quality
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                      {isAuthenticated ? (
                        <>
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 font-bold"
                            size="lg"
                            disabled={!vehicle.available}
                            onClick={() =>
                              navigate(`/booking?vehicleId=${vehicle._id}`)
                            }
                          >
                            <Calendar className="h-5 w-5 mr-2" />
                            {vehicle.available ? "Book This Vehicle" : "Currently Unavailable"}
                          </Button>
                          <div className="grid grid-cols-2 gap-3">
                            <Button
                              variant="outline"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Phone className="h-4 w-4 mr-2" />
                              Call
                            </Button>
                            <Button
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50"
                              onClick={() => navigate("/chatwidget")}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-3 font-bold"
                          size="lg"
                          onClick={() => navigate("/login")}
                        >
                          <Shield className="h-5 w-5 mr-2" />
                          Login to Book Vehicle
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-800 mb-3">
                      <Shield className="h-5 w-5 mr-2" />
                      <span className="font-bold">Secure & Trusted Platform</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        24/7 Customer Support
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Free Cancellation Policy
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Secure Payment Gateway
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verified Vehicle & Owner
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Reviews Section */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white shadow-lg border">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Star className="h-6 w-6 mr-2 text-yellow-500" />
                  Customer Reviews
                </h3>
                <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="font-bold text-xl text-gray-900">
                    {vehicle.rating || "4.8"}
                  </span>
                  <span className="text-gray-600 font-medium">
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-6">
                {reviewLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No reviews yet. Be the first to leave one!
                    </p>
                  </div>
                ) : (
                  reviews.map((review, index) => (
                    <motion.div
                      key={review._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border-b border-gray-200 pb-6 last:border-b-0"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {review.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">
                              {review.user?.name || "Anonymous User"}
                            </h4>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 text-yellow-400 fill-current"
                                />
                              ))}
                              {[...Array(5 - review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-4 w-4 text-gray-300"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border">
                        {review.comment}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Review Form */}
              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 pt-6 border-t border-gray-200"
                >
                  <h4 className="font-bold mb-6 text-xl text-gray-900 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-purple-500" />
                    Share Your Experience
                  </h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Your Rating
                      </label>
                      <div className="flex space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className={`text-2xl transition-all ${
                              star <= reviewRating
                                ? "text-yellow-400"
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                            onClick={() => setReviewRating(star)}
                          >
                            <Star className="h-6 w-6" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Your Experience
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                        placeholder="Share your experience with this vehicle..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 px-6 py-3"
                      onClick={handleSubmitReview}
                      disabled={
                        reviewLoading ||
                        reviewRating === 0 ||
                        reviewComment.trim() === ""
                      }
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Submit Review
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Image Modal */}
        <AnimatePresence>
          {isImageModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
              onClick={() => setIsImageModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative max-w-6xl max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={
                    vehicle.images?.[activeImageIndex] || 
                    "https://via.placeholder.com/800x600?text=Vehicle+Image"
                  }
                  alt={vehicle.title}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="absolute top-4 right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
                
                {/* Image Navigation */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {vehicle.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-3 h-3 rounded-full transition-all ${
                          index === activeImageIndex
                            ? "bg-white"
                            : "bg-white/50 hover:bg-white/75"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default VehicleDetailsPage;