import { motion } from "framer-motion"
import { Users, Car, MapPin, Award } from "lucide-react"

const StatsSection = () => {
  const stats = [
    {
      icon: Users,
      number: "10,000+",
      label: "Happy Customers",
      description: "Satisfied customers worldwide",
    },
    {
      icon: Car,
      number: "500+",
      label: "Premium Vehicles",
      description: "Latest models available",
    },
    {
      icon: MapPin,
      number: "50+",
      label: "Cities",
      description: "Locations across the country",
    },
    {
      icon: Award,
      number: "99%",
      label: "Satisfaction Rate",
      description: "Customer satisfaction guaranteed",
    },
  ]

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Thousands</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">Join our growing community of satisfied customers</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-8 w-8" />
              </div>
              <motion.div
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                viewport={{ once: true }}
                className="text-3xl md:text-4xl font-bold mb-2"
              >
                {stat.number}
              </motion.div>
              <h3 className="text-lg font-semibold mb-2">{stat.label}</h3>
              <p className="text-sm opacity-80">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSection
