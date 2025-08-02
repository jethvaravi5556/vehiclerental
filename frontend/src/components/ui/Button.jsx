// components/ui/Button.jsx
import { forwardRef } from "react"
import { motion } from "framer-motion"
import LoadingSpinner from "./LoadingSpinner"

const Button = forwardRef(({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  ...props
}, ref) => {
  // Base styles
  const baseClasses = "inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"

  // Variant styles
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl focus:ring-blue-500 border-0",
    secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 shadow-sm hover:shadow-md",
    outline: "bg-transparent text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500 hover:border-gray-400",
    ghost: "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-blue-500",
    danger: "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl focus:ring-red-500 border-0",
    success: "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl focus:ring-green-500 border-0",
    warning: "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg hover:shadow-xl focus:ring-yellow-500 border-0"
  }

  // Size styles
  const sizes = {
    xs: "px-2 py-1 text-xs rounded-md",
    sm: "px-3 py-1.5 text-sm rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-xl",
    xl: "px-8 py-4 text-lg rounded-xl"
  }

  // Combine classes
  const buttonClasses = `${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`

  // Handle click with loading state
  const handleClick = (e) => {
    if (loading || disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
  }

  return (
    <motion.button
      ref={ref}
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      {...props}
    >
      {/* Ripple effect overlay */}
      <motion.div
        className="absolute inset-0 bg-white/20 rounded-inherit"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2 }}
      />
      
      {/* Loading spinner */}
      {loading && (
        <LoadingSpinner 
          size={size === "xs" || size === "sm" ? "sm" : "md"} 
          className="mr-2" 
        />
      )}
      
      {/* Button content */}
      <span className="relative z-10 flex items-center">
        {children}
      </span>
    </motion.button>
  )
})

Button.displayName = "Button"

export default Button