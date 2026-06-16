import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, FileText, CheckCircle, AlertCircle, Clock, Plus, Edit2, Eye, Trash2, LogOut, User, Bell, Settings, ChevronRight } from 'lucide-react';
import { AnimatedButton, AnimatedCard, AnimatedCounter, FloatingParticles, SkeletonLoader } from '@/components/AnimatedComponents';
import { containerVariants, itemVariants, float } from '@/lib/animations';

export const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [notifications, setNotifications] = useState(3);

  // Mock user data
  const user = {
    name: 'Thabo Mthembu',
    email: 'thabo@example.com',
    avatar: '👨‍💼',
    profileComplete: 85,
  };

  // Mock bookings
  const bookings = [
    {
      id: 1,
      testType: 'Learner\'s Licence',
      licenseCode: 'Code B (LV)',
      date: '2024-07-15',
      time: '09:00 AM',
      center: 'Johannesburg Test Center',
      status: 'confirmed',
    },
    {
      id: 2,
      testType: 'Driver\'s Licence',
      licenseCode: 'Code B (PrDP)',
      date: '2024-08-20',
      time: '02:30 PM',
      center: 'Pretoria Test Center',
      status: 'pending',
    },
  ];

  // Mock documents
  const documents = [
    {
      id: 1,
      name: 'National ID Copy',
      uploadDate: '2024-06-10',
      status: 'approved',
      size: '2.4 MB',
    },
    {
      id: 2,
      name: 'Proof of Residence',
      uploadDate: '2024-06-12',
      status: 'verified',
      size: '1.8 MB',
    },
    {
      id: 3,
      name: 'Medical Certificate',
      uploadDate: '2024-06-14',
      status: 'pending',
      size: '3.2 MB',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'pending':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
      case 'approved':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'verified':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Floating Particles */}
      <FloatingParticles count={15} colors={['#2563eb', '#10b981', '#f59e0b']} />

      {/* Sticky Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <motion.a href="/" className="flex items-center gap-2 font-bold text-2xl" whileHover={{ scale: 1.05 }}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              🚗
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">eDLTS</span>
          </motion.a>

          {/* Right Actions */}
          <div className="flex items-center gap-6">
            {/* Notifications */}
            <motion.button
              className="relative p-2 hover:bg-slate-800 rounded-lg transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-6 h-6" />
              {notifications > 0 && (
                <motion.span
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {notifications}
                </motion.span>
              )}
            </motion.button>

            {/* Settings */}
            <motion.button
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              whileHover={{ scale: 1.1, rotate: 20 }}
              whileTap={{ scale: 0.95 }}
            >
              <Settings className="w-6 h-6" />
            </motion.button>

            {/* User Avatar */}
            <motion.button
              className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg transition-colors"
              whileHover={{ backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
            >
              <span className="text-2xl">{user.avatar}</span>
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <motion.div
            className="mb-12"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-5xl font-bold mb-2">
                {getGreeting()}, <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
              </h1>
              <p className="text-slate-400 text-lg">Here's your driving license journey at a glance</p>
            </motion.div>

            {/* Quick Stats */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Profile Complete', value: user.profileComplete, unit: '%', icon: User, color: 'from-blue-600 to-blue-700' },
                { label: 'Scheduled Tests', value: bookings.length, unit: '', icon: Calendar, color: 'from-green-600 to-green-700' },
                { label: 'Documents', value: documents.length, unit: '', icon: FileText, color: 'from-purple-600 to-purple-700' },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={i}
                    className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 text-white`}
                    whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-90 mb-1">{stat.label}</p>
                        <p className="text-4xl font-bold">
                          <AnimatedCounter to={stat.value} duration={2} suffix={stat.unit} />
                        </p>
                      </div>
                      <Icon className="w-12 h-12 opacity-20" />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.div>

          {/* Main Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-8">
              {/* Profile Card */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <User className="w-6 h-6" />
                  Your Profile
                </h2>

                <AnimatedCard hoverable>
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
                      <div className="flex items-center gap-4 mb-4 md:mb-0">
                        <span className="text-6xl">{user.avatar}</span>
                        <div>
                          <h3 className="text-xl font-bold dark:text-white">{user.name}</h3>
                          <p className="text-slate-600 dark:text-slate-400">{user.email}</p>
                        </div>
                      </div>
                      <AnimatedButton variant="primary" size="md" className="flex items-center gap-2">
                        <Edit2 className="w-4 h-4" />
                        Edit Profile
                      </AnimatedButton>
                    </div>

                    {/* Profile Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">Profile Completion</span>
                        <span className="text-sm font-bold text-blue-500">{user.profileComplete}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                          initial={{ width: 0 }}
                          animate={{ width: `${user.profileComplete}%` }}
                          transition={{ duration: 1.5, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </AnimatedCard>
              </motion.div>

              {/* Upcoming Bookings */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="w-6 h-6" />
                    Upcoming Tests
                  </h2>
                  <AnimatedButton variant="primary" size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Book Test
                  </AnimatedButton>
                </div>

                <div className="space-y-4">
                  {bookings.map((booking, i) => (
                    <motion.div
                      key={booking.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ x: 5, backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
                      className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold">{booking.testType}</h3>
                            <motion.span
                              className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                            </motion.span>
                          </div>
                          <div className="space-y-1 text-slate-400">
                            <p className="text-sm">📜 License Code: {booking.licenseCode}</p>
                            <p className="text-sm">📅 {new Date(booking.date).toLocaleDateString()} at {booking.time}</p>
                            <p className="text-sm">📍 {booking.center}</p>
                          </div>
                        </div>
                        <motion.div className="flex gap-2" whileHover={{ scale: 1.05 }}>
                          <AnimatedButton variant="outline" size="sm" className="flex items-center gap-2">
                            <Eye className="w-4 h-4" />
                          </AnimatedButton>
                          <AnimatedButton variant="outline" size="sm" className="flex items-center gap-2">
                            <Edit2 className="w-4 h-4" />
                          </AnimatedButton>
                        </motion.div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Documents */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Uploaded Documents
                  </h2>
                  <AnimatedButton variant="primary" size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Upload
                  </AnimatedButton>
                </div>

                <div className="space-y-3">
                  {documents.map((doc, i) => (
                    <motion.div
                      key={doc.id}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 flex items-center justify-between hover:bg-slate-800/70 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <motion.div
                          className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center"
                          animate={{ rotate: [0, 5, 0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 4 }}
                        >
                          <FileText className="w-6 h-6 text-blue-400" />
                        </motion.div>
                        <div className="flex-1">
                          <p className="font-semibold dark:text-white">{doc.name}</p>
                          <p className="text-sm text-slate-400">{new Date(doc.uploadDate).toLocaleDateString()} • {doc.size}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <motion.span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(doc.status)}`}
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 3 }}
                        >
                          {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                        </motion.span>
                        <motion.button
                          whileHover={{ scale: 1.1, color: '#ef4444' }}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              {/* Quick Actions */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  {[
                    { icon: Calendar, label: 'Book a Test', color: 'from-blue-600 to-blue-700' },
                    { icon: FileText, label: 'Upload Documents', color: 'from-green-600 to-green-700' },
                    { icon: Eye, label: 'Track Application', color: 'from-purple-600 to-purple-700' },
                    { icon: User, label: 'My Profile', color: 'from-orange-600 to-orange-700' },
                  ].map((action, i) => {
                    const Icon = action.icon;
                    return (
                      <motion.button
                        key={i}
                        className={`w-full bg-gradient-to-br ${action.color} text-white rounded-lg p-4 flex items-center gap-3 font-semibold transition-all duration-300`}
                        whileHover={{ y: -3, boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        viewport={{ once: true }}
                      >
                        <Icon className="w-5 h-5" />
                        {action.label}
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>

              {/* Help & Support */}
              <motion.div
                className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="text-lg font-bold mb-2">Need Help?</h3>
                <p className="text-slate-400 text-sm mb-4">Our support team is here to assist you 24/7</p>
                <AnimatedButton variant="primary" size="sm" className="w-full justify-center">
                  Contact Support
                </AnimatedButton>
              </motion.div>

              {/* Info Card */}
              <motion.div
                className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Important Reminders
                </h3>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>• Arrive 15 mins early for your test</li>
                  <li>• Bring your ID and appointment letter</li>
                  <li>• Keep documents updated</li>
                  <li>• Check center hours before visiting</li>
                </ul>
              </motion.div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
