// contexts/BookingContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import axios from "../axiosConfig"
import toast from "react-hot-toast"

const BookingContext = createContext()

export const useBooking = () => {
  const context = useContext(BookingContext)
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider")
  }
  return context
}

export const BookingProvider = ({ children }) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch user's bookings
  const fetchMyBookings = async () => {
    setLoading(true)
    try {
      const response = await axios.get("/api/bookings/my")
      setBookings(response.data)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      if (error.response?.status !== 401) {
        toast.error("Failed to fetch bookings")
      }
    } finally {
      setLoading(false)
    }
  }

  // Create a new booking
  const createBooking = async (bookingData) => {
    setLoading(true)
    try {
      const response = await axios.post("/api/bookings", bookingData)
      await fetchMyBookings()
      toast.success("Booking created successfully!")
      return { success: true, booking: response.data }
    } catch (error) {
      console.error("Booking creation failed:", error)
      const errorMessage = error.response?.data?.message || "Booking failed"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  // Cancel a booking
  const cancelBooking = async (bookingId) => {
    try {
      const response = await axios.put(`/api/bookings/cancel/${bookingId}`)
      await fetchMyBookings()
      toast.success("Booking cancelled successfully!")
      return { success: true, booking: response.data }
    } catch (error) {
      console.error("Failed to cancel booking:", error)
      const errorMessage = error.response?.data?.message || "Failed to cancel booking"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Complete a booking
  const completeBooking = async (bookingId) => {
    try {
      const response = await axios.put(`/api/bookings/complete/${bookingId}`)
      await fetchMyBookings()
      toast.success("Booking completed successfully!")
      return { success: true, booking: response.data }
    } catch (error) {
      console.error("Failed to complete booking:", error)
      const errorMessage = error.response?.data?.message || "Failed to complete booking"
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Get booking status color
  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-200"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200"
      case "completed":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Format booking dates
  const formatBookingDate = (booking) => {
    if (booking.bookingType === "daily") {
      const start = new Date(booking.startDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      const end = new Date(booking.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
      return `${start} - ${end}`
    } else {
      return `${booking.startHour} - ${booking.endHour}`
    }
  }

  // Calculate booking duration
  const calculateDuration = (booking) => {
    if (booking.bookingType === "daily") {
      const start = new Date(booking.startDate)
      const end = new Date(booking.endDate)
      const diffInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) || 1
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`
    } else {
      const [startH, startM] = booking.startHour.split(":").map(Number)
      const [endH, endM] = booking.endHour.split(":").map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      const diffHours = Math.ceil((endMinutes - startMinutes) / 60)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''}`
    }
  }

  // Format price display
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price)
  }

  const value = {
    bookings,
    loading,
    fetchMyBookings,
    createBooking,
    cancelBooking,
    completeBooking,
    getStatusColor,
    formatBookingDate,
    calculateDuration,
    formatPrice,
  }

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}