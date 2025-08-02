"use client"

import { motion } from "framer-motion"
import { Star, Quote } from "lucide-react"
import Card from "../ui/Card"

const TestimonialsSection = () => {
  const testimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Business Executive",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
      text: "Amazing service! The car was in perfect condition and the booking process was seamless. Highly recommended for anyone looking for premium vehicle rentals.",
    },
    {
      id: 2,
      name: "Mike Chen",
      role: "Travel Blogger",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
      text: "I've used VehicleRent for multiple trips and they never disappoint. Great variety of vehicles and excellent customer support.",
    },
    {
      id: 3,
      name: "Emily Davis",
      role: "Photographer",
      avatar: "/placeholder.svg?height=60&width=60",
      rating: 5,
      text: "Perfect for my photography shoots! The luxury cars are well-maintained and the flexible rental options make it so convenient.",
    },
  ]

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">What Our Customers Say</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Don't just take our word for it - hear from our satisfied customers
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="relative">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-blue-200" />

                <div className="flex items-center space-x-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                  ))}
                </div>

                <p className="text-gray-600 mb-6 italic">"{testimonial.text}"</p>

                <div className="flex items-center space-x-3">
                  <img
                    src={testimonial.avatar || "/placeholder.svg"}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection
