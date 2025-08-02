import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Car, 
  User, 
  Phone, 
  MessageCircle,
  X,
  CheckCircle,
  AlertCircle,
  Star,
  Download,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Heart,
  FileText,
  Printer
} from "lucide-react"
import { useBooking } from "../contexts/BookingContext"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import { useNavigate } from "react-router-dom"
import { generateInvoice, previewInvoice } from "../utils/invoiceGenerator"
import toast from "react-hot-toast"

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [generatingInvoice, setGeneratingInvoice] = useState(null)
  const { bookings, fetchMyBookings, cancelBooking, getStatusColor, formatBookingDate, calculateDuration, formatPrice } = useBooking()

  useEffect(() => {
    const loadBookings = async () => {
      await fetchMyBookings()
      setLoading(false)
    }
    loadBookings()
  }, [])

  // Filter bookings based on status and search
  const filteredBookings = bookings.filter(booking => {
    const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
    const matchesSearch = !searchTerm || 
      booking.vehicle?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.pickupLocation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.dropLocation?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesStatus && matchesSearch
  })

  const handleCancelBooking = async (bookingId) => {
    const result = await cancelBooking(bookingId)
    if (result.success) {
      // Booking cancelled successfully
    }
  }

  const handleDownloadInvoice = async (booking) => {
    setGeneratingInvoice(booking._id)
    
    try {
      const result = generateInvoice(booking, false)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error downloading invoice:', error)
      toast.error('Failed to download invoice')
    } finally {
      setGeneratingInvoice(null)
    }
  }

  const handlePreviewInvoice = async (booking) => {
    setGeneratingInvoice(booking._id)
    
    try {
      const result = previewInvoice(booking)
      
      if (result.success) {
        toast.success(result.message)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Error previewing invoice:', error)
      toast.error('Failed to preview invoice')
    } finally {
      setGeneratingInvoice(null)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'cancelled':
        return <X className="h-5 w-5 text-red-600" />
      case 'completed':
        return <Star className="h-5 w-5 text-blue-600" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusBadge = (status) => {
    const baseClasses = "px-4 py-2 rounded-full text-sm font-bold border shadow-sm"
    switch (status) {
      case 'confirmed':
        return `${baseClasses} bg-green-100 text-green-800 border-green-300`
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800 border-red-300`
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800 border-blue-300`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 border-gray-300`
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="min-h-screen pt-20 bg-gradient-to-br from-slate-50 via-white to-blue-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                My Bookings
              </h1>
              <p className="text-xl text-gray-600">Manage and track your vehicle reservations</p>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                onClick={() => fetchMyBookings()}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </motion.div>
          </div>

          {/* Enhanced Search and Filter Bar */}
          <Card className="bg-white/90 backdrop-blur-xl border-0 shadow-2xl ring-1 ring-white/20">
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by vehicle, pickup or drop location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white/80 backdrop-blur-sm"
                  />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 bg-white/80 backdrop-blur-sm min-w-[150px]"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                  <div className="text-sm text-gray-600">Total Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {bookings.filter(b => b.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-gray-600">Active</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {bookings.filter(b => b.status === 'completed').length}
                  </div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0).toLocaleString('en-IN', {style: 'currency', currency: 'INR'})}
                  </div>
                  <div className="text-sm text-gray-600">Total Spent</div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="xl" />
              <p className="mt-4 text-xl text-gray-600 font-medium">Loading your bookings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredBookings.length === 0 ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Card className="text-center py-16 bg-white/90 backdrop-blur-xl border-0 shadow-2xl ring-1 ring-white/20">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <Calendar className="h-16 w-16 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchTerm || statusFilter !== 'all' ? 'No bookings found' : 'No bookings yet'}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria to find your bookings.'
                      : 'Start exploring our premium vehicle fleet to make your first booking and experience luxury travel.'
                    }
                  </p>
                  <div className="flex gap-4 justify-center">
                    {(searchTerm || statusFilter !== 'all') && (
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('')
                            setStatusFilter('all')
                          }}
                          className="border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          Clear Filters
                        </Button>
                      </motion.div>
                    )}
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        onClick={() => navigate("vehicles")}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg"
                      >
                        <Car className="h-4 w-4 mr-2" />
                        Browse Vehicles
                      </Button>
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <AnimatePresence>
                {filteredBookings.map((booking, index) => (
                  <motion.div
                    key={booking._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -2 }}
                  >
                    <Card className="overflow-hidden bg-white/90 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 ring-1 ring-white/20 hover:ring-blue-500/20">
                      <div className="md:flex">
                        {/* Vehicle Image */}
                        <div className="md:w-1/3 h-64 md:h-auto relative overflow-hidden">
                          {booking.vehicle?.images?.[0] ? (
                            <img
                              src={booking.vehicle.images[0]}
                              alt={booking.vehicle.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-600 flex items-center justify-center">
                              <Car className="h-16 w-16 text-white/80" />
                            </div>
                          )}
                          
                          {/* Status Badge Overlay */}
                          <div className="absolute top-4 left-4">
                            <div className={getStatusBadge(booking.status)}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-2 capitalize">{booking.status}</span>
                            </div>
                          </div>

                          {/* Booking Type Badge */}
                          <div className="absolute bottom-4 left-4">
                            <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-gray-800 text-sm rounded-full font-semibold border border-white/30 shadow-lg">
                              {booking.bookingType === 'daily' ? (
                                <>
                                  <Calendar className="inline h-4 w-4 mr-1" />
                                  Daily Rental
                                </>
                              ) : (
                                <>
                                  <Clock className="inline h-4 w-4 mr-1" />
                                  Hourly Rental
                                </>
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Booking Details */}
                        <div className="md:w-2/3 p-8">
                          <div className="flex items-start justify-between mb-6">
                            <div>
                              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                {booking.vehicle?.title || 'Vehicle Details Unavailable'}
                              </h3>
                              <div className="flex items-center gap-4 text-gray-600">
                                {booking.vehicle?.type && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                                    {booking.vehicle.type}
                                  </span>
                                )}
                                {booking.vehicle?.rating && (
                                  <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="font-medium">{booking.vehicle.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                {formatPrice(booking.amountPaid)}
                              </div>
                              <div className="text-sm text-gray-500 font-medium">
                                {calculateDuration(booking)}
                              </div>
                            </div>
                          </div>

                          {/* Booking Timeline */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                <Calendar className="h-5 w-5 text-blue-600 mt-1" />
                                <div>
                                  <span className="text-sm font-semibold text-blue-800 block">Booking Period</span>
                                  <span className="text-gray-700 font-medium">
                                    {formatBookingDate(booking)}
                                  </span>
                                </div>
                              </div>
                              
                              {booking.bookingType === 'hourly' && (
                                <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                  <Clock className="h-5 w-5 text-purple-600 mt-1" />
                                  <div>
                                    <span className="text-sm font-semibold text-purple-800 block">Time Slot</span>
                                    <span className="text-gray-700 font-medium">
                                      {booking.startHour} - {booking.endHour}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-4">
                              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200">
                                <MapPin className="h-5 w-5 text-green-600 mt-1" />
                                <div>
                                  <span className="text-sm font-semibold text-green-800 block">Pickup</span>
                                  <span className="text-gray-700 font-medium">
                                    {booking.pickupLocation}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                                <MapPin className="h-5 w-5 text-red-600 mt-1" />
                                <div>
                                  <span className="text-sm font-semibold text-red-800 block">Drop-off</span>
                                  <span className="text-gray-700 font-medium">
                                    {booking.dropLocation}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex gap-3">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/vehicle-details?vehicleId=${booking.vehicle._id}`)}
                                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Vehicle
                                </Button>
                              </motion.div>
                              
                              {/* Invoice Download Button */}
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(booking)}
                                  disabled={generatingInvoice === booking._id}
                                  className="border-green-200 text-green-600 hover:bg-green-50"
                                >
                                  {generatingInvoice === booking._id ? (
                                    <LoadingSpinner size="sm" className="mr-2" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                  )}
                                  Invoice
                                </Button>
                              </motion.div>

                              {/* Invoice Preview Button */}
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handlePreviewInvoice(booking)}
                                  disabled={generatingInvoice === booking._id}
                                  className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                >
                                  <Printer className="h-4 w-4 mr-2" />
                                  Preview
                                </Button>
                              </motion.div>
                            </div>

                            <div className="flex gap-3">
                              {booking.status === "confirmed" && (
                                <>
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-green-200 text-green-600 hover:bg-green-50"
                                    >
                                      <Phone className="h-4 w-4 mr-2" />
                                      Call
                                    </Button>
                                  </motion.div>
                                  
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-blue-200 text-blue-600 hover:bg-blue-50"
                                    >
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      Chat
                                    </Button>
                                  </motion.div>
                                  
                                  <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleCancelBooking(booking._id)}
                                      className="bg-red-500 hover:bg-red-600 text-white border-0"
                                    >
                                      <X className="h-4 w-4 mr-2" />
                                      Cancel
                                    </Button>
                                  </motion.div>
                                </>
                              )}

                              {booking.status === "completed" && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-yellow-200 text-yellow-600 hover:bg-yellow-50"
                                  >
                                    <Star className="h-4 w-4 mr-2" />
                                    Rate & Review
                                  </Button>
                                </motion.div>
                              )}

                              {(booking.status === "completed" || booking.status === "cancelled") && (
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="border-purple-200 text-purple-600 hover:bg-purple-50"
                                    onClick={() => navigate(`/booking?vehicleId=${booking.vehicle._id}`)}
                                  >
                                    <Heart className="h-4 w-4 mr-2" />
                                    Book Again
                                  </Button>
                                </motion.div>
                              )}
                            </div>
                          </div>

                          {/* Booking ID */}
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm text-gray-500">
                              <span>Booking ID: <span className="font-mono font-semibold">{booking._id}</span></span>
                              <span>
                                Booked on {new Date(booking.createdAt || Date.now()).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default MyBookingsPage