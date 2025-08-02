import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Calendar, Car, Clock } from "lucide-react"
import Button from "../ui/Button"
import Input from "../ui/Input"
import { useNavigate } from "react-router-dom";

const SearchSection = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    location: "",
    pickupDate: "",
    returnDate: "",
    pickupTime: "",
    returnTime: "",
    vehicleType: "",
    searchType: "daily", // 'daily' or 'hourly'
  })

  const handleSearch = (e) => {
    e.preventDefault()
    
    // Create URL search params with search data
    const params = new URLSearchParams()
    
    // Only add parameters if they have values
    if (searchData.location) params.set("location", searchData.location)
    if (searchData.vehicleType) params.set("type", searchData.vehicleType)
    
    // Add search type
    params.set("searchType", searchData.searchType)
    
    if (searchData.searchType === "daily") {
      if (searchData.pickupDate) params.set("pickupDate", searchData.pickupDate)
      if (searchData.returnDate) params.set("returnDate", searchData.returnDate)
    } else {
      // For hourly search, use same date with different times
      if (searchData.pickupDate) params.set("pickupDate", searchData.pickupDate)
      if (searchData.pickupTime) params.set("pickupTime", searchData.pickupTime)
      if (searchData.returnTime) params.set("returnTime", searchData.returnTime)
    }
    
    // Add search mode indicator
    params.set("search", "true")
    
    // Navigate to vehicles page with search parameters
    navigate(`/vehicles?${params.toString()}`)
  }

  const vehicleTypes = [
    { value: "", label: "All Types" },
    { value: "car", label: "Cars" },
    { value: "cycle", label: "Cycle" },
    { value: "bike", label: "Bikes" },
    { value: "suv", label: "SUVs" },
    { value: "luxury", label: "Luxury" },
    { value: "sedan", label: "Sedan" },
    // { value: "hatchback", label: "Hatchback" },
    { value: "truck", label: "Trucks" },
    // { value: "convertible", label: "Convertible" },
  ]

  const getSearchDuration = () => {
    if (searchData.searchType === "daily" && searchData.pickupDate && searchData.returnDate) {
      const days = Math.ceil((new Date(searchData.returnDate) - new Date(searchData.pickupDate)) / (1000 * 60 * 60 * 24));
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (searchData.searchType === "hourly" && searchData.pickupTime && searchData.returnTime) {
      const [startH, startM] = searchData.pickupTime.split(":").map(Number);
      const [endH, endM] = searchData.returnTime.split(":").map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      let hours = Math.ceil((endMinutes - startMinutes) / 60);
      if (hours < 1) hours = 1;
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return null;
  }

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Find Your Perfect Vehicle
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search through our extensive collection of premium vehicles for your next adventure
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-xl max-w-5xl mx-auto shadow-2xl"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Search Type Selection */}
            <div className="text-center mb-6">
              <div className="inline-flex bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setSearchData(prev => ({ ...prev, searchType: "daily" }))}
                  className={`px-6 py-2 rounded-md transition-all font-medium ${
                    searchData.searchType === "daily" 
                      ? "bg-blue-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Calendar className="inline h-4 w-4 mr-2" />
                  Daily Rental
                </button>
                <button
                  type="button"
                  onClick={() => setSearchData(prev => ({ 
                    ...prev, 
                    searchType: "hourly",
                    returnDate: "", // Clear return date for hourly
                  }))}
                  className={`px-6 py-2 rounded-md transition-all font-medium ${
                    searchData.searchType === "hourly" 
                      ? "bg-purple-600 text-white shadow-md" 
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  <Clock className="inline h-4 w-4 mr-2" />
                  Hourly Rental
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Location Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Location
                </label>
                <Input
                  type="text"
                  placeholder="Enter city or area"
                  value={searchData.location}
                  onChange={(e) => setSearchData((prev) => ({ ...prev, location: e.target.value }))}
                  className="pl-4 transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                />
              </div>

              {/* Date Input */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  {searchData.searchType === "daily" ? "Pickup Date" : "Date"}
                </label>
                <Input
                  type="date"
                  value={searchData.pickupDate}
                  onChange={(e) => setSearchData((prev) => ({ ...prev, pickupDate: e.target.value }))}
                  min={new Date().toISOString().split("T")[0]}
                  className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                />
              </div>

              {/* Conditional Second Input */}
              {searchData.searchType === "daily" ? (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Return Date
                  </label>
                  <Input
                    type="date"
                    value={searchData.returnDate}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, returnDate: e.target.value }))}
                    min={searchData.pickupDate || new Date().toISOString().split("T")[0]}
                    className="transition-all duration-200 hover:border-blue-400 focus:border-blue-500"
                  />
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    Start Time
                  </label>
                  <Input
                    type="time"
                    value={searchData.pickupTime}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, pickupTime: e.target.value }))}
                    className="transition-all duration-200 hover:border-purple-400 focus:border-purple-500"
                  />
                </div>
              )}

              {/* Fourth Input - Vehicle Type or End Time */}
              {searchData.searchType === "hourly" ? (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="inline h-4 w-4 mr-1" />
                    End Time
                  </label>
                  <Input
                    type="time"
                    value={searchData.returnTime}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, returnTime: e.target.value }))}
                    className="transition-all duration-200 hover:border-purple-400 focus:border-purple-500"
                  />
                </div>
              ) : (
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Car className="inline h-4 w-4 mr-1" />
                    Vehicle Type
                  </label>
                  <select
                    value={searchData.vehicleType}
                    onChange={(e) => setSearchData((prev) => ({ ...prev, vehicleType: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:border-blue-400"
                  >
                    {vehicleTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Vehicle Type for Hourly (moved below) */}
            {searchData.searchType === "hourly" && (
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Car className="inline h-4 w-4 mr-1" />
                  Vehicle Type
                </label>
                <select
                  value={searchData.vehicleType}
                  onChange={(e) => setSearchData((prev) => ({ ...prev, vehicleType: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white/50 backdrop-blur-sm hover:border-purple-400"
                >
                  {vehicleTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search Button and Additional Info */}
            <div className="flex flex-col items-center space-y-4">
              <Button 
                type="submit" 
                size="lg" 
                className={`px-12 py-3 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 ${
                  searchData.searchType === "daily" 
                    ? "bg-blue-600 hover:bg-blue-700" 
                    : "bg-purple-600 hover:bg-purple-700"
                }`}
              >
                <Search className="mr-2 h-5 w-5" />
                Search Vehicles
              </Button>
              
              <p className="text-sm text-gray-600 text-center">
                {getSearchDuration() && (
                  <span className={`font-medium ${
                    searchData.searchType === "daily" ? "text-blue-600" : "text-purple-600"
                  }`}>
                    {getSearchDuration()} selected
                  </span>
                )}
              </p>
            </div>

            {/* Quick Search Options */}
            <div className="border-t border-white/20 pt-6">
              <p className="text-sm text-gray-600 mb-3 text-center">Quick Search:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {searchData.searchType === "daily" ? (
                  ["Today", "Weekend", "Next Week"].map((quickOption) => (
                    <button
                      key={quickOption}
                      type="button"
                      onClick={() => {
                        const today = new Date();
                        let pickup, returnDate;
                        
                        if (quickOption === "Today") {
                          pickup = today.toISOString().split("T")[0];
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          returnDate = tomorrow.toISOString().split("T")[0];
                        } else if (quickOption === "Weekend") {
                          const friday = new Date(today);
                          const daysUntilFriday = (5 - today.getDay() + 7) % 7;
                          friday.setDate(today.getDate() + daysUntilFriday);
                          pickup = friday.toISOString().split("T")[0];
                          
                          const sunday = new Date(friday);
                          sunday.setDate(friday.getDate() + 2);
                          returnDate = sunday.toISOString().split("T")[0];
                        } else if (quickOption === "Next Week") {
                          const nextWeek = new Date(today);
                          nextWeek.setDate(today.getDate() + 7);
                          pickup = nextWeek.toISOString().split("T")[0];
                          
                          const endNextWeek = new Date(nextWeek);
                          endNextWeek.setDate(nextWeek.getDate() + 7);
                          returnDate = endNextWeek.toISOString().split("T")[0];
                        }
                        
                        setSearchData(prev => ({
                          ...prev,
                          pickupDate: pickup,
                          returnDate: returnDate
                        }));
                      }}
                      className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 text-gray-700 rounded-full border border-white/30 hover:border-white/50 transition-all duration-200"
                    >
                      {quickOption}
                    </button>
                  ))
                ) : (
                  ["2 Hours", "4 Hours", "8 Hours"].map((quickOption) => (
                    <button
                      key={quickOption}
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const hours = parseInt(quickOption);
                        const endTime = new Date(now.getTime() + hours * 60 * 60 * 1000);
                        
                        const startTimeStr = now.toTimeString().slice(0, 5);
                        const endTimeStr = endTime.toTimeString().slice(0, 5);
                        
                        setSearchData(prev => ({
                          ...prev,
                          pickupDate: now.toISOString().split("T")[0],
                          pickupTime: startTimeStr,
                          returnTime: endTimeStr
                        }));
                      }}
                      className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 text-gray-700 rounded-full border border-white/30 hover:border-white/50 transition-all duration-200"
                    >
                      {quickOption}
                    </button>
                  ))
                )}
              </div>
            </div>
          </form>
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Search</h3>
              <p className="text-gray-600 text-sm">Find vehicles by location, dates, and preferences</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Flexible Booking</h3>
              <p className="text-gray-600 text-sm">Book for hours, days, or longer periods</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg border border-white/20">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Fleet</h3>
              <p className="text-gray-600 text-sm">Choose from our collection of quality vehicles</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default SearchSection