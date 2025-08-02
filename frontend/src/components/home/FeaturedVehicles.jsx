"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Star, Heart, ArrowRight, MapPin, Calendar, Clock, Fuel, Users, Settings, Car } from "lucide-react"
import { useVehicle } from "../../contexts/VehicleContext"
import { useAuth } from "../../contexts/AuthContext"
import Card from "../ui/Card"
import Button from "../ui/Button"
import LoadingSpinner from "../ui/LoadingSpinner"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

const FeaturedVehicles = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    vehicles, 
    loading, 
    fetchVehicles, 
    formatPrice,
    toggleSaveVehicle,
    isVehicleSaved 
  } = useVehicle()
  const [hoveredCard, setHoveredCard] = useState(null)

  useEffect(() => {
    // Fetch featured vehicles (limit to first 6)
    fetchVehicles({ limit: 6, featured: true })
  }, [])

  const handleSaveVehicle = async (vehicleId, vehicleTitle, e) => {
    e.stopPropagation();
    e.preventDefault();
    
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

    await toggleSaveVehicle(vehicleId, vehicleTitle, 'featured');
  };

  const handleViewDetails = (vehicleId, e = null) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // Use consistent URL pattern with VehicleListingPage
    navigate(`/vehicle-details?vehicleId=${vehicleId}`);
  };

  const handleBookNow = (vehicleId, e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error("Please login to book vehicles", {
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
    
    // Show booking success feedback
    toast.success("Redirecting to booking page...", {
      icon: "🚗",
      duration: 2000,
      style: {
        borderRadius: '10px',
        background: '#10B981',
        color: '#fff',
      },
    });
    
    // Navigate to booking page with just vehicleId
    navigate(`/booking?vehicleId=${vehicleId}`);
  };

  const handleCardClick = (vehicleId) => {
    // Navigate to vehicle details when card is clicked
    handleViewDetails(vehicleId);
  };

  const handleExploreAll = () => {
    // Navigate to vehicles page without any filters
    navigate("/vehicles");
  };

  const getVehicleSpecs = (vehicle) => {
    const specs = vehicle.specs || {}
    return [
      { icon: Fuel, label: specs.fuelType || specs.fuel || 'Petrol', color: 'text-green-600' },
      { icon: Users, label: `${specs.seats || 4} Seats`, color: 'text-blue-600' },
      { icon: Settings, label: specs.transmission || 'Manual', color: 'text-purple-600' },
    ]
  }

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center py-20">
            <LoadingSpinner size="xl" />
            <p className="mt-4 text-gray-600 animate-pulse">Loading premium vehicles...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-20 bg-gradient-to-br from-slate-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-600/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full border border-blue-200/50 mb-4"
          >
            <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ✨ Premium Collection
            </span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-6">
            Featured Vehicles
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our handpicked selection of premium vehicles, each offering luxury, performance, and unmatched comfort for your journey
          </p>
        </motion.div>

        {vehicles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No vehicles available</h3>
            <p className="text-gray-600">Check back later for our premium vehicle collection.</p>
          </motion.div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {vehicles.slice(0, 6).map((vehicle, index) => (
                <motion.div
                  key={vehicle._id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  onMouseEnter={() => setHoveredCard(vehicle._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  className="group cursor-pointer"
                  onClick={() => handleCardClick(vehicle._id)}
                >
                  <Card className="overflow-hidden border-0 shadow-xl bg-white/80 backdrop-blur-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
                    <div className="relative overflow-hidden">
                      <motion.img
                        src={vehicle.images?.[0] || `https://via.placeholder.com/400x250?text=${encodeURIComponent(vehicle.title || 'Vehicle')}`}
                        alt={vehicle.title}
                        className="w-full h-56 object-cover"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      />
                      
                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Favorite button */}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => handleSaveVehicle(vehicle._id, vehicle.title, e)}
                        className="absolute top-4 right-4 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-300 z-10"
                        title={isVehicleSaved(vehicle._id) ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart 
                          className={`h-5 w-5 transition-colors duration-300 ${
                            isVehicleSaved(vehicle._id)
                              ? 'text-red-500 fill-red-500' 
                              : 'text-gray-600 hover:text-red-500'
                          }`} 
                        />
                      </motion.button>

                      {/* Vehicle type badge */}
                      <div className="absolute bottom-4 left-4">
                        <span className="px-3 py-1 bg-black/70 backdrop-blur-sm text-white text-sm font-medium rounded-full">
                          {vehicle.type || 'Premium'}
                        </span>
                      </div>

                      {/* Availability indicator */}
                      <div className="absolute top-4 left-4">
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          vehicle.available 
                            ? 'bg-green-500/90 text-white' 
                            : 'bg-red-500/90 text-white'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            vehicle.available ? 'bg-green-200' : 'bg-red-200'
                          }`} />
                          {vehicle.available ? 'Available' : 'Booked'}
                        </div>
                      </div>

                      {/* Hover overlay with quick action */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="text-white text-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <p className="text-sm font-medium mb-2">Click to view details</p>
                          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center mx-auto">
                            <ArrowRight className="h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors duration-300">
                            {vehicle.title}
                          </h3>
                          <div className="flex items-center text-gray-600 text-sm">
                            <span className="font-medium">{vehicle.brand}</span>
                            <span className="mx-2">•</span>
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{vehicle.location}</span>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle specifications */}
                      <div className="flex items-center justify-between mb-4 py-3 px-4 bg-gray-50/80 rounded-lg">
                        {getVehicleSpecs(vehicle).map((spec, idx) => (
                          <div key={idx} className="flex items-center text-xs">
                            <spec.icon className={`h-4 w-4 mr-1 ${spec.color}`} />
                            <span className="text-gray-700 font-medium">{spec.label}</span>
                          </div>
                        ))}
                      </div>

                      {/* Rating and pricing */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-semibold text-gray-900">
                              {vehicle.rating?.toFixed(1) || '4.5'}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            ({vehicle.reviewCount || Math.floor(Math.random() * 50) + 10} reviews)
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            {formatPrice(vehicle.pricePerDay)}
                          </div>
                          <div className="text-sm text-gray-500">per day</div>
                          {vehicle.pricePerHour && (
                            <div className="text-xs text-gray-400">
                              {formatPrice(vehicle.pricePerHour)}/hr
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          className="w-full group bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all duration-300"
                          onClick={(e) => handleViewDetails(vehicle._id, e)}
                        >
                          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">
                            View Details
                          </span>
                          <ArrowRight className="ml-2 h-4 w-4 text-blue-600 group-hover:translate-x-1 transition-transform duration-300" />
                        </Button>
                        
                        {vehicle.available ? (
                          <Button
                            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                            onClick={(e) => handleBookNow(vehicle._id, e)}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            Book Now
                          </Button>
                        ) : (
                          <Button
                            disabled
                            className="w-full bg-gray-400 text-white font-semibold py-3 rounded-lg cursor-not-allowed"
                          >
                            Currently Unavailable
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* View all vehicles button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                onClick={handleExploreAll}
              >
                Explore All Vehicles
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  )
}

export default FeaturedVehicles