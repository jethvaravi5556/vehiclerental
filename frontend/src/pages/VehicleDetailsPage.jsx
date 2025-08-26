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
  const vehicleId = searchParams.get("vehicleId");

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { getVehicleById, toggleSaveVehicle, isVehicleSaved, formatPrice } =
    useVehicle();
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
          borderRadius: "10px",
          background: "#F59E0B",
          color: "#fff",
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
          borderRadius: "10px",
          background: "#10B981",
          color: "#fff",
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
          borderRadius: "10px",
          background: "#F59E0B",
          color: "#fff",
        },
      });
      navigate("/login");
      return;
    }

    if (vehicleId && vehicle?.title) {
      await toggleSaveVehicle(vehicleId, vehicle.title, "details");
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!", {
      icon: "🔗",
      style: {
        borderRadius: "10px",
        background: "#8B5CF6",
        color: "#fff",
      },
    });
  };

  const handleBackToFleet = () => {
    navigate("/vehicles");
  };

  // Show error if no vehicleId in URL
  if (!vehicleId) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 sm:pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 sm:px-6">
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Invalid Request
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            No vehicle ID provided. Please select a vehicle from our fleet.
          </p>
          <Button
            onClick={handleBackToFleet}
            className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
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
      <div className="min-h-screen flex items-center justify-center pt-16 sm:pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 sm:px-6">
        <div className="text-center">
          <LoadingSpinner size="xl" />
          <p className="mt-4 text-gray-600 font-medium text-base sm:text-lg">
            Loading vehicle details...
          </p>
        </div>
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16 sm:pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 px-4 sm:px-6">
        <div className="text-center max-w-md w-full">
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4 sm:mb-6 mx-auto">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-gray-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            Vehicle not found
          </h2>
          <p className="text-gray-600 mb-6 sm:mb-8 text-sm sm:text-base">
            The vehicle you're looking for doesn't exist or has been removed.
          </p>
          <Button
            onClick={handleBackToFleet}
            className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
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
      className="min-h-screen pt-16 sm:pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Back Button */}
        <motion.button
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleBackToFleet}
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4 sm:mb-6 lg:mb-8 font-medium bg-white px-3 sm:px-4 py-2 rounded-lg border shadow-sm hover:shadow-md transition-all duration-300 text-sm sm:text-base"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Back to Fleet</span>
          <span className="sm:hidden">Back</span>
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {/* Image Gallery */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative group"
            >
              <div className="overflow-hidden rounded-lg sm:rounded-xl shadow-lg sm:shadow-xl">
                <img
                  src={
                    vehicle.images?.[activeImageIndex] ||
                    "https://via.placeholder.com/800x500?text=Vehicle+Image"
                  }
                  alt={vehicle.title}
                  className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover group-hover:scale-105 transition-transform duration-700"
                />

                {/* Image Overlay with Actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute top-3 sm:top-6 right-3 sm:right-6 flex gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="p-2 sm:p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
                    >
                      <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-700" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleSaveVehicle}
                      className="p-2 sm:p-3 bg-white/90 rounded-full shadow-lg hover:bg-white transition-all"
                    >
                      <Heart
                        className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-300 ${
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
                    className="absolute bottom-3 sm:bottom-6 right-3 sm:right-6 bg-white/90 px-3 sm:px-4 py-2 rounded-lg shadow-lg hover:bg-white transition-all flex items-center gap-2"
                  >
                    <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="font-medium text-sm sm:text-base hidden sm:inline">
                      View Gallery
                    </span>
                    <span className="font-medium text-xs sm:hidden">
                      Gallery
                    </span>
                  </motion.button>
                </div>

                {/* Status Badge */}
                <div className="absolute top-3 sm:top-6 left-3 sm:left-6">
                  <span
                    className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg text-xs sm:text-sm font-bold shadow-lg ${
                      vehicle.available
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-red-100 text-red-800 border border-red-300"
                    }`}
                  >
                    <Zap className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    {vehicle.available ? "Available Now" : "Not Available"}
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Thumbnail Gallery */}
            {vehicle.images && vehicle.images.length > 1 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-4">
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
                      src={
                        image ||
                        "https://via.placeholder.com/200x150?text=Image"
                      }
                      alt={`${vehicle.title} ${index + 1}`}
                      className="w-full h-16 sm:h-24 object-cover"
                    />
                    {activeImageIndex === index && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 sm:h-6 sm:w-6 text-white shadow-lg" />
                      </div>
                    )}
                    <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded">
                      {index + 1}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Vehicle Info Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="bg-white shadow-lg border">
                <div className="p-4 sm:p-6">
                  {/* Header */}
                  <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full font-medium border border-blue-200 self-start">
                        <Sparkles className="inline h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                        {vehicle.type}
                      </span>
                      <div className="flex items-center space-x-2 bg-yellow-50 px-2 sm:px-3 py-1 rounded-full border border-yellow-200 self-start sm:self-auto">
                        <Star className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500 fill-current" />
                        <span className="font-bold text-gray-900 text-sm sm:text-base">
                          {vehicle.rating || "4.8"}
                        </span>
                        <span className="text-gray-600 text-xs sm:text-sm">
                          ({reviews.length} reviews)
                        </span>
                      </div>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                      {vehicle.title}
                    </h1>

                    <div className="flex items-center text-gray-600 mb-3 sm:mb-4">
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-500" />
                      <span className="font-medium text-sm sm:text-base">
                        {vehicle.location}
                      </span>
                    </div>

                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 sm:p-4 rounded-lg border text-sm sm:text-base">
                      {vehicle.description ||
                        "Experience luxury and performance with this premium vehicle. Perfect for city drives and long journeys with advanced safety features and comfortable seating."}
                    </p>
                  </div>

                  {/* Specifications */}
                  <div className="mb-4 sm:mb-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-gray-900 flex items-center">
                      <Settings className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-500" />
                      Specifications
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:gap-3">
                      {vehicle.specs?.transmission && (
                        <div className="flex items-center p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                          <Settings className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 text-sm sm:text-base block">
                              Transmission
                            </span>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {vehicle.specs.transmission}
                            </p>
                          </div>
                        </div>
                      )}
                      {vehicle.specs?.seats && (
                        <div className="flex items-center p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 text-sm sm:text-base block">
                              Seating Capacity
                            </span>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {vehicle.specs.seats} passengers
                            </p>
                          </div>
                        </div>
                      )}
                      {(vehicle.specs?.fuel || vehicle.specs?.fuelType) && (
                        <div className="flex items-center p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                          <Fuel className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-medium text-gray-900 text-sm sm:text-base block">
                              Fuel Type
                            </span>
                            <p className="text-gray-600 text-xs sm:text-sm">
                              {vehicle.specs.fuel || vehicle.specs.fuelType}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Features */}
                    {vehicle.specs?.features && (
                      <div className="mt-4 sm:mt-6">
                        <h4 className="font-medium mb-2 sm:mb-3 text-gray-900 flex items-center text-sm sm:text-base">
                          <Award className="h-3 w-3 sm:h-4 sm:w-4 mr-2 text-orange-500" />
                          Features
                        </h4>
                        <div className="flex flex-wrap gap-1 sm:gap-2">
                          {vehicle.specs.features.map((feature, index) => (
                            <span
                              key={index}
                              className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 text-xs sm:text-sm rounded-full font-medium border border-blue-200"
                            >
                              <CheckCircle className="inline h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Card */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 sm:p-6 rounded-xl border border-blue-100 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-2 sm:gap-0">
                      <div>
                        <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                          {formatPrice(vehicle.pricePerDay)}/day
                        </div>
                        {vehicle.pricePerHour && (
                          <div className="text-base sm:text-lg text-gray-600 font-medium">
                            {formatPrice(vehicle.pricePerHour)}/hour
                          </div>
                        )}
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="flex items-center gap-2 mb-1 sm:mb-2">
                          <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                          <span className="text-xs sm:text-sm text-green-600 font-bold bg-green-100 px-2 py-1 rounded-full">
                            Best Price
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" />
                          <span className="text-xs sm:text-sm text-gray-600 font-medium">
                            Premium Quality
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2 sm:space-y-3">
                      {isAuthenticated ? (
                        <>
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-base sm:text-lg py-3 font-bold"
                            size="lg"
                            disabled={!vehicle.available}
                            onClick={() =>
                              navigate(`/booking?vehicleId=${vehicle._id}`)
                            }
                          >
                            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                            {vehicle.available
                              ? "Book This Vehicle"
                              : "Currently Unavailable"}
                          </Button>
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            <Button
                              variant="outline"
                              className="border-blue-200 text-blue-600 hover:bg-blue-50 text-sm sm:text-base py-2 sm:py-3"
                              onClick={() => {
                                const phoneNumber = "919428805556"; // replace with your number
                                const message =
                                  "Hello, I would like to know more!"; // optional
                                const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
                                  message
                                )}`;
                                window.open(url, "_blank"); // opens WhatsApp chat in new tab
                              }}
                            >
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Call</span>
                              <span className="sm:hidden">Call</span>
                            </Button>

                            <Button
                              variant="outline"
                              className="border-purple-200 text-purple-600 hover:bg-purple-50 text-sm sm:text-base py-2 sm:py-3"
                              onClick={() => navigate("/user-chat")}
                            >
                              <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">Chat</span>
                              <span className="sm:hidden">Chat</span>
                            </Button>
                          </div>
                        </>
                      ) : (
                        <Button
                          className="w-full bg-blue-600 hover:bg-blue-700 text-base sm:text-lg py-3 font-bold"
                          size="lg"
                          onClick={() => navigate("/login")}
                        >
                          <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                          <span className="hidden sm:inline">
                            Login to Book Vehicle
                          </span>
                          <span className="sm:hidden">Login to Book</span>
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Trust Indicators */}
                  <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                    <div className="flex items-center text-green-800 mb-2 sm:mb-3">
                      <Shield className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="font-bold text-sm sm:text-base">
                        Secure & Trusted Platform
                      </span>
                    </div>
                    <ul className="text-xs sm:text-sm text-green-700 space-y-1 sm:space-y-2">
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        24/7 Customer Support
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        Free Cancellation Policy
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                        Secure Payment Gateway
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
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
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                  <Star className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-yellow-500" />
                  Customer Reviews
                </h3>
                <div className="flex items-center gap-2 bg-yellow-50 px-3 sm:px-4 py-2 rounded-lg border border-yellow-200 self-start sm:self-auto">
                  <Star className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 fill-current" />
                  <span className="font-bold text-lg sm:text-xl text-gray-900">
                    {vehicle.rating || "4.8"}
                  </span>
                  <span className="text-gray-600 font-medium text-sm sm:text-base">
                    ({reviews.length} reviews)
                  </span>
                </div>
              </div>

              {/* Reviews List */}
              <div className="space-y-4 sm:space-y-6">
                {reviewLoading ? (
                  <div className="flex justify-center py-6 sm:py-8">
                    <LoadingSpinner />
                  </div>
                ) : reviews.length === 0 ? (
                  <div className="text-center py-6 sm:py-8">
                    <Star className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                    <p className="text-gray-500 text-sm sm:text-base">
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
                      className="border-b border-gray-200 pb-4 sm:pb-6 last:border-b-0"
                    >
                      <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-3">
                        <div className="flex items-start sm:items-center space-x-3">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm sm:text-base">
                              {review.user?.name?.charAt(0) || "U"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base">
                              {review.user?.name || "Anonymous User"}
                            </h4>
                            <div className="flex items-center space-x-1 mt-1">
                              {[...Array(review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400 fill-current"
                                />
                              ))}
                              {[...Array(5 - review.rating)].map((_, i) => (
                                <Star
                                  key={i}
                                  className="h-3 w-3 sm:h-4 sm:w-4 text-gray-300"
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
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
                      <p className="text-gray-700 leading-relaxed bg-gray-50 p-3 sm:p-4 rounded-lg border text-sm sm:text-base">
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
                  className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200"
                >
                  <h4 className="font-bold mb-4 sm:mb-6 text-lg sm:text-xl text-gray-900 flex items-center">
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-500" />
                    Share Your Experience
                  </h4>
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Your Rating
                      </label>
                      <div className="flex space-x-1 sm:space-x-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <motion.button
                            key={star}
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            className={`text-xl sm:text-2xl transition-all ${
                              star <= reviewRating
                                ? "text-yellow-400"
                                : "text-gray-300 hover:text-yellow-300"
                            }`}
                            onClick={() => setReviewRating(star)}
                          >
                            <Star className="h-5 w-5 sm:h-6 sm:w-6" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 sm:mb-3">
                        Your Experience
                      </label>
                      <textarea
                        rows={4}
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-sm sm:text-base"
                        placeholder="Share your experience with this vehicle..."
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                    <Button
                      className="bg-blue-600 hover:bg-blue-700 px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base"
                      onClick={handleSubmitReview}
                      disabled={
                        reviewLoading ||
                        reviewRating === 0 ||
                        reviewComment.trim() === ""
                      }
                    >
                      <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
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
              className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-2 sm:p-4"
              onClick={() => setIsImageModalOpen(false)}
            >
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="relative max-w-full max-h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={
                    vehicle.images?.[activeImageIndex] ||
                    "https://via.placeholder.com/800x600?text=Vehicle+Image"
                  }
                  alt={vehicle.title}
                  className="max-w-full max-h-[90vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setIsImageModalOpen(false)}
                  className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-white/20 text-white p-2 rounded-full hover:bg-white/30 transition-all"
                >
                  <X className="h-4 w-4 sm:h-5 sm:w-5" />
                </button>

                {/* Image Navigation */}
                {vehicle.images && vehicle.images.length > 1 && (
                  <div className="absolute bottom-2 sm:bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1 sm:space-x-2">
                    {vehicle.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setActiveImageIndex(index)}
                        className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all ${
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
