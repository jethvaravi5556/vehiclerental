import { createContext, useContext, useState, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
};

export const BookingProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [availability, setAvailability] = useState({});
  const [conflictDetails, setConflictDetails] = useState(null);

  // ✅ Enhanced availability checking with detailed conflict info
  const checkVehicleAvailability = useCallback(async (vehicleId, bookingData) => {
    try {
      setLoading(true);
      setConflictDetails(null);
      
      const params = new URLSearchParams({
        vehicleId,
        bookingType: bookingData.bookingType,
      });

      if (bookingData.bookingType === 'daily') {
        if (bookingData.startDate) params.append('startDate', bookingData.startDate);
        if (bookingData.endDate) params.append('endDate', bookingData.endDate);
      } else if (bookingData.bookingType === 'hourly') {
        if (bookingData.startDate) params.append('startDate', bookingData.startDate);
        if (bookingData.startHour) params.append('startHour', bookingData.startHour);
        if (bookingData.endHour) params.append('endHour', bookingData.endHour);
      }

      const response = await axios.get(`/api/bookings/check-availability?${params}`);
      
      const availabilityKey = `${vehicleId}-${bookingData.bookingType}-${bookingData.startDate || ''}-${bookingData.startHour || ''}-${bookingData.endHour || ''}`;
      
      setAvailability(prev => ({
        ...prev,
        [availabilityKey]: response.data
      }));

      // Store conflict details for better user experience
      if (!response.data.available && response.data.conflictingBooking) {
        setConflictDetails({
          vehicle: response.data.vehicleDetails,
          conflictingBooking: response.data.conflictingBooking,
          reason: response.data.reason,
          message: response.data.message
        });

        // Show detailed conflict notification
        showConflictNotification(response.data);
      }

      return response.data;
    } catch (error) {
      console.error('Availability check failed:', error);
      const errorData = {
        available: false,
        message: error.response?.data?.message || 'Failed to check availability',
        reason: 'error'
      };
      
      toast.error(errorData.message, {
        icon: '❌',
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#EF4444',
          color: '#fff',
        },
      });

      return errorData;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Show detailed conflict notification
  const showConflictNotification = useCallback((availabilityData) => {
    const { conflictingBooking, message } = availabilityData;
    
    let conflictMessage = message;
    
    if (conflictingBooking) {
      if (conflictingBooking.bookingType === 'daily') {
        const startDate = new Date(conflictingBooking.startDate).toLocaleDateString();
        const endDate = new Date(conflictingBooking.endDate).toLocaleDateString();
        conflictMessage = `Vehicle already booked from ${startDate} to ${endDate}`;
      } else {
        const date = new Date(conflictingBooking.startDate).toLocaleDateString();
        conflictMessage = `Vehicle already booked on ${date} from ${conflictingBooking.startHour} to ${conflictingBooking.endHour}`;
      }
    }

    toast.error(conflictMessage, {
      icon: '⚠️',
      duration: 6000,
      style: {
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
        color: '#92400E',
        border: '2px solid #F59E0B',
        fontWeight: '600',
      },
    });
  }, []);

  // ✅ Real-time availability check with debouncing and conflict detection
  const checkAvailabilityDebounced = useCallback(
    debounce(checkVehicleAvailability, 800),
    [checkVehicleAvailability]
  );

  // ✅ Enhanced booking creation with pre-validation and conflict prevention
  const createBooking = useCallback(async (bookingData) => {
    try {
      setLoading(true);
      setConflictDetails(null);

      // Pre-check availability before booking attempt
      const availabilityCheck = await checkVehicleAvailability(
        bookingData.vehicleId,
        bookingData
      );

      if (!availabilityCheck.available) {
        // Show specific conflict details
        if (availabilityCheck.conflictingBooking) {
          const conflict = availabilityCheck.conflictingBooking;
          let detailedMessage = availabilityCheck.message;
          
          if (bookingData.bookingType === 'daily') {
            const conflictStart = new Date(conflict.startDate).toLocaleDateString();
            const conflictEnd = new Date(conflict.endDate).toLocaleDateString();
            detailedMessage = `This vehicle is already booked from ${conflictStart} to ${conflictEnd}. Please choose different dates or select another vehicle.`;
          } else {
            const conflictDate = new Date(conflict.startDate).toLocaleDateString();
            detailedMessage = `This vehicle is already booked on ${conflictDate} from ${conflict.startHour} to ${conflict.endHour}. Please choose a different time slot or select another vehicle.`;
          }

          toast.error(detailedMessage, {
            icon: '🚫',
            duration: 8000,
            style: {
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
              color: '#991B1B',
              border: '2px solid #DC2626',
              fontWeight: '600',
              maxWidth: '500px',
            },
          });
        } else {
          toast.error(availabilityCheck.message, {
            icon: '⚠️',
            duration: 5000,
            style: {
              borderRadius: '10px',
              background: '#F59E0B',
              color: '#fff',
            },
          });
        }
        
        return { 
          success: false, 
          message: availabilityCheck.message,
          conflictingBooking: availabilityCheck.conflictingBooking,
          reason: availabilityCheck.reason 
        };
      }

      // Proceed with booking creation
      const response = await axios.post('/api/bookings', bookingData);
      
      if (response.data.success) {
        // Update local bookings state
        if (response.data.booking) {
          setBookings(prev => [response.data.booking, ...prev]);
        }

        // Clear availability cache for this vehicle
        setAvailability(prev => {
          const newAvailability = { ...prev };
          Object.keys(newAvailability).forEach(key => {
            if (key.startsWith(bookingData.vehicleId)) {
              delete newAvailability[key];
            }
          });
          return newAvailability;
        });

        // Show success notification
        toast.success('🎉 Booking confirmed successfully!', {
          duration: 5000,
          style: {
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
            color: '#065F46',
            border: '2px solid #059669',
            fontWeight: '600',
          },
        });

        return { success: true, booking: response.data.booking };
      }

      return { success: false, message: 'Booking failed' };
    } catch (error) {
      console.error('Booking creation failed:', error);
      
      let errorMessage = 'Failed to create booking';
      let errorIcon = '❌';
      let errorStyle = {
        borderRadius: '10px',
        background: '#EF4444',
        color: '#fff',
      };
      
      if (error.response?.status === 409) {
        // Conflict - vehicle already booked
        errorMessage = error.response.data.message || 'Vehicle is already booked for this time period';
        errorIcon = '🚫';
        errorStyle = {
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)',
          color: '#991B1B',
          border: '2px solid #DC2626',
          fontWeight: '600',
          maxWidth: '500px',
        };
        
        // Add specific conflict details if available
        if (error.response.data.conflictingBooking) {
          const conflict = error.response.data.conflictingBooking;
          if (bookingData.bookingType === 'daily') {
            const startDate = new Date(conflict.startDate).toLocaleDateString();
            const endDate = new Date(conflict.endDate).toLocaleDateString();
            errorMessage += `. Already booked: ${startDate} - ${endDate}`;
          } else {
            const date = new Date(conflict.startDate).toLocaleDateString();
            errorMessage += `. Already booked: ${date}, ${conflict.startHour} - ${conflict.endHour}`;
          }
        }
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      toast.error(errorMessage, {
        icon: errorIcon,
        duration: 7000,
        style: errorStyle,
      });

      return { 
        success: false, 
        message: errorMessage,
        reason: error.response?.data?.reason,
        conflictingBooking: error.response?.data?.conflictingBooking
      };
    } finally {
      setLoading(false);
    }
  }, [checkVehicleAvailability]);

  // ✅ Enhanced booking cancellation with availability cache refresh
  const cancelBooking = useCallback(async (bookingId) => {
    try {
      setLoading(true);
      
      const response = await axios.put(`/api/bookings/cancel/${bookingId}`);
      
      if (response.data.success) {
        // Update local bookings state
        setBookings(prev => 
          prev.map(booking => 
            booking._id === bookingId 
              ? { ...booking, status: 'cancelled', cancelledAt: new Date() }
              : booking
          )
        );

        // Clear availability cache since the vehicle is now available
        setAvailability({});

        toast.success('Booking cancelled successfully. The vehicle is now available for others to book.', {
          icon: '✅',
          duration: 4000,
          style: {
            borderRadius: '10px',
            background: '#10B981',
            color: '#fff',
          },
        });

        return { success: true, booking: response.data.booking };
      }

      return { success: false, message: 'Failed to cancel booking' };
    } catch (error) {
      console.error('Booking cancellation failed:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to cancel booking';
      
      toast.error(errorMessage, {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#EF4444',
          color: '#fff',
        },
      });

      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Fetch user bookings with conflict resolution
  const fetchMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/bookings/my');
      setBookings(response.data);
      
      // Clear stale availability cache when fetching bookings
      setAvailability({});
      
      return response.data;
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      toast.error('Failed to fetch your bookings', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#EF4444',
          color: '#fff',
        },
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Get cached availability with conflict info
  const getCachedAvailability = useCallback((vehicleId, bookingData) => {
    const availabilityKey = `${vehicleId}-${bookingData.bookingType}-${bookingData.startDate || ''}-${bookingData.startHour || ''}-${bookingData.endHour || ''}`;
    return availability[availabilityKey];
  }, [availability]);

  // ✅ Clear availability cache with conflict details
  const clearAvailabilityCache = useCallback((vehicleId = null) => {
    setConflictDetails(null);
    
    if (vehicleId) {
      setAvailability(prev => {
        const newAvailability = { ...prev };
        Object.keys(newAvailability).forEach(key => {
          if (key.startsWith(vehicleId)) {
            delete newAvailability[key];
          }
        });
        return newAvailability;
      });
    } else {
      setAvailability({});
    }
  }, []);

  // ✅ Get alternative time suggestions for conflicts
  const getAlternativeSuggestions = useCallback(async (vehicleId, bookingData) => {
    try {
      const response = await axios.get(`/api/bookings/alternative-slots?vehicleId=${vehicleId}&bookingType=${bookingData.bookingType}`);
      return response.data.suggestions || [];
    } catch (error) {
      console.error('Failed to get alternative suggestions:', error);
      return [];
    }
  }, []);

  const value = {
    loading,
    bookings,
    availability,
    conflictDetails,
    
    // Methods
    createBooking,
    cancelBooking,
    fetchMyBookings,
    checkVehicleAvailability,
    checkAvailabilityDebounced,
    getCachedAvailability,
    clearAvailabilityCache,
    getAlternativeSuggestions,
    showConflictNotification,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
};

// ✅ Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}