import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Heart, 
  Star, 
  Trash2, 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Fuel, 
  Settings,
  Filter,
  Grid,
  List,
  RefreshCw,
  Eye,
  BookOpen,
  Sparkles,
  TrendingUp,
  Award,
  Shield,
  Clock,
  ChevronDown,
  X,
  SortAsc,
  Zap,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import { useVehicle } from "../contexts/VehicleContext";
import { useAuth } from "../contexts/AuthContext";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
const SavedVehiclesPage = () => {
  const navigate = useNavigate();
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: "",
    brand: "",
    location: "",
    priceMin: "",
    priceMax: "",
    rating: ""
  });

  const { 
    formatPrice, 
    toggleSaveVehicle, 
    savedVehiclesData, 
    fetchSavedVehicles,
    getVehicleAvailability,
    isVehicleSaved,
    getSavedVehicleCount,
    clearAllSavedVehicles
  } = useVehicle();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSavedVehiclesData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    filterAndSortVehicles();
  }, [savedVehiclesData, searchTerm, filters, sortBy, sortOrder]);

  const fetchSavedVehiclesData = async () => {
    try {
      setLoading(true);
      await fetchSavedVehicles();
    } catch (error) {
      console.error("Error fetching saved vehicles:", error);
      toast.error("Failed to load saved vehicles", {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromSaved = async (vehicleId, vehicleTitle) => {
    try {
      const result = await toggleSaveVehicle(vehicleId, vehicleTitle);
      
      if (result.success) {
        // The context will handle updating the savedVehiclesData
        // No need to manually filter here as it's handled in the context
      }
    } catch (error) {
      console.error("Failed to remove vehicle:", error);
      toast.error("Failed to remove vehicle", {
        icon: "❌",
        style: {
          borderRadius: '12px',
          background: '#EF4444',
          color: '#fff',
        },
      });
    }
  };

  const filterAndSortVehicles = () => {
    let filtered = [...savedVehiclesData];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(vehicle =>
        vehicle.title?.toLowerCase().includes(search) ||
        vehicle.brand?.toLowerCase().includes(search) ||
        vehicle.type?.toLowerCase().includes(search) ||
        vehicle.location?.toLowerCase().includes(search)
      );
    }

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(vehicle => 
        vehicle.type?.toLowerCase() === filters.type.toLowerCase()
      );
    }

    if (filters.brand) {
      filtered = filtered.filter(vehicle => 
        vehicle.brand?.toLowerCase() === filters.brand.toLowerCase()
      );
    }

    if (filters.location) {
      filtered = filtered.filter(vehicle => 
        vehicle.location?.toLowerCase().includes(filters.location.toLowerCase())
      );
    }

    if (filters.priceMin) {
      filtered = filtered.filter(vehicle => 
        (vehicle.pricePerDay || 0) >= filters.priceMin
      );
    }

    if (filters.priceMax) {
      filtered = filtered.filter(vehicle => 
        (vehicle.pricePerDay || 0) <= filters.priceMax
      );
    }

    if (filters.rating) {
      filtered = filtered.filter(vehicle => 
        (vehicle.rating || 0) >= filters.rating
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortBy] || "";
      let bValue = b[sortBy] || "";

      if (sortBy === "pricePerDay" || sortBy === "rating") {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredVehicles(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      type: "",
      brand: "",
      location: "",
      priceMin: "",
      priceMax: "",
      rating: ""
    });
    setSearchTerm("");
  };

  const getUniqueValues = (key) => {
    return [...new Set(savedVehiclesData.map(v => v[key]).filter(Boolean))];
  };

  const handleRefresh = async () => {
    await fetchSavedVehiclesData();
    toast.success("Saved vehicles refreshed!", {
      icon: "✨",
      style: {
        borderRadius: '12px',
        background: '#8B5CF6',
        color: '#fff',
      },
    });
  };

  const handleClearAll = async () => {
    if (window.confirm("Are you sure you want to remove all saved vehicles?")) {
      await clearAllSavedVehicles();
    }
  };

  const handleVehicleClick = (vehicleId) => {
    navigate(`/vehicle-details?vehicleId=${vehicleId}`);
  };

  const handleBookingClick = (vehicleId, e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error("Please login to book vehicles", {
        icon: "🔒",
        style: {
          borderRadius: '12px',
          background: '#F59E0B',
          color: '#fff',
        },
      });
      navigate("/login");
      return;
    }
    navigate(`/booking?vehicleId=${vehicleId}`);
  };

  const handleBackToFleet = () => {
    navigate("/vehicles");
  };

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return (
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20"
      >
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-12 border border-white/20">
            <Heart className="h-24 w-24 text-blue-500 mx-auto mb-6" />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Please Login</h1>
            <p className="text-xl text-gray-600 mb-8">
              You need to login to view your saved vehicles
            </p>
            <Button
              onClick={() => navigate("/login")}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-3 text-lg"
            >
              Login Now
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 pt-20"
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

        {/* Simple Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="relative">
              <div className="relative">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent mb-2 flex items-center">
                  My Saved Vehicles
                  {/* <Heart className="inline-block h-8 w-8 ml-3 from-blue-600 to-purple-700 fill-current" /> */}
                </h1>
                <p className="text-lg text-gray-600 mb-4">
                  Your carefully curated collection of favorite vehicles
                </p>
                <div className="flex items-center gap-6 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{getSavedVehicleCount()} saved vehicles</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">Quick access favorites</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">Personal collection</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleRefresh}
                  className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </motion.div>
              {getSavedVehicleCount() > 0 && (
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={handleClearAll}
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 shadow-lg"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Controls */}
          <Card className="bg-white shadow-lg border">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search your saved vehicles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-base placeholder-gray-400"
                  />
                </div>

                {/* Controls */}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode("grid")}
                      className={`p-3 rounded-lg transition-all ${
                        viewMode === "grid"
                          ? "bg-white shadow-lg text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Grid className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setViewMode("list")}
                      className={`p-3 rounded-lg transition-all ${
                        viewMode === "list"
                          ? "bg-white shadow-lg text-blue-600"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <List className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field);
                      setSortOrder(order);
                    }}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-700 font-medium min-w-[200px] shadow-sm"
                  >
                    <option value="title-asc">Name A-Z</option>
                    <option value="title-desc">Name Z-A</option>
                    <option value="pricePerDay-asc">Price Low-High</option>
                    <option value="pricePerDay-desc">Price High-Low</option>
                    <option value="rating-desc">Highest Rated</option>
                    <option value="brand-asc">Brand A-Z</option>
                  </select>

                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={() => setShowFilters(!showFilters)}
                      className="bg-gray-700 hover:bg-gray-800 shadow-lg px-6 py-3"
                    >
                      <Filter className="h-5 w-5 mr-2" />
                      Filters
                      <ChevronDown
                        className={`h-4 w-4 ml-2 transition-transform ${
                          showFilters ? "rotate-180" : ""
                        }`}
                      />
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-center gap-4">
                  <p className="text-gray-600 font-medium text-lg">
                    Showing{" "}
                    <span className="text-blue-600 font-bold text-xl">
                      {filteredVehicles.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-blue-600 font-bold text-xl">
                      {savedVehiclesData.length}
                    </span>{" "}
                    saved vehicles
                  </p>
                </div>
                {(searchTerm || Object.values(filters).some(f => f)) && (
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      onClick={clearFilters}
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 hover:border-red-300 shadow-sm"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Clear Filters
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-8"
            >
              <Card className="bg-white shadow-lg border">
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Filter className="h-6 w-6 mr-3 text-blue-500" />
                    Advanced Filters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Vehicle Type
                      </label>
                      <select
                        value={filters.type}
                        onChange={(e) => handleFilterChange("type", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      >
                        <option value="">All Types</option>
                        {getUniqueValues("type").map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Brand
                      </label>
                      <select
                        value={filters.brand}
                        onChange={(e) => handleFilterChange("brand", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      >
                        <option value="">All Brands</option>
                        {getUniqueValues("brand").map(brand => (
                          <option key={brand} value={brand}>{brand}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Location
                      </label>
                      <select
                        value={filters.location}
                        onChange={(e) => handleFilterChange("location", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      >
                        <option value="">All Locations</option>
                        {getUniqueValues("location").map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Min Rating
                      </label>
                      <select
                        value={filters.rating}
                        onChange={(e) => handleFilterChange("rating", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      >
                        <option value="">Any Rating</option>
                        <option value="4.5">⭐ 4.5+ Excellent</option>
                        <option value="4.0">⭐ 4.0+ Very Good</option>
                        <option value="3.5">⭐ 3.5+ Good</option>
                        <option value="3.0">⭐ 3.0+ Average</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Min Price (Per Day)
                      </label>
                      <input
                        type="number"
                        placeholder="Minimum price"
                        value={filters.priceMin}
                        onChange={(e) => handleFilterChange("priceMin", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Max Price (Per Day)
                      </label>
                      <input
                        type="number"
                        placeholder="Maximum price"
                        value={filters.priceMax}
                        onChange={(e) => handleFilterChange("priceMax", e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-all"
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="mt-4 text-gray-600 font-medium text-lg">
                Loading your saved vehicles...
              </p>
            </div>
          </div>
        ) : savedVehiclesData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Card className="bg-white shadow-lg border max-w-2xl mx-auto">
              <div className="p-12">
                <div className="relative mx-auto w-32 h-32 mb-8">
                  <Heart className="h-20 w-20 text-blue-400 mx-auto mt-6" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-4">No saved vehicles yet</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Start exploring our amazing collection and save your favorite vehicles for quick access. 
                  Click the heart icon on any vehicle to add it to your personal collection.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => navigate("/vehicles")}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 text-lg"
                  >
                    <Sparkles className="h-5 w-5 mr-2" />
                    Explore Vehicles
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ) : filteredVehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <Card className="bg-white shadow-lg border max-w-2xl mx-auto">
              <div className="p-12">
                <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">No vehicles match your filters</h3>
                <p className="text-gray-600 mb-8 text-lg">
                  Try adjusting your search criteria or clearing the filters to see more results.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={clearFilters}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg px-6 py-3"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Filters
                  </Button>
                </motion.div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                : "space-y-8"
            }
          >
            <AnimatePresence>
              {filteredVehicles.map((vehicle, index) => (
                <SavedVehicleCard
                  key={vehicle._id}
                  vehicle={vehicle}
                  index={index}
                  viewMode={viewMode}
                  onClick={() => handleVehicleClick(vehicle._id)}
                  onBookClick={(e) => handleBookingClick(vehicle._id, e)}
                  onRemoveClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromSaved(vehicle._id, vehicle.title);
                  }}
                  formatPrice={formatPrice}
                  getVehicleAvailability={getVehicleAvailability}
                  isAuthenticated={isAuthenticated}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

// Enhanced Saved Vehicle Card Component
const SavedVehicleCard = ({
  vehicle,
  index,
  viewMode,
  onClick,
  onBookClick,
  onRemoveClick,
  formatPrice,
  getVehicleAvailability,
  isAuthenticated,
}) => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: index * 0.1,
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: { opacity: 0, y: -20 },
  };

  const handleClick = (e) => {
    e.preventDefault();
    onClick();
  };

  if (viewMode === "list") {
    return (
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        whileHover={{ y: -4, scale: 1.01 }}
        onClick={handleClick}
        className="cursor-pointer group"
      >
        <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden border">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
              {vehicle.images && vehicle.images[0] ? (
                <img
                  src={vehicle.images[0]}
                  alt={vehicle.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <Search className="h-16 w-16 text-white/80" />
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg ${
                    vehicle.available
                      ? "bg-green-100/95 text-green-800 border-green-300"
                      : "bg-red-100/95 text-red-800 border-red-300"
                  }`}
                >
                  <Zap className="inline h-3 w-3 mr-1" />
                  {getVehicleAvailability(vehicle)}
                </span>
              </div>

              {/* Rating Badge */}
              {vehicle.rating && (
                <div className="absolute top-4 left-4">
                  <div className="flex items-center bg-white/95 backdrop-blur-md px-3 py-1 rounded-full shadow-lg border border-white/30">
                    <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                    <span className="text-sm font-bold text-gray-800">
                      {vehicle.rating}
                    </span>
                  </div>
                </div>
              )}

              {/* Remove Button */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onRemoveClick}
                className="absolute bottom-4 right-4 p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all border border-red-400 group/remove"
              >
                <Trash2 className="h-5 w-5" />
              </motion.button>
            </div>

            <div className="md:w-2/3 p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {vehicle.title}
                  </h3>
                  <p className="text-gray-600 flex items-center text-lg">
                    <MapPin className="h-5 w-5 mr-2 text-blue-500" />
                    {vehicle.location}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatPrice(vehicle.pricePerDay)}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    per day
                  </div>
                </div>
              </div>

              <div className="flex items-center mb-6">
                <span className="text-lg bg-gray-100 text-gray-700 px-4 py-2 rounded-full font-medium shadow-inner border border-gray-300">
                  {vehicle.brand} • {vehicle.type}
                </span>
              </div>

              {/* Specs */}
              {vehicle.specs && (
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {vehicle.specs.seats && (
                    <div className="flex items-center text-gray-600 bg-blue-50 px-4 py-3 rounded-xl border border-blue-200">
                      <Users className="h-5 w-5 mr-3 text-blue-500" />
                      <span className="font-medium">{vehicle.specs.seats} seats</span>
                    </div>
                  )}
                  {vehicle.specs.fuel && (
                    <div className="flex items-center text-gray-600 bg-green-50 px-4 py-3 rounded-xl border border-green-200">
                      <Fuel className="h-5 w-5 mr-3 text-green-500" />
                      <span className="font-medium">{vehicle.specs.fuel}</span>
                    </div>
                  )}
                  {vehicle.specs.transmission && (
                    <div className="flex items-center text-gray-600 bg-purple-50 px-4 py-3 rounded-xl col-span-2 border border-purple-200">
                      <Settings className="h-5 w-5 mr-3 text-purple-500" />
                      <span className="font-medium">
                        {vehicle.specs.transmission}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {vehicle.pricePerHour && (
                    <span className="text-sm bg-blue-100 text-blue-800 px-3 py-2 rounded-full font-medium border border-blue-200">
                      <Clock className="h-4 w-4 inline mr-1" />
                      {formatPrice(vehicle.pricePerHour)}/hr
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="border-blue-200 text-blue-600 hover:border-blue-300 hover:bg-blue-50 shadow-lg"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      onClick={onBookClick}
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all"
                      disabled={!vehicle.available}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      {vehicle.available ? "Book Now" : "Not Available"}
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      className="cursor-pointer group"
    >
      <Card className="bg-white shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden h-full border">
        <div className="relative h-56 overflow-hidden">
          {vehicle.images && vehicle.images[0] ? (
            <img
              src={vehicle.images[0]}
              alt={vehicle.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <Search className="h-12 w-12 text-white/80" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg ${
                vehicle.available
                  ? "bg-green-100/95 text-green-800 border-green-300"
                  : "bg-red-100/95 text-red-800 border-red-300"
              }`}
            >
              <Zap className="inline h-3 w-3 mr-1" />
              {getVehicleAvailability(vehicle)}
            </span>
          </div>

          {/* Rating Badge */}
          {vehicle.rating && (
            <div className="absolute top-3 left-3">
              <div className="flex items-center bg-white/95 backdrop-blur-md px-2 py-1 rounded-full shadow-lg border border-white/30">
                <Star className="h-3 w-3 text-yellow-500 fill-current mr-1" />
                <span className="text-xs font-bold">{vehicle.rating}</span>
              </div>
            </div>
          )}

          {/* Remove Button */}
          <motion.button
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.9 }}
            onClick={onRemoveClick}
            className="absolute bottom-3 right-3 p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-all border border-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </motion.button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors">
              {vehicle.title}
            </h3>
            <p className="text-gray-600 flex items-center">
              <MapPin className="h-4 w-4 mr-1 text-blue-500" />
              {vehicle.location}
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm bg-gray-100 text-gray-700 px-3 py-1 rounded-full font-medium shadow-inner border border-gray-300">
              {vehicle.brand} • {vehicle.type}
            </span>
          </div>

          {/* Specs */}
          {vehicle.specs && (
            <div className="grid grid-cols-2 gap-2 mb-5 text-xs text-gray-600">
              {vehicle.specs.seats && (
                <div className="flex items-center bg-blue-50 px-2 py-2 rounded-lg border border-blue-200">
                  <Users className="h-3 w-3 mr-1 text-blue-500" />
                  {vehicle.specs.seats}
                </div>
              )}
              {vehicle.specs.fuel && (
                <div className="flex items-center bg-green-50 px-2 py-2 rounded-lg border border-green-200">
                  <Fuel className="h-3 w-3 mr-1 text-green-500" />
                  {vehicle.specs.fuel}
                </div>
              )}
              {vehicle.specs.transmission && (
                <div className="flex items-center col-span-2 bg-purple-50 px-2 py-2 rounded-lg border border-purple-200">
                  <Settings className="h-3 w-3 mr-1 text-purple-500" />
                  {vehicle.specs.transmission}
                </div>
              )}
            </div>
          )}

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {formatPrice(vehicle.pricePerDay)}
              </div>
              <div className="text-xs text-gray-500 font-medium">per day</div>
              {vehicle.pricePerHour && (
                <div className="text-xs text-gray-500">
                  {formatPrice(vehicle.pricePerHour)}/hr
                </div>
              )}
            </div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={onBookClick}
                size="sm"
                disabled={!vehicle.available}
                className="bg-blue-600 hover:bg-blue-700 transform group-hover:scale-105 transition-all shadow-lg hover:shadow-xl"
              >
                <Calendar className="h-4 w-4 mr-1" />
                {vehicle.available ? "Book Now" : "Unavailable"}
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default SavedVehiclesPage;