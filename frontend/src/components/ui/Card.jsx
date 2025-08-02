// components/ui/Card.jsx
import { forwardRef } from "react"
import { motion } from "framer-motion"

const Card = forwardRef(({
  children,
  className = "",
  hover = true,
  padding = true,
  shadow = "md",
  border = true,
  gradient = false,
  onClick,
  ...props
}, ref) => {
  // Base classes
  const baseClasses = "bg-white rounded-xl transition-all duration-300"
  
  // Shadow variations
  const shadows = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl"
  }

  // Hover effects
  const hoverClasses = hover ? `hover:${shadows.lg} hover:-translate-y-1` : ""
  
  // Border classes
  const borderClasses = border ? "border border-gray-200" : "border-0"
  
  // Padding classes
  const paddingClasses = padding ? "p-6" : ""
  
  // Gradient background
  const gradientClasses = gradient ? "bg-gradient-to-br from-white to-gray-50" : ""

  // Combine all classes
  const cardClasses = `
    ${baseClasses} 
    ${shadows[shadow]} 
    ${hoverClasses} 
    ${borderClasses} 
    ${paddingClasses}
    ${gradientClasses}
    ${onClick ? 'cursor-pointer' : ''}
    ${className}
  `.trim().replace(/\s+/g, ' ')

  const CardComponent = onClick ? motion.div : 'div'
  const motionProps = onClick ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 },
    transition: { type: "spring", stiffness: 400, damping: 17 }
  } : {}

  return (
    <CardComponent
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      {...motionProps}
      {...props}
    >
      {children}
    </CardComponent>
  )
})

Card.displayName = "Card"

export default Card