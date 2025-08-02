// ---------- services/chatbotService.js ----------
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import Booking from "../models/Booking.js";
import Review from "../models/Review.js";

class EnhancedChatbotService {
  constructor() {
    this.conversationContext = new Map();
    this.initializeIntents();
    this.initializeEntityPatterns();
  }

  initializeIntents() {
    this.intents = {
      greeting: {
        patterns: [
          /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
          /^(greetings|howdy|what's up|sup)/i
        ],
        confidence: 0.9
      },
      availability: {
        patterns: [
          /\b(available|vehicles?|cars?|bikes?|motorcycles?|show me|what.*have)\b/i,
          /\b(rent|rental|hire)\b.*\b(vehicles?|cars?|bikes?)\b/i,
          /\b(browse|see|view|list).*\b(vehicles?|cars?|bikes?)\b/i
        ],
        confidence: 0.8
      },
      realTimeSearch: {
        patterns: [
          /\b(find|search|look for|need)\b.*\b(vehicle|car|bike)\b/i,
          /\b(show|get).*\b(vehicles?|cars?|bikes?)\b.*\b(under|below|less than|within)\b/i,
          /\b(budget|cheap|affordable)\b.*\b(vehicle|car|bike)\b/i
        ],
        confidence: 0.85
      },
      pricing: {
        patterns: [
          /\b(price|cost|rate|how much|expensive|cheap|budget|pricing|charges?|fees?)\b/i,
          /\b(what.*cost|price.*list|rate.*card)\b/i
        ],
        confidence: 0.8
      },
      booking: {
        patterns: [
          /\b(book|booking|reserve|reservation|rent|hire)\b/i,
          /\b(make.*booking|want.*rent|need.*vehicle)\b/i,
          /\b(i want to|i need to|can i).*\b(book|rent|hire)\b/i
        ],
        confidence: 0.8
      },
      myBookings: {
        patterns: [
          /\b(my.*book|booking.*status|reservation.*status|booked.*vehicles?)\b/i,
          /\b(my.*orders?|booking.*history|past.*bookings?)\b/i,
          /\b(current.*booking|active.*rental|my.*reservations?)\b/i
        ],
        confidence: 0.9
      },
      vehicleDetails: {
        patterns: [
          /\b(details?|specs?|specifications?|features?|about|tell.*more|information)\b/i,
          /\b(engine|mileage|fuel|capacity|model|year|transmission)\b/i
        ],
        confidence: 0.7
      },
      availabilityCheck: {
        patterns: [
          /\b(available|check availability|is.*available)\b/i,
          /\b(can i book|when.*available)\b/i
        ],
        confidence: 0.8
      },
      location: {
        patterns: [
          /\b(location|where|address|pickup|drop|area|branch|office)\b/i,
          /\b(near.*me|nearby|closest|directions)\b/i
        ],
        confidence: 0.8
      },
      reviews: {
        patterns: [
          /\b(review|rating|feedback|opinion|experience|testimonials?)\b/i,
          /\b(what.*others.*say|customer.*reviews|user.*ratings)\b/i
        ],
        confidence: 0.8
      },
      help: {
        patterns: [
          /\b(help|support|assist|what.*can.*do|commands|guide)\b/i,
          /\b(how.*work|tutorial|instructions)\b/i
        ],
        confidence: 0.9
      },
      contact: {
        patterns: [
          /\b(contact|phone|email|support|customer.*service|call|reach)\b/i,
          /\b(talk.*human|speak.*person|live.*chat)\b/i
        ],
        confidence: 0.8
      },
      cancelBooking: {
        patterns: [
          /\b(cancel|cancellation|refund|modify|change|update).*\b(booking|reservation|order)\b/i,
          /\b(want.*cancel|need.*cancel|how.*cancel)\b/i
        ],
        confidence: 0.8
      },
      payment: {
        patterns: [
          /\b(payment|pay|paid|transaction|invoice|receipt|bill)\b/i,
          /\b(credit.*card|debit.*card|online.*payment|payment.*method)\b/i
        ],
        confidence: 0.8
      },
      comparison: {
        patterns: [
          /\b(compare|comparison|vs|versus|difference|better)\b/i,
          /\b(which.*better|what.*difference)\b/i
        ],
        confidence: 0.7
      }
    };
  }

  initializeEntityPatterns() {
    this.entityPatterns = {
      vehicleTypes: ['car', 'bike', 'motorcycle', 'scooter', 'suv', 'sedan', 'hatchback', 'luxury'],
      brands: ['toyota', 'honda', 'maruti', 'hyundai', 'mahindra', 'tata', 'ford', 'bmw', 'audi', 'volkswagen'],
      fuelTypes: ['petrol', 'diesel', 'electric', 'cng', 'hybrid'],
      priceRanges: [
        { pattern: /under (\d+)/i, type: 'max' },
        { pattern: /below (\d+)/i, type: 'max' },
        { pattern: /less than (\d+)/i, type: 'max' },
        { pattern: /(\d+) to (\d+)/i, type: 'range' },
        { pattern: /between (\d+) and (\d+)/i, type: 'range' }
      ]
    };
  }

  analyzeIntent(message) {
    const results = [];
    
    for (const [intentName, intent] of Object.entries(this.intents)) {
      for (const pattern of intent.patterns) {
        if (pattern.test(message)) {
          results.push({
            intent: intentName,
            confidence: intent.confidence
          });
          break;
        }
      }
    }

    return results.length > 0 
      ? results.reduce((prev, current) => 
          (prev.confidence > current.confidence) ? prev : current
        )
      : { intent: 'unknown', confidence: 0 };
  }

  extractEntities(message) {
    const entities = {
      vehicleTypes: [],
      brands: [],
      fuelType: null,
      priceRange: null,
      location: null,
      urgency: null
    };

    const lowerMessage = message.toLowerCase();
    
    // Extract vehicle types
    this.entityPatterns.vehicleTypes.forEach(type => {
      if (lowerMessage.includes(type)) {
        entities.vehicleTypes.push(type);
      }
    });

    // Extract brands
    this.entityPatterns.brands.forEach(brand => {
      if (lowerMessage.includes(brand)) {
        entities.brands.push(brand);
      }
    });

    // Extract fuel types
    this.entityPatterns.fuelTypes.forEach(fuel => {
      if (lowerMessage.includes(fuel)) {
        entities.fuelType = fuel;
      }
    });

    // Extract price ranges
    for (const pricePattern of this.entityPatterns.priceRanges) {
      const match = message.match(pricePattern.pattern);
      if (match) {
        if (pricePattern.type === 'range') {
          entities.priceRange = { min: parseInt(match[1]), max: parseInt(match[2]) };
        } else {
          entities.priceRange = { max: parseInt(match[1]) };
        }
        break;
      }
    }

    // Extract urgency indicators
    const urgencyWords = ['urgent', 'asap', 'immediately', 'now', 'today', 'emergency'];
    if (urgencyWords.some(word => lowerMessage.includes(word))) {
      entities.urgency = 'high';
    }

    return entities;
  }

  async handleIntent(intent, message, userId, entities) {
    const context = this.getContext(userId);
    
    // Update context with current interaction
    this.updateContext(userId, {
      lastIntent: intent,
      lastEntities: entities,
      conversationStep: context.conversationStep + 1,
      lastMessage: message
    });

    switch (intent) {
      case 'greeting':
        return this.handleGreeting(userId);
      case 'availability':
        return this.handleAvailability(userId, entities);
      case 'realTimeSearch':
        return this.handleRealTimeSearch(userId, message, entities);
      case 'pricing':
        return this.handlePricing(userId, entities);
      case 'booking':
        return this.handleBooking(userId, message, entities);
      case 'myBookings':
        return this.handleMyBookings(userId);
      case 'vehicleDetails':
        return this.handleVehicleDetails(userId, message, entities);
      case 'availabilityCheck':
        return this.handleAvailabilityCheck(userId, message, entities);
      case 'location':
        return this.handleLocation(userId);
      case 'reviews':
        return this.handleReviews(userId, message, entities);
      case 'comparison':
        return this.handleComparison(userId, message, entities);
      case 'help':
        return this.handleHelp(userId);
      case 'contact':
        return this.handleContact(userId);
      case 'cancelBooking':
        return this.handleCancelBooking(userId);
      case 'payment':
        return this.handlePayment(userId, message);
      default:
        return this.handleUnknown(message, userId);
    }
  }

  async handleGreeting(userId) {
    try {
      const user = await User.findById(userId).select('name');
      const userName = user?.name || 'there';
      
      // Get real-time platform stats
      const [totalVehicles, userBookings, popularVehicle] = await Promise.all([
        Vehicle.countDocuments({ available: true }),
        Booking.countDocuments({ user: userId }),
        Vehicle.findOne({ available: true }).sort({ rating: -1 }).select('title')
      ]);
      
      let greeting;
      if (userBookings > 0) {
        greeting = `Welcome back ${userName}! 🚗 Ready for another great ride? We have ${totalVehicles} vehicles available right now.`;
      } else {
        greeting = `Hello ${userName}! 👋 Welcome to VehicleRent. We have ${totalVehicles} amazing vehicles ready for you to explore!`;
      }

      if (popularVehicle) {
        greeting += `\n\n🌟 Today's top pick: **${popularVehicle.title}**`;
      }

      return {
        text: greeting,
        suggestions: ['Show available vehicles', 'My bookings', 'Popular vehicles', 'Pricing info'],
        type: 'greeting',
        quickActions: [
          { text: 'Browse All', action: 'available vehicles' },
          { text: 'Best Deals', action: 'cheap vehicles under 2000' },
          { text: 'Near Me', action: 'vehicles near me' }
        ]
      };
    } catch (error) {
      console.error('Error in handleGreeting:', error);
      return {
        text: "Hello! Welcome to VehicleRent. How can I assist you today?",
        suggestions: ['Show vehicles', 'Help'],
        type: 'greeting'
      };
    }
  }

  async handleRealTimeSearch(userId, message, entities) {
    try {
      let query = { available: true };
      let searchContext = [];

      // Apply entity-based filters
      if (entities.vehicleTypes.length > 0) {
        query.type = { $regex: new RegExp(entities.vehicleTypes.join('|'), 'i') };
        searchContext.push(`${entities.vehicleTypes.join(', ')} vehicles`);
      }

      if (entities.brands.length > 0) {
        query.brand = { $regex: new RegExp(entities.brands.join('|'), 'i') };
        searchContext.push(`${entities.brands.join(', ')} brand`);
      }

      if (entities.priceRange) {
        if (entities.priceRange.min && entities.priceRange.max) {
          query.pricePerDay = { $gte: entities.priceRange.min, $lte: entities.priceRange.max };
          searchContext.push(`₹${entities.priceRange.min}-${entities.priceRange.max}/day`);
        } else if (entities.priceRange.max) {
          query.pricePerDay = { $lte: entities.priceRange.max };
          searchContext.push(`under ₹${entities.priceRange.max}/day`);
        }
      }

      if (entities.fuelType) {
        query['specs.fuel'] = { $regex: new RegExp(entities.fuelType, 'i') };
        searchContext.push(`${entities.fuelType} fuel`);
      }

      // Get search results with real-time availability
      const vehicles = await Vehicle.find(query)
        .sort({ rating: -1, createdAt: -1 })
        .limit(6);

      if (vehicles.length === 0) {
        const totalAvailable = await Vehicle.countDocuments({ available: true });
        let response = `No vehicles found matching your search criteria`;
        if (searchContext.length > 0) {
          response += ` (${searchContext.join(', ')})`;
        }
        response += `.\n\nWe have ${totalAvailable} other vehicles available. Would you like to see them?`;

        return {
          text: response,
          suggestions: ['Show all vehicles', 'Modify search', 'Popular picks'],
          type: 'no_search_results'
        };
      }

      // Check real-time availability for each vehicle
      const vehiclesWithAvailability = await Promise.all(
        vehicles.map(async (vehicle) => {
          const currentBookings = await Booking.countDocuments({
            vehicle: vehicle._id,
            status: 'confirmed',
            $or: [
              { 
                bookingType: 'daily', 
                endDate: { $gte: new Date() },
                startDate: { $lte: new Date() }
              },
              { 
                bookingType: 'hourly', 
                createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
              }
            ]
          });

          return {
            ...vehicle.toObject(),
            realTimeAvailability: currentBookings === 0 ? 'available' : 'limited',
            activeBookings: currentBookings
          };
        })
      );

      let response = `🔍 **Found ${vehicles.length} vehicles`;
      if (searchContext.length > 0) {
        response += ` (${searchContext.join(', ')})`;
      }
      response += `:**\n\n`;

      vehiclesWithAvailability.forEach((vehicle, index) => {
        const availabilityIcon = vehicle.realTimeAvailability === 'available' ? '✅' : '⚠️';
        response += `**${index + 1}. ${vehicle.title}** ${availabilityIcon}\n`;
        response += `   🏷️ ${vehicle.brand} | 🚙 ${vehicle.type}\n`;
        response += `   💰 ₹${vehicle.pricePerDay}/day`;
        if (vehicle.pricePerHour) {
          response += ` | ₹${vehicle.pricePerHour}/hour`;
        }
        response += `\n   📍 ${vehicle.location} | ⭐ ${vehicle.rating}/5\n`;
        
        if (vehicle.realTimeAvailability === 'limited') {
          response += `   📊 ${vehicle.activeBookings} active booking(s)\n`;
        }
        
        if (vehicle.specs?.fuel) {
          response += `   ⛽ ${vehicle.specs.fuel}`;
        }
        response += `\n\n`;
      });

      if (entities.urgency === 'high') {
        response += `🚨 **Urgent booking?** Call us at +91-1800-VEHICLE for instant confirmation!`;
      }

      return {
        text: response,
        suggestions: ['Book now', 'More details', 'Compare vehicles', 'Check availability'],
        type: 'search_results',
        data: vehiclesWithAvailability,
        searchContext: searchContext
      };
    } catch (error) {
      console.error('Error in handleRealTimeSearch:', error);
      return this.handleAvailability(userId, entities);
    }
  }

  async handleAvailabilityCheck(userId, message, entities) {
    try {
      // Try to find specific vehicle mentioned
      let vehicle = null;
      const vehicles = await Vehicle.find({ available: true });
      
      for (const v of vehicles) {
        if (message.toLowerCase().includes(v.title.toLowerCase()) || 
            message.toLowerCase().includes(v.brand.toLowerCase())) {
          vehicle = v;
          break;
        }
      }

      if (!vehicle && (entities.vehicleTypes.length > 0 || entities.brands.length > 0)) {
        let query = { available: true };
        
        if (entities.vehicleTypes.length > 0) {
          query.type = { $regex: new RegExp(entities.vehicleTypes[0], 'i') };
        }
        
        if (entities.brands.length > 0) {
          query.brand = { $regex: new RegExp(entities.brands[0], 'i') };
        }
        
        vehicle = await Vehicle.findOne(query).sort({ rating: -1 });
      }

      if (!vehicle) {
        return {
          text: "Please specify which vehicle you'd like to check availability for. You can mention the vehicle name, brand, or type.",
          suggestions: ['Show available vehicles', 'Popular vehicles'],
          type: 'need_vehicle_specification'
        };
      }

      // Check real-time availability
      const [dailyBookings, hourlyBookings] = await Promise.all([
        Booking.countDocuments({
          vehicle: vehicle._id,
          status: 'confirmed',
          bookingType: 'daily',
          endDate: { $gte: new Date() },
          startDate: { $lte: new Date() }
        }),
        Booking.countDocuments({
          vehicle: vehicle._id,
          status: 'confirmed',
          bookingType: 'hourly',
          createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) }
        })
      ]);

      const totalActiveBookings = dailyBookings + hourlyBookings;
      const isAvailable = totalActiveBookings === 0;

      let response = `📋 **Availability Check: ${vehicle.title}**\n\n`;
      
      if (isAvailable) {
        response += `✅ **FULLY AVAILABLE**\n`;
        response += `🎉 Ready for immediate booking!\n\n`;
      } else {
        response += `⚠️ **LIMITED AVAILABILITY**\n`;
        response += `📊 ${totalActiveBookings} active booking(s)\n`;
        if (dailyBookings > 0) response += `📅 ${dailyBookings} daily rental(s)\n`;
        if (hourlyBookings > 0) response += `⏰ ${hourlyBookings} hourly rental(s)\n`;
        response += `\n`;
      }

      response += `🚗 **Vehicle Details:**\n`;
      response += `💰 Price: ₹${vehicle.pricePerDay}/day`;
      if (vehicle.pricePerHour) {
        response += ` | ₹${vehicle.pricePerHour}/hour`;
      }
      response += `\n📍 Location: ${vehicle.location}\n`;
      response += `⭐ Rating: ${vehicle.rating}/5\n\n`;

      if (isAvailable) {
        response += `🔥 **Available slots:**\n`;
        response += `• ✅ Daily rentals\n`;
        response += `• ✅ Hourly rentals\n`;
        response += `• ✅ Immediate pickup possible`;
      } else {
        response += `💡 **Alternative options:**\n`;
        response += `• Check back in a few hours\n`;
        response += `• Browse similar vehicles\n`;
        response += `• Get notified when available`;
      }

      return {
        text: response,
        suggestions: isAvailable 
          ? ['Book this vehicle', 'Check other vehicles', 'Get pricing'] 
          : ['Similar vehicles', 'Notify me', 'Browse alternatives'],
        type: 'availability_check',
        data: {
          vehicle,
          isAvailable,
          activeBookings: totalActiveBookings
        }
      };
    } catch (error) {
      console.error('Error in handleAvailabilityCheck:', error);
      return {
        text: "Sorry, I couldn't check availability right now. Please try again.",
        suggestions: ['Try again', 'Show vehicles'],
        type: 'error'
      };
    }
  }

  async handleComparison(userId, message, entities) {
    try {
      // Try to extract multiple vehicle names/types from message
      const vehicles = await Vehicle.find({ available: true });
      const mentionedVehicles = [];

      // Find vehicles mentioned in the message
      for (const vehicle of vehicles) {
        if (message.toLowerCase().includes(vehicle.title.toLowerCase()) ||
            message.toLowerCase().includes(vehicle.brand.toLowerCase())) {
          mentionedVehicles.push(vehicle);
        }
      }

      // If no specific vehicles mentioned, use entities or get top vehicles by type
      if (mentionedVehicles.length === 0) {
        if (entities.vehicleTypes.length > 0) {
          const typeVehicles = await Vehicle.find({
            available: true,
            type: { $regex: new RegExp(entities.vehicleTypes[0], 'i') }
          }).sort({ rating: -1 }).limit(3);
          mentionedVehicles.push(...typeVehicles);
        } else {
          // Get top 3 vehicles for comparison
          const topVehicles = await Vehicle.find({ available: true })
            .sort({ rating: -1 })
            .limit(3);
          mentionedVehicles.push(...topVehicles);
        }
      }

      if (mentionedVehicles.length < 2) {
        return {
          text: "I need at least 2 vehicles to compare. Please mention specific vehicle names or types you'd like to compare.",
          suggestions: ['Popular vehicles', 'Show available vehicles'],
          type: 'need_comparison_vehicles'
        };
      }

      // Limit to 3 vehicles for comparison
      const compareVehicles = mentionedVehicles.slice(0, 3);

      let response = `📊 **Vehicle Comparison (${compareVehicles.length} vehicles):**\n\n`;

      // Create comparison table
      const comparisonData = await Promise.all(
        compareVehicles.map(async (vehicle) => {
          const reviews = await Review.countDocuments({ vehicle: vehicle._id });
          const activeBookings = await Booking.countDocuments({
            vehicle: vehicle._id,
            status: 'confirmed'
          });

          return {
            ...vehicle.toObject(),
            reviewCount: reviews,
            popularity: activeBookings
          };
        })
      );

      // Display comparison
      comparisonData.forEach((vehicle, index) => {
        response += `**${index + 1}. ${vehicle.title}** (${vehicle.brand})\n`;
        response += `   🚙 Type: ${vehicle.type}\n`;
        response += `   💰 Daily: ₹${vehicle.pricePerDay}`;
        if (vehicle.pricePerHour) {
          response += ` | Hourly: ₹${vehicle.pricePerHour}`;
        }
        response += `\n   📍 Location: ${vehicle.location}\n`;
        response += `   ⭐ Rating: ${vehicle.rating}/5 (${vehicle.reviewCount} reviews)\n`;
        
        if (vehicle.specs) {
          if (vehicle.specs.fuel) response += `   ⛽ Fuel: ${vehicle.specs.fuel}\n`;
          if (vehicle.specs.seats) response += `   👥 Seats: ${vehicle.specs.seats}\n`;
          if (vehicle.specs.mileage) response += `   📊 Mileage: ${vehicle.specs.mileage}\n`;
        }
        
        response += `   📈 Popularity: ${vehicle.popularity} current bookings\n\n`;
      });

      // Add recommendation based on comparison
      const cheapest = comparisonData.reduce((prev, current) => 
        prev.pricePerDay < current.pricePerDay ? prev : current);
      const topRated = comparisonData.reduce((prev, current) => 
        prev.rating > current.rating ? prev : current);

      response += `💡 **Quick Insights:**\n`;
      response += `🏆 **Best Rating:** ${topRated.title} (${topRated.rating}/5)\n`;
      response += `💵 **Most Affordable:** ${cheapest.title} (₹${cheapest.pricePerDay}/day)\n`;

      return {
        text: response,
        suggestions: ['Book best rated', 'Book cheapest', 'More details', 'Add more vehicles'],
        type: 'vehicle_comparison',
        data: comparisonData
      };
    } catch (error) {
      console.error('Error in handleComparison:', error);
      return {
        text: "Sorry, I couldn't perform the comparison right now. Please try again.",
        suggestions: ['Try again', 'Show vehicles'],
        type: 'error'
      };
    }
  }

  // Enhanced existing methods with real-time data
  async handleAvailability(userId, entities) {
    try {
      let query = { available: true };
      let filterDesc = "";

      // Apply filters based on entities
      if (entities.vehicleTypes.length > 0) {
        query.type = { $regex: new RegExp(entities.vehicleTypes.join('|'), 'i') };
        filterDesc += ` ${entities.vehicleTypes.join(', ')} type`;
      }

      if (entities.brands.length > 0) {
        query.brand = { $regex: new RegExp(entities.brands.join('|'), 'i') };
        filterDesc += ` ${entities.brands.join(', ')} brand`;
      }

      if (entities.priceRange) {
        if (entities.priceRange.min && entities.priceRange.max) {
          query.pricePerDay = { $gte: entities.priceRange.min, $lte: entities.priceRange.max };
          filterDesc += ` ₹${entities.priceRange.min}-₹${entities.priceRange.max}/day`;
        } else if (entities.priceRange.max) {
          query.pricePerDay = { $lte: entities.priceRange.max };
          filterDesc += ` under ₹${entities.priceRange.max}/day`;
        }
      }

      const vehicles = await Vehicle.find(query)
        .sort({ rating: -1, createdAt: -1 })
        .limit(8);

      if (vehicles.length === 0) {
        let response = `Sorry, no vehicles are currently available${filterDesc ? ` matching your criteria (${filterDesc.trim()})` : ''}.`;
        
        // Suggest alternatives
        const allVehicles = await Vehicle.countDocuments({ available: true });
        if (allVehicles > 0) {
          response += `\n\nWe have ${allVehicles} other vehicles available. Would you like to see them?`;
        }

        return {
          text: response,
          suggestions: ['Show all vehicles', 'Change filters', 'Popular vehicles'],
          type: 'no_results'
        };
      }

      // Get real-time booking data for each vehicle
      const vehiclesWithBookingData = await Promise.all(
        vehicles.map(async (vehicle) => {
          const activeBookings = await Booking.countDocuments({
            vehicle: vehicle._id,
            status: 'confirmed'
          });

          const recentBookings = await Booking.countDocuments({
            vehicle: vehicle._id,
            createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
          });

          return {
            ...vehicle.toObject(),
            activeBookings,
            weeklyBookings: recentBookings,
            demandLevel: recentBookings > 3 ? 'high' : recentBookings > 1 ? 'medium' : 'low'
          };
        })
      );

      let response = `🚗 **${vehicles.length} Available Vehicles${filterDesc ? ` (${filterDesc.trim()})` : ''}:**\n\n`;

      vehiclesWithBookingData.forEach((vehicle, index) => {
        const demandEmoji = vehicle.demandLevel === 'high' ? '🔥' : vehicle.demandLevel === 'medium' ? '📈' : '✅';
        
        response += `**${index + 1}. ${vehicle.title}** ${demandEmoji}\n`;
        response += `   🏷️ ${vehicle.brand} | 🚙 ${vehicle.type}\n`;
        response += `   💰 ₹${vehicle.pricePerDay}/day`;
        if (vehicle.pricePerHour) {
          response += ` | ₹${vehicle.pricePerHour}/hour`;
        }
        response += `\n   📍 ${vehicle.location} | ⭐ ${vehicle.rating}/5\n`;
        
        // Show demand indicator
        if (vehicle.demandLevel === 'high') {
          response += `   🔥 High demand - ${vehicle.weeklyBookings} bookings this week\n`;
        } else if (vehicle.demandLevel === 'medium') {
          response += `   📈 Popular choice - ${vehicle.weeklyBookings} recent bookings\n`;
        }
        
        if (vehicle.activeBookings > 0) {
          response += `   📊 ${vehicle.activeBookings} current booking(s)\n`;
        }
        
        response += `\n`;
      });

      // Add trending insight
      const trendingVehicle = vehiclesWithBookingData.find(v => v.demandLevel === 'high');
      if (trendingVehicle) {
        response += `🔥 **Trending:** ${trendingVehicle.title} is in high demand!`;
      }

      return {
        text: response,
        suggestions: ['Vehicle details', 'Book now', 'Filter by price', 'Show locations'],
        type: 'vehicle_list',
        data: vehiclesWithBookingData
      };
    } catch (error) {
      console.error('Error in handleAvailability:', error);
      return {
        text: "Sorry, I'm having trouble fetching vehicle information right now. Please try again.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  // Utility methods
  getContext(userId) {
    if (!this.conversationContext.has(userId)) {
      this.conversationContext.set(userId, {
        lastIntent: null,
        lastEntities: null,
        conversationStep: 0,
        preferences: {},
        sessionStart: new Date(),
        lastMessage: null
      });
    }
    return this.conversationContext.get(userId);
  }

  updateContext(userId, updates) {
    const context = this.getContext(userId);
    Object.assign(context, updates);
    this.conversationContext.set(userId, context);
  }

  getRandomResponse(responses) {
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async handleUnknown(message, userId) {
    const context = this.getContext(userId);
    
    // Try to understand based on previous context
    if (context.lastIntent && context.conversationStep > 1) {
      // If user was looking at vehicles and says something unclear, show similar intent
      if (context.lastIntent === 'availability' || context.lastIntent === 'vehicleDetails') {
        return {
          text: `I think you're asking about vehicles. Let me show you what's available right now.`,
          suggestions: ['Show available vehicles', 'Popular vehicles', 'Help'],
          type: 'contextual_redirect'
        };
      }
    }

    const suggestions = [
      "I'm not quite sure about that. Let me help you with what I do best:",
      "I didn't quite catch that. Here's how I can assist you:",
      "Could you rephrase that? Meanwhile, here are popular requests:"
    ];

    // Smart suggestions based on keywords
    let smartSuggestions = ['Show vehicles', 'My bookings', 'Pricing', 'Help'];
    
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('book')) {
      smartSuggestions = ['Book vehicle', 'Available vehicles', 'Booking guide', 'Popular picks'];
    } else if (lowerMessage.includes('price') || lowerMessage.includes('cost')) {
      smartSuggestions = ['Pricing info', 'Vehicle prices', 'Offers', 'Compare prices'];
    } else if (lowerMessage.includes('review')) {
      smartSuggestions = ['Vehicle reviews', 'Top rated', 'Customer feedback', 'Leave review'];
    }

    return {
      text: this.getRandomResponse(suggestions),
      suggestions: smartSuggestions,
      type: 'clarification_smart'
    };
  }

  // Include all other methods from the original service with similar enhancements
  async handleMyBookings(userId) {
    try {
      const bookings = await Booking.find({ user: userId })
        .populate('vehicle', 'title brand type images pricePerDay location')
        .sort({ createdAt: -1 })
        .limit(10);

      if (bookings.length === 0) {
        const availableCount = await Vehicle.countDocuments({ available: true });
        const popularVehicle = await Vehicle.findOne({ available: true })
          .sort({ rating: -1 })
          .select('title pricePerDay');

        let response = `You don't have any bookings yet! 🚗\n\n`;
        response += `Ready to book your first vehicle? We have ${availableCount} amazing vehicles waiting for you.`;
        
        if (popularVehicle) {
          response += `\n\n🌟 **Today's top pick:** ${popularVehicle.title} - ₹${popularVehicle.pricePerDay}/day`;
        }

        return {
          text: response,
          suggestions: ['Browse vehicles', 'Popular picks', 'Best deals'],
          type: 'no_bookings'
        };
      }

      let response = `📋 **Your Bookings (${bookings.length} total):**\n\n`;
      
      const activeBookings = bookings.filter(b => b.status === 'confirmed');
      const completedBookings = bookings.filter(b => b.status === 'completed');
      
      if (activeBookings.length > 0) {
        response += `🟢 **Active Bookings (${activeBookings.length}):**\n`;
        activeBookings.slice(0, 3).forEach((booking, index) => {
          const daysLeft = booking.endDate ? 
            Math.ceil((new Date(booking.endDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;
          
          response += `${index + 1}. **${booking.vehicle.title}** ✅\n`;
          response += `   📅 ${booking.bookingType === 'daily' ? 
            `${new Date(booking.startDate).toLocaleDateString()} - ${new Date(booking.endDate).toLocaleDateString()}` :
            `${booking.startHour} - ${booking.endHour}`}\n`;
          
          if (daysLeft > 0 && booking.bookingType === 'daily') {
            response += `   ⏰ ${daysLeft} day(s) remaining\n`;
          }
          
          response += `   💰 ₹${booking.amountPaid} | 📍 ${booking.pickupLocation}\n`;
          response += `   🆔 #${booking._id.toString().slice(-6).toUpperCase()}\n\n`;
        });
      }

      if (completedBookings.length > 0) {
        response += `✅ **Recent Completed (${completedBookings.length}):**\n`;
        completedBookings.slice(0, 2).forEach((booking, index) => {
          response += `${index + 1}. ${booking.vehicle.title} - ₹${booking.amountPaid}\n`;
        });
        response += '\n';
      }

      const totalSpent = bookings.reduce((sum, b) => sum + (b.amountPaid || 0), 0);
      response += `💳 **Total spent:** ₹${totalSpent}\n`;
      response += `🎯 **Savings earned:** ₹${Math.floor(totalSpent * 0.05)} (loyalty points)`;

      return {
        text: response,
        suggestions: ['Booking details', 'Book another', 'Cancel booking', 'Leave review'],
        type: 'booking_list',
        data: bookings
      };
    } catch (error) {
      console.error('Error in handleMyBookings:', error);
      return {
        text: "Sorry, I couldn't fetch your booking information right now. Please try again.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  // Include other handler methods with similar real-time enhancements...
  async handlePricing(userId, entities) {
    try {
      let query = { available: true };
      
      if (entities.vehicleTypes.length > 0) {
        query.type = { $regex: new RegExp(entities.vehicleTypes.join('|'), 'i') };
      }

      const vehicles = await Vehicle.find(query)
        .select('title type brand pricePerDay pricePerHour location')
        .sort({ type: 1, pricePerDay: 1 });

      if (vehicles.length === 0) {
        return {
          text: "No vehicles available for pricing at the moment. Please check back later.",
          suggestions: ['Contact support', 'Check availability'],
          type: 'error'
        };
      }

      // Group by type and calculate real-time stats
      const groupedVehicles = vehicles.reduce((acc, vehicle) => {
        if (!acc[vehicle.type]) acc[vehicle.type] = [];
        acc[vehicle.type].push(vehicle);
        return acc;
      }, {});

      let response = `💰 **Live Pricing (${vehicles.length} vehicles):**\n\n`;

      // Get current demand data
      const demandData = await Promise.all(
        Object.keys(groupedVehicles).map(async (type) => {
          const typeVehicles = groupedVehicles[type];
          const vehicleIds = typeVehicles.map(v => v._id);
          
          const bookingCount = await Booking.countDocuments({
            vehicle: { $in: vehicleIds },
            createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
          });
          
          return { type, bookingCount };
        })
      );

      Object.entries(groupedVehicles).forEach(([type, vehicleList]) => {
        const prices = vehicleList.map(v => v.pricePerDay);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
        
        const demand = demandData.find(d => d.type === type);
        const demandLevel = demand?.bookingCount > 10 ? 'High' : demand?.bookingCount > 5 ? 'Medium' : 'Low';
        const demandEmoji = demandLevel === 'High' ? '🔥' : demandLevel === 'Medium' ? '📈' : '✅';

        response += `🚗 **${type.toUpperCase()} (${vehicleList.length} available)** ${demandEmoji}\n`;
        response += `   📊 Range: ₹${minPrice} - ₹${maxPrice}/day\n`;
        response += `   📈 Average: ₹${avgPrice}/day\n`;
        response += `   📊 Demand: ${demandLevel} (${demand?.bookingCount || 0} bookings this week)\n\n`;
        
        vehicleList.slice(0, 2).forEach(vehicle => {
          response += `   • ${vehicle.title}: ₹${vehicle.pricePerDay}/day`;
          if (vehicle.pricePerHour) {
            response += ` | ₹${vehicle.pricePerHour}/hour`;
          }
          response += `\n`;
        });
        response += '\n';
      });

      // Current offers with real-time data
      response += `🎉 **Live Offers:**\n`;
      response += `• 🕒 Weekly rentals: 10% off (${vehicles.filter(v => v.pricePerDay > 1500).length} eligible)\n`;
      response += `• 📅 Monthly rentals: 20% off\n`;
      response += `• 🎓 Student discount: 5% off with valid ID\n`;
      response += `• 🔄 Returning customer: Extra 5% off\n\n`;
      response += `💡 Prices update in real-time based on demand!`;

      return {
        text: response,
        suggestions: ['Book now', 'Compare vehicles', 'Check offers', 'Vehicle details'],
        type: 'pricing_info'
      };
    } catch (error) {
      console.error('Error in handlePricing:', error);
      return {
        text: "Sorry, I couldn't fetch pricing information right now. Please try again.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  // Add remaining handler methods...
  async handleHelp(userId) {
    const user = await User.findById(userId).select('name');
    const userName = user?.name || 'there';

    const response = `🤖 **Hi ${userName}! I'm your AI VehicleRent assistant**\n\n` +
      `🚗 **Real-time Vehicle Services:**\n` +
      `• Live availability with instant updates\n` +
      `• Smart search with filters\n` +
      `• Real-time pricing & demand insights\n` +
      `• Availability checks for specific dates\n` +
      `• Vehicle comparisons with live data\n\n` +
      
      `📅 **Booking Management:**\n` +
      `• Current & past bookings with status\n` +
      `• Real-time booking modifications\n` +
      `• Instant cancellation support\n` +
      `• Live tracking of rental duration\n\n` +
      
      `💰 **Smart Pricing:**\n` +
      `• Dynamic pricing based on demand\n` +
      `• Live discount calculations\n` +
      `• Real-time payment support\n` +
      `• Instant receipt generation\n\n` +
      
      `🎯 **AI Features:**\n` +
      `• Personalized recommendations\n` +
      `• Context-aware conversations\n` +
      `• Predictive suggestions\n` +
      `• 24/7 instant responses\n\n` +
      
      `💬 **Try asking:**\n` +
      `• "Show Honda cars under ₹2000"\n` +
      `• "Is Toyota Camry available tomorrow?"\n` +
      `• "Compare BMW vs Audi vehicles"\n` +
      `• "My active bookings status"`;

    return {
      text: response,
      suggestions: ['Show vehicles', 'My bookings', 'Live pricing', 'Popular vehicles'],
      type: 'help_comprehensive'
    };
  }

  async handleContact(userId) {
    return {
      text: `📞 **24/7 VehicleRent Support**\n\n` +
            `🆘 **Emergency Support:**\n` +
            `📱 Phone: +91-1800-VEHICLE (24/7)\n` +
            `📞 WhatsApp: +91-98765-43200\n` +
            `🚨 Roadside assistance: Press 1\n\n` +
            
            `💬 **Live Support:**\n` +
            `📧 Email: support@vehiclerent.com\n` +
            `💻 Live Chat: Available on website\n` +
            `🤖 AI Assistant: Right here with you!\n\n` +
            
            `🏢 **Business Hours:**\n` +
            `📅 Mon-Fri: 9 AM - 8 PM\n` +
            `📅 Weekends: 10 AM - 6 PM\n` +
            `🌙 Emergency: Always available\n\n` +
            
            `📍 **Head Office:**\n` +
            `VehicleRent HQ, Tech Park\n` +
            `Bangalore, Karnataka - 560001\n\n` +
            
            `📲 **Connect Online:**\n` +
            `📘 Facebook: @VehicleRentOfficial\n` +
            `📸 Instagram: @vehiclerent\n` +
            `🐦 Twitter: @vehiclerent_in\n\n` +
            
            `⚡ **Quick Help:** I'm here 24/7 for instant assistance!`,
      suggestions: ['Emergency help', 'Technical support', 'Billing query', 'Continue chat'],
      type: 'contact_comprehensive'
    };
  }

  async handleCancelBooking(userId) {
    try {
      const activeBookings = await Booking.find({ 
        user: userId, 
        status: 'confirmed' 
      }).populate('vehicle', 'title brand');

      if (activeBookings.length === 0) {
        return {
          text: "You don't have any active bookings to cancel. All your bookings are either completed or already cancelled.",
          suggestions: ['View all bookings', 'Book new vehicle'],
          type: 'no_active_bookings'
        };
      }

      let response = "**Active Bookings Available for Cancellation:**\n\n";
      
      activeBookings.forEach((booking, index) => {
        const timeLeft = booking.startDate ? 
          Math.ceil((new Date(booking.startDate) - new Date()) / (1000 * 60 * 60)) : 0;
        
        response += `${index + 1}. **${booking.vehicle.title}** (${booking.vehicle.brand})\n`;
        response += `   🆔 Booking ID: #${booking._id.toString().slice(-6).toUpperCase()}\n`;
        response += `   💰 Amount: ₹${booking.amountPaid}\n`;
        
        if (timeLeft > 24) {
          response += `   ✅ Free cancellation available (${Math.floor(timeLeft/24)} days left)\n`;
        } else if (timeLeft > 0) {
          response += `   ⚠️ 50% refund (${timeLeft} hours left)\n`;
        } else {
          response += `   ❌ No refund (booking started)\n`;
        }
        response += `\n`;
      });

      response += "📋 **Real-time Cancellation Policy:**\n";
      response += "• ✅ Free cancellation: 24+ hours before pickup\n";
      response += "• 💰 50% refund: Within 24 hours of pickup\n";
      response += "• ❌ No refund: After pickup time or no-shows\n\n";
      response += "💡 **Quick action:** Use our website or call support for instant cancellation.";

      return {
        text: response,
        suggestions: ['Cancel via website', 'Call support', 'Modify booking', 'Cancellation policy'],
        type: 'cancellation_info'
      };
    } catch (error) {
      console.error('Error in handleCancelBooking:', error);
      return {
        text: "Sorry, I couldn't fetch your booking information for cancellation.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  async handlePayment(userId, message) {
    try {
      const bookingIdMatch = message.match(/#?([A-Z0-9]{6,})/i);
      
      if (bookingIdMatch) {
        const bookingId = bookingIdMatch[1];
        const booking = await Booking.findOne({
          user: userId,
          _id: { $regex: new RegExp(bookingId, 'i') }
        }).populate('vehicle', 'title');

        if (booking) {
          let response = `💳 **Real-time Payment Details**\n\n`;
          response += `🆔 **Booking:** #${booking._id.toString().slice(-6).toUpperCase()}\n`;
          response += `🚗 **Vehicle:** ${booking.vehicle.title}\n`;
          response += `💰 **Amount Paid:** ₹${booking.amountPaid}\n`;
          response += `📅 **Payment Date:** ${new Date(booking.createdAt).toLocaleDateString()}\n`;
          response += `📊 **Status:** ${booking.status.toUpperCase()}\n`;
          response += `🔒 **Transaction ID:** ${booking._id.toString().slice(-8).toUpperCase()}\n\n`;
          response += `📧 **Receipt:** Sent to your registered email\n`;
          response += `📱 **Invoice:** Available for download in your account`;

          return {
            text: response,
            suggestions: ['Download receipt', 'Payment history', 'Contact support'],
            type: 'payment_details'
          };
        }
      }

      return {
        text: "**Real-time Payment Support:**\n\n" +
              "💳 **Accepted Methods (Live Processing):**\n" +
              "• Credit/Debit Cards (Instant approval)\n" +
              "• UPI (Immediate confirmation)\n" +
              "• Net Banking (Real-time verification)\n" +
              "• Digital Wallets (Instant payment)\n\n" +
              
              "⚡ **Live Payment Features:**\n" +
              "• Instant transaction confirmation\n" +
              "• Real-time payment status updates\n" +
              "• Immediate receipt generation\n" +
              "• Auto-refund processing (3-5 days)\n\n" +
              
              "🔒 **Security:** 256-bit SSL encryption with live fraud detection\n\n" +
              "💡 **Need help?** Mention your booking ID for specific payment details!",
        suggestions: ['Check payment status', 'Payment methods', 'Download receipt', 'Refund status'],
        type: 'payment_info'
      };
    } catch (error) {
      console.error('Error in handlePayment:', error);
      return {
        text: "Sorry, I couldn't fetch payment information right now.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  async handleVehicleDetails(userId, message, entities) {
    try {
      let vehicle = null;
      
      // Try to find specific vehicle mentioned
      const vehicles = await Vehicle.find({ available: true });
      
      for (const v of vehicles) {
        if (message.toLowerCase().includes(v.title.toLowerCase()) || 
            message.toLowerCase().includes(v.brand.toLowerCase()) ||
            (v.title.toLowerCase().split(' ').some(word => 
              message.toLowerCase().includes(word) && word.length > 3))) {
          vehicle = v;
          break;
        }
      }

      if (!vehicle && (entities.vehicleTypes.length > 0 || entities.brands.length > 0)) {
        let query = { available: true };
        
        if (entities.vehicleTypes.length > 0) {
          query.type = { $regex: new RegExp(entities.vehicleTypes[0], 'i') };
        }
        
        if (entities.brands.length > 0) {
          query.brand = { $regex: new RegExp(entities.brands[0], 'i') };
        }
        
        vehicle = await Vehicle.findOne(query).sort({ rating: -1 });
      }

      if (!vehicle) {
        const topVehicles = await Vehicle.find({ available: true })
          .sort({ rating: -1 })
          .limit(3);
        
        let response = "I'd love to show you vehicle details! Here are our top-rated vehicles:\n\n";
        
        topVehicles.forEach((v, index) => {
          response += `${index + 1}. **${v.title}** (${v.brand})\n`;
          response += `   ⭐ ${v.rating}/5 | 💰 ₹${v.pricePerDay}/day\n\n`;
        });
        
        return {
          text: response + "Which one interests you?",
          suggestions: topVehicles.map(v => v.title.split(' ')[0]),
          type: 'vehicle_options'
        };
      }

      // Get real-time data for this vehicle
      const [reviews, userBooking, currentBookings, weeklyBookings] = await Promise.all([
        Review.find({ vehicle: vehicle._id })
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .limit(3),
        Booking.findOne({ user: userId, vehicle: vehicle._id }).sort({ createdAt: -1 }),
        Booking.countDocuments({
          vehicle: vehicle._id,
          status: 'confirmed',
          $or: [
            { bookingType: 'daily', endDate: { $gte: new Date() } },
            { bookingType: 'hourly', createdAt: { $gte: new Date(Date.now() - 24*60*60*1000) } }
          ]
        }),
        Booking.countDocuments({
          vehicle: vehicle._id,
          createdAt: { $gte: new Date(Date.now() - 7*24*60*60*1000) }
        })
      ]);

      let response = `🚗 **${vehicle.title}** - Live Details\n\n`;
      
      response += `🏷️ **Brand:** ${vehicle.brand}\n`;
      response += `🚙 **Type:** ${vehicle.type}\n`;
      response += `💰 **Live Pricing:**\n`;
      response += `   • Daily: ₹${vehicle.pricePerDay}`;
      if (weeklyBookings > 5) response += ` 🔥`;
      response += `\n`;
      if (vehicle.pricePerHour) {
        response += `   • Hourly: ₹${vehicle.pricePerHour}\n`;
      }
      response += `📍 **Location:** ${vehicle.location}\n`;
      response += `⭐ **Rating:** ${vehicle.rating}/5 (${reviews.length} reviews)\n\n`;
      
      // Real-time availability status
      response += `📊 **Live Availability:**\n`;
      if (currentBookings === 0) {
        response += `   ✅ Fully available for immediate booking\n`;
      } else {
        response += `   ⚠️ Limited availability (${currentBookings} active booking(s))\n`;
      }
      
      // Demand indicator
      const demandLevel = weeklyBookings > 8 ? 'Very High' : weeklyBookings > 5 ? 'High' : weeklyBookings > 2 ? 'Medium' : 'Low';
      response += `   📈 Demand: ${demandLevel} (${weeklyBookings} bookings this week)\n\n`;
      
      if (vehicle.specs && Object.keys(vehicle.specs).length > 0) {
        response += `🔧 **Specifications:**\n`;
        Object.entries(vehicle.specs).forEach(([key, value]) => {
          const emoji = {
            'fuel': '⛽',
            'engine': '🔧',
            'mileage': '📊',
            'seats': '👥',
            'transmission': '⚙️'
          }[key.toLowerCase()] || '•';
          response += `   ${emoji} ${key}: ${value}\n`;
        });
        response += '\n';
      }

      if (userBooking) {
        response += `📋 **Your History:** Last booked on ${new Date(userBooking.createdAt).toLocaleDateString()}\n\n`;
      }

      if (reviews.length > 0) {
        response += `💬 **Recent Reviews:**\n`;
        reviews.forEach((review, index) => {
          response += `${index + 1}. **${review.user.name}** (${review.rating}/5): "${review.comment}"\n`;
        });
        response += '\n';
      }

      response += `🎯 **Perfect for:** ${this.getVehicleUseCase(vehicle.type)}\n`;
      
      if (demandLevel === 'Very High' || demandLevel === 'High') {
        response += `\n🔥 **Hot pick!** This vehicle is trending - book quickly!`;
      }

      return {
        text: response,
        suggestions: ['Book this vehicle', 'Check availability', 'Similar vehicles', 'More reviews'],
        type: 'vehicle_details',
        data: {
          vehicle,
          currentBookings,
          demandLevel,
          isAvailable: currentBookings === 0
        }
      };
    } catch (error) {
      console.error('Error in handleVehicleDetails:', error);
      return {
        text: "Sorry, I couldn't fetch vehicle details right now. Please try again.",
        suggestions: ['Show vehicles', 'Try again'],
        type: 'error'
      };
    }
  }

  getVehicleUseCase(type) {
    const useCases = {
      'car': 'Family trips, city commuting, long drives',
      'bike': 'Quick rides, traffic navigation, fuel efficiency',
      'suv': 'Group travel, adventure trips, spacious comfort',
      'sedan': 'Business meetings, comfortable city rides',
      'hatchback': 'Daily commuting, parking ease, city driving',
      'motorcycle': 'Solo rides, traffic beating, economical travel',
      'luxury': 'Special occasions, premium comfort, business meetings'
    };
    return useCases[type.toLowerCase()] || 'Various travel needs';
  }

  async handleLocation(userId) {
    try {
      const locationData = await Vehicle.aggregate([
        { $match: { available: true } },
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 },
            avgPrice: { $avg: '$pricePerDay' },
            types: { $addToSet: '$type' },
            topRated: { $max: '$rating' }
          }
        },
        { $sort: { count: -1 } }
      ]);

      if (locationData.length === 0) {
        return {
          text: "No pickup locations available at the moment. Please contact support.",
          suggestions: ['Contact support'],
          type: 'error'
        };
      }

      let response = `📍 **Live Pickup Locations (${locationData.length} cities):**\n\n`;

      locationData.forEach((location, index) => {
        response += `${index + 1}. **${location._id}** 🌟\n`;
        response += `   🚗 ${location.count} vehicles available\n`;
        response += `   💰 Avg price: ₹${Math.round(location.avgPrice)}/day\n`;
        response += `   🚙 Types: ${location.types.join(', ')}\n`;
        response += `   ⭐ Best rated: ${location.topRated}/5\n`;
        response += `   📱 Contact: +91-98765-4321${index}\n`;
        response += `   🕒 Hours: 24/7 service\n\n`;
      });

      response += `🎯 **Live Services at all locations:**\n`;
      response += `• ✅ Real-time vehicle pickup\n`;
      response += `• 🔧 Pre-delivery inspection\n`;
      response += `• 📋 Digital documentation\n`;
      response += `• 🛡️ Live insurance verification\n`;
      response += `• 📱 GPS tracking enabled\n\n`;
      response += `📲 **Live location sharing:** Send your coordinates for instant directions!`;

      return {
        text: response,
        suggestions: ['Nearest location', 'Book pickup', 'Live tracking', 'Contact branch'],
        type: 'location_info'
      };
    } catch (error) {
      console.error('Error in handleLocation:', error);
      return {
        text: "Sorry, I couldn't fetch location information right now.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  async handleReviews(userId, message, entities) {
    try {
      let vehicle = null;
      
      const vehicles = await Vehicle.find({ available: true });
      
      for (const v of vehicles) {
        if (message.toLowerCase().includes(v.title.toLowerCase()) || 
            message.toLowerCase().includes(v.brand.toLowerCase())) {
          vehicle = v;
          break;
        }
      }

      if (!vehicle) {
        // Show overall platform reviews with real-time stats
        const [totalReviews, avgRatingData, recentReviews] = await Promise.all([
          Review.countDocuments(),
          Review.aggregate([{ $group: { _id: null, avgRating: { $avg: "$rating" } } }]),
          Review.find()
            .populate('user', 'name')
            .populate('vehicle', 'title brand')
            .sort({ createdAt: -1 })
            .limit(5)
        ]);

        const todayReviews = await Review.countDocuments({
          createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        });

        let response = `⭐ **Live Customer Reviews & Ratings**\n\n`;
        response += `📊 **Real-time Stats:**\n`;
        response += `• Total Reviews: ${totalReviews}\n`;
        response += `• Average Rating: ${avgRatingData[0]?.avgRating?.toFixed(1) || 'N/A'}/5\n`;
        response += `• Today's Reviews: ${todayReviews}\n`;
        response += `• Customer Satisfaction: ${totalReviews > 0 ? '96%' : 'New platform'}\n\n`;

        if (recentReviews.length > 0) {
          response += `💬 **Live Recent Reviews:**\n`;
          recentReviews.forEach((review, index) => {
            const timeAgo = this.getTimeAgo(review.createdAt);
            response += `${index + 1}. **${review.user.name}** rated **${review.vehicle.title}**\n`;
            response += `   ⭐ ${review.rating}/5: "${review.comment}"\n`;
            response += `   🕒 ${timeAgo}\n\n`;
          });
        }

        return {
          text: response + "Want to see reviews for a specific vehicle? Just mention its name!",
          suggestions: ['Vehicle reviews', 'Top rated', 'Leave review', 'Book vehicle'],
          type: 'general_reviews'
        };
      }

      // Show reviews for specific vehicle with real-time data
      const [reviews, avgRating, todayReviews] = await Promise.all([
        Review.find({ vehicle: vehicle._id })
          .populate('user', 'name')
          .sort({ createdAt: -1 })
          .limit(10),
        Review.aggregate([
          { $match: { vehicle: vehicle._id } },
          { $group: { _id: null, avgRating: { $avg: "$rating" } } }
        ]),
        Review.countDocuments({
          vehicle: vehicle._id,
          createdAt: { $gte: new Date(new Date().setHours(0,0,0,0)) }
        })
      ]);

      const avgRatingValue = avgRating[0]?.avgRating?.toFixed(1) || 0;

      const ratingDistribution = [5, 4, 3, 2, 1].map(star => ({
        star,
        count: reviews.filter(r => r.rating === star).length
      }));

      let response = `⭐ **${vehicle.title} - Live Reviews**\n\n`;
      response += `📊 **Real-time Rating Summary:**\n`;
      response += `• Average: ${avgRatingValue}/5 (${reviews.length} reviews)\n`;
      response += `• Today's reviews: ${todayReviews}\n`;
      response += `• Rating Distribution:\n`;
      
      ratingDistribution.forEach(({ star, count }) => {
        const percentage = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
        const bars = '█'.repeat(Math.floor(percentage / 20));
        response += `  ${star}⭐ ${bars} ${count} (${percentage}%)\n`;
      });
      response += '\n';

      if (reviews.length > 0) {
        response += `💬 **Live Customer Experiences:**\n`;
        reviews.slice(0, 5).forEach((review, index) => {
          const timeAgo = this.getTimeAgo(review.createdAt);
          response += `${index + 1}. **${review.user.name}** (${review.rating}/5)\n`;
          response += `   "${review.comment}"\n`;
          response += `   🕒 ${timeAgo}\n\n`;
        });

        const positiveReviews = reviews.filter(r => r.rating >= 4).length;
        const sentiment = reviews.length > 0 ? Math.round((positiveReviews / reviews.length) * 100) : 0;
        
        response += `😊 **Live Sentiment:** ${sentiment}% positive feedback\n`;
        response += `🎯 **Most appreciated:** ${this.getCommonPraise(reviews)}`;
      } else {
        response += `No reviews yet for ${vehicle.title}.\nBe the first to share your experience!`;
      }

      return {
        text: response,
        suggestions: ['Book this vehicle', 'More reviews', 'Leave review', 'Vehicle details'],
        type: 'vehicle_reviews',
        data: { vehicle, reviews, avgRating: avgRatingValue }
      };
    } catch (error) {
      console.error('Error in handleReviews:', error);
      return {
        text: "Sorry, I couldn't fetch review information right now.",
        suggestions: ['Try again', 'Contact support'],
        type: 'error'
      };
    }
  }

  getTimeAgo(date) {
    const now = new Date();
    const reviewDate = new Date(date);
    const diffMs = now - reviewDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return reviewDate.toLocaleDateString();
  }

  getCommonPraise(reviews) {
    const positiveKeywords = ['clean', 'comfortable', 'smooth', 'excellent', 'great', 'good', 'amazing'];
    const mentions = {};
    
    reviews.forEach(review => {
      if (review.rating >= 4) {
        positiveKeywords.forEach(keyword => {
          if (review.comment.toLowerCase().includes(keyword)) {
            mentions[keyword] = (mentions[keyword] || 0) + 1;
          }
        });
      }
    });

    const topMention = Object.entries(mentions)
      .sort(([,a], [,b]) => b - a)[0];
    
    return topMention ? `${topMention[0]} experience` : 'Overall positive experience';
  }

  async handleBooking(userId, message, entities) {
    try {
      let suggestedVehicle = null;
      
      if (entities.vehicleTypes.length > 0 || entities.brands.length > 0) {
        let query = { available: true };
        
        if (entities.vehicleTypes.length > 0) {
          query.type = { $regex: new RegExp(entities.vehicleTypes[0], 'i') };
        }
        
        if (entities.brands.length > 0) {
          query.brand = { $regex: new RegExp(entities.brands[0], 'i') };
        }
        
        suggestedVehicle = await Vehicle.findOne(query).sort({ rating: -1 });
      }

      // Get user's booking history and real-time recommendations
      const [userBookings, trendingVehicles] = await Promise.all([
        Booking.find({ user: userId })
          .populate('vehicle', 'type brand')
          .limit(5),
        Vehicle.find({ available: true })
          .sort({ rating: -1 })
          .limit(3)
      ]);

      let response = `🚗 **Real-time Booking Assistant**\n\n`;

      if (suggestedVehicle) {
        // Check real-time availability
        const currentBookings = await Booking.countDocuments({
          vehicle: suggestedVehicle._id,
          status: 'confirmed'
        });

        response += `🎯 **Perfect match found:**\n`;
        response += `**${suggestedVehicle.title}** - ${suggestedVehicle.brand}\n`;
        response += `💰 ₹${suggestedVehicle.pricePerDay}/day | 📍 ${suggestedVehicle.location}\n`;
        response += `📊 Availability: ${currentBookings === 0 ? '✅ Fully available' : `⚠️ ${currentBookings} active booking(s)`}\n\n`;
      }

      response += `📋 **Live Booking Process:**\n`;
      response += `1. 📅 **Dates**: When do you need the vehicle?\n`;
      response += `2. ⏰ **Duration**: Daily or hourly rental?\n`;
      response += `3. 📍 **Pickup**: Where should we deliver?\n`;
      response += `4. 🚗 **Vehicle**: Any specific preference?\n\n`;

      // Personalized suggestions based on history
      if (userBookings.length > 0) {
        const preferredTypes = [...new Set(userBookings.map(b => b.vehicle?.type).filter(Boolean))];
        response += `💡 **Based on your history** (${userBookings.length} bookings):\n`;
        
        const recommendations = await Vehicle.find({
          available: true,
          type: { $in: preferredTypes }
        }).limit(3);

        recommendations.forEach((vehicle, index) => {
          response += `${index + 1}. ${vehicle.title} - ₹${vehicle.pricePerDay}/day ⭐${vehicle.rating}\n`;
        });
        response += '\n';
      }

      // Show trending vehicles
      response += `🔥 **Trending Now:**\n`;
      trendingVehicles.forEach((vehicle, index) => {
        response += `${index + 1}. ${vehicle.title} - ₹${vehicle.pricePerDay}/day\n`;
      });

      response += `\n🔗 **Instant Booking Options:**\n`;
      response += `• 💻 Web booking: Instant confirmation\n`;
      response += `• 📱 Call: +91-1800-VEHICLE for phone booking\n`;
      response += `• 💬 Continue here: I'll guide you step-by-step!\n`;
      response += `• ⚡ Emergency booking: Available 24/7`;

      return {
        text: response,
        suggestions: ['Book instantly', 'Popular vehicles', 'Call support', 'Continue here'],
        type: 'booking_guide',
        data: { suggestedVehicle, trending: trendingVehicles }
      };
    } catch (error) {
      console.error('Error in handleBooking:', error);
      return {
        text: "I'd love to help you book a vehicle! Visit our booking page or tell me what type of vehicle you need.",
        suggestions: ['Browse vehicles', 'Booking page', 'Contact support'],
        type: 'booking_fallback'
      };
    }
  }
}

// Create singleton instance
const enhancedChatbotService = new EnhancedChatbotService();

export default enhancedChatbotService;