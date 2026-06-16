import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle, Users, BookOpen, MapPin, FileText, Star, ArrowRight } from 'lucide-react';
import { AnimatedButton, AnimatedCard, FloatingParticles, AnimatedCounter, AnimatedGradientText } from '@/components/AnimatedComponents';
import { containerVariants, itemVariants, float, gradientShift } from '@/lib/animations';

export const LandingPage = () => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    {
      name: 'Thabo Mthembu',
      role: 'First-time Driver',
      image: '👨‍💼',
      text: 'The eDLTS platform made booking my driving test incredibly easy. The whole process took less than 10 minutes!',
      rating: 5,
    },
    {
      name: 'Nomsa Dlamini',
      role: 'Professional Driver',
      image: '👩‍💼',
      text: 'Finally, a government service that\'s actually user-friendly. No more long queues!',
      rating: 5,
    },
    {
      name: 'Johan van der Merwe',
      role: 'First-time Applicant',
      image: '👨‍🔧',
      text: 'The document upload feature is seamless. Everything worked perfectly on my phone.',
      rating: 5,
    },
  ];

  const services = [
    {
      icon: '📝',
      title: 'Easy Registration',
      description: 'Quick and secure account setup with POPIA compliance',
    },
    {
      icon: '📅',
      title: 'Book Tests',
      description: 'Schedule your driving test with flexible date and time options',
    },
    {
      icon: '📄',
      title: 'Upload Documents',
      description: 'Securely upload and track your application documents',
    },
    {
      icon: '🔍',
      title: 'Track Status',
      description: 'Real-time updates on your license application progress',
    },
    {
      icon: '🎯',
      title: 'Test Centers',
      description: 'Find nearby testing centers with directions and hours',
    },
    {
      icon: '✅',
      title: 'License Management',
      description: 'Manage your licenses and booking history in one place',
    },
  ];

  const stats = [
    { label: 'Active Users', value: 125000, suffix: '+' },
    { label: 'Tests Booked', value: 89000, suffix: '+' },
    { label: 'Test Centers', value: 45, suffix: '' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Floating Particles Background */}
      <FloatingParticles count={30} colors={['#FF0000', '#FFD700', '#007A5E', '#0033A0']} />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.div
            className="flex items-center gap-2 font-bold text-2xl"
            whileHover={{ scale: 1.05 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              🚗
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">eDLTS</span>
          </motion.div>
          <div className="flex items-center gap-6">
            <AnimatedButton variant="ghost" className="text-white">Login</AnimatedButton>
            <AnimatedButton variant="primary">Register Now</AnimatedButton>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              variants={itemVariants}
              className="text-5xl sm:text-6xl font-bold leading-tight mb-6"
            >
              Your Driver's License,
              <br />
              <AnimatedGradientText className="text-5xl sm:text-6xl block mt-2">
                Simplified
              </AnimatedGradientText>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-xl text-slate-300 mb-8 max-w-lg"
            >
              Welcome to eDLTS - South Africa's modern digital driver licensing platform. Register, book tests, upload documents, and track your license all in one place.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-4"
            >
              <AnimatedButton variant="primary" size="lg" className="w-full sm:w-auto justify-center">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </AnimatedButton>
              <AnimatedButton variant="outline" size="lg" className="w-full sm:w-auto justify-center">
                Learn More
              </AnimatedButton>
            </motion.div>

            {/* Features List */}
            <motion.div variants={itemVariants} className="mt-12 space-y-3">
              {['Secure & POPIA Compliant', 'Lightning Fast', '24/7 Available'].map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3"
                  whileHover={{ x: 5 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-slate-300">{feature}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Animation - Floating 3D License Card */}
          <motion.div
            className="relative h-96 hidden lg:flex items-center justify-center"
            animate={{
              rotateY: [0, 360],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            <motion.div
              className="relative w-80 h-52 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 p-6 shadow-2xl"
              style={{
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Card Content */}
              <div className="relative z-10 text-amber-900 h-full flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold">South Africa</div>
                  <div className="text-sm">Driver's License</div>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-xs opacity-75">LICENSE NUMBER</div>
                    <div className="font-mono font-bold">12345678</div>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-white/30 backdrop-blur flex items-center justify-center font-bold text-lg">
                    🚗
                  </div>
                </div>
              </div>

              {/* Rotating border effect */}
              <motion.div
                className="absolute inset-0 rounded-2xl border-2 border-transparent"
                animate={{
                  borderColor: ['#FF0000', '#FFD700', '#007A5E', '#0033A0', '#FF0000'],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                }}
              />
            </motion.div>

            {/* Floating particles around card */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-blue-500 rounded-full"
                animate={{
                  x: Math.cos((i / 5) * Math.PI * 2) * 150,
                  y: Math.sin((i / 5) * Math.PI * 2) * 150,
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4 + i,
                  ease: 'linear',
                }}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl p-8 text-center border border-slate-600/50"
              >
                <motion.div
                  className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                >
                  <AnimatedCounter from={0} to={stat.value} duration={2} suffix={stat.suffix} />
                </motion.div>
                <p className="text-slate-400 mt-4 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-slate-400 text-lg">Everything you need for your driver's license journey</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {services.map((service, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)' }}
              >
                <AnimatedCard className="h-full">
                  <div className="p-6">
                    <div className="text-5xl mb-4">{service.icon}</div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{service.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{service.description}</p>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-4">What Users Say</h2>
            <p className="text-slate-400 text-lg">Join thousands of satisfied users</p>
          </motion.div>

          <div className="relative">
            <motion.div
              key={activeTestimonial}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-8 border border-slate-600/50"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="text-5xl">{testimonials[activeTestimonial].image}</div>
                <div>
                  <h4 className="text-lg font-bold">{testimonials[activeTestimonial].name}</h4>
                  <p className="text-slate-400">{testimonials[activeTestimonial].role}</p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonials[activeTestimonial].rating)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
                ))}
              </div>

              <p className="text-slate-300 text-lg italic">{testimonials[activeTestimonial].text}</p>
            </motion.div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {testimonials.map((_, i) => (
                <motion.button
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    i === activeTestimonial ? 'bg-blue-500 w-8' : 'bg-slate-600'
                  }`}
                  onClick={() => setActiveTestimonial(i)}
                  whileHover={{ scale: 1.2 }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                backgroundPosition: ['0%', '100%', '0%'],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
              }}
            />

            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of South Africans who have simplified their driver's license process with eDLTS
              </p>
              <AnimatedButton variant="primary" size="lg">
                Register Your Account <ArrowRight className="ml-2 w-5 h-5" />
              </AnimatedButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700/50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <motion.div whileHover={{ y: -5 }}>
              <h4 className="font-bold text-lg mb-4">eDLTS</h4>
              <p className="text-slate-400">South Africa's modern driver licensing platform</p>
            </motion.div>
            {['Product', 'Services', 'Support', 'Legal'].map((section, i) => (
              <motion.div key={i} whileHover={{ y: -5 }}>
                <h4 className="font-bold text-lg mb-4">{section}</h4>
                <ul className="space-y-2 text-slate-400">
                  <li><a href="#" className="hover:text-white transition-colors">Link 1</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Link 2</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Link 3</a></li>
                </ul>
              </motion.div>
            ))}
          </div>

          <div className="border-t border-slate-700/50 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-slate-400">© 2024 eDLTS. All rights reserved.</p>
              <div className="flex gap-6 mt-4 md:mt-0">
                {['Facebook', 'Twitter', 'LinkedIn'].map((social, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    className="text-slate-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.2, rotate: 5 }}
                  >
                    {social}
                  </motion.a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
