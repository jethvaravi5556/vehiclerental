"use client"

import { motion } from "framer-motion"
import HeroSection from "../components/home/HeroSection"
import SearchSection from "../components/home/SearchSection"
import FeaturedVehicles from "../components/home/FeaturedVehicles"
import StatsSection from "../components/home/StatsSection"
import TestimonialsSection from "../components/home/TestimonialsSection"

const HomePage = ({ navigate }) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen">
      <HeroSection navigate={navigate} />
      <SearchSection navigate={navigate} />
      <FeaturedVehicles navigate={navigate} />
      <StatsSection />
      <TestimonialsSection />
    </motion.div>
  )
}

export default HomePage
