// components/ui/LoadingSpinner.jsx
import { motion } from "framer-motion"

const LoadingSpinner = ({ 
  size = "md", 
  className = "",
  color = "blue" 
}) => {
  // Size configurations
  const sizes = {
    xs: "w-3 h-3",
    sm: "w-4 h-4", 
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
    "2xl": "w-16 h-16"
  }

  // Color configurations
  const colors = {
    blue: "border-blue-600",
    white: "border-white",
    gray: "border-gray-600",
    green: "border-green-600",
    red: "border-red-600",
    yellow: "border-yellow-600",
    purple: "border-purple-600"
  }

  return (
    <motion.div
      className={`${sizes[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div
        className={`w-full h-full rounded-full border-2 border-transparent ${colors[color]} border-t-transparent`}
        style={{
          borderTopColor: 'transparent',
          borderRightColor: 'currentColor',
          borderBottomColor: 'currentColor',
          borderLeftColor: 'currentColor'
        }}
      />
    </motion.div>
  )
}

export default LoadingSpinner