import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatedButton, AnimatedCard, FloatingParticles } from '@/components/AnimatedComponents';
import { containerVariants, itemVariants } from '@/lib/animations';

export const BookingPage = () => {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLicense, setSelectedLicense] = useState<string | null>(null);
  const [selectedCenter, setSelectedCenter] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(2024, 6, 1)); // July 2024

  // License types
  const licenseTypes = [
    { code: 'B', name: 'Code B (LV)', description: 'Light Vehicle', icon: '🚗' },
    { code: '10', name: 'Code 10 (MV)', description: 'Medium Vehicle', icon: '🚙' },
    { code: '14', name: 'Code 14 (HV)', description: 'Heavy Vehicle', icon: '🚚' },
    { code: 'EB', name: 'Code EB (MC)', description: 'Motorcycle', icon: '🏍️' },
  ];

  // Test centers
  const testCenters = [
    { id: 1, name: 'Johannesburg Test Center', location: 'Sandton, Gauteng', available: true },
    { id: 2, name: 'Pretoria Test Center', location: 'Arcadia, Gauteng', available: true },
    { id: 3, name: 'Cape Town Test Center', location: 'Century City, Western Cape', available: false },
    { id: 4, name: 'Durban Test Center', location: 'Berea, KwaZulu-Natal', available: true },
  ];

  // Time slots
  const timeSlots = [
    { time: '08:00 AM', available: true },
    { time: '09:00 AM', available: true },
    { time: '10:00 AM', available: false },
    { time: '11:00 AM', available: true },
    { time: '01:00 PM', available: true },
    { time: '02:00 PM', available: false },
    { time: '03:00 PM', available: true },
    { time: '04:00 PM', available: true },
  ];

  // Generate calendar days
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calendarDays: (number | null)[] = [];
  const firstDay = getFirstDayOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleDateSelect = (day: number | null) => {
    if (!day) return;
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(selected.toISOString().split('T')[0]);
  };

  const isDateSelected = (day: number | null) => {
    if (!day || !selectedDate) return false;
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return selected.toISOString().split('T')[0] === selectedDate;
  };

  const canProceed = () => {
    if (step === 1) return selectedLicense !== null;
    if (step === 2) return selectedCenter !== null;
    if (step === 3) return selectedDate !== null;
    if (step === 4) return selectedTime !== null;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden py-12 px-4">
      {/* Floating Particles */}
      <FloatingParticles count={15} colors={['#2563eb', '#3b82f6', '#60a5fa']} />

      {/* Navigation */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-700/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <motion.a href="/" className="flex items-center gap-2 font-bold text-2xl" whileHover={{ scale: 1.05 }}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              🚗
            </div>
            <span className="bg-gradient-to-r from-blue-400 to-amber-400 bg-clip-text text-transparent">eDLTS</span>
          </motion.a>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto pt-20">
        {/* Progress Steps */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            {[
              { num: 1, label: 'License Type' },
              { num: 2, label: 'Test Center' },
              { num: 3, label: 'Date' },
              { num: 4, label: 'Time Slot' },
              { num: 5, label: 'Review' },
            ].map((s, i) => (
              <div key={s.num} className="flex items-center flex-1">
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    step > s.num
                      ? 'bg-green-500 text-white'
                      : step === s.num
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-700 text-slate-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {step > s.num ? '✓' : s.num}
                </motion.div>

                {i < 4 && (
                  <motion.div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                      step > s.num ? 'bg-green-500' : 'bg-slate-700'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step > s.num ? 1 : 0 }}
                  />
                )}
              </div>
            ))}
          </div>

          <motion.h2
            key={`step-${step}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold text-center"
          >
            Step {step}: {step === 1 ? 'Select License Type' : step === 2 ? 'Choose Test Center' : step === 3 ? 'Pick a Date' : step === 4 ? 'Select Time Slot' : 'Review Booking'}
          </motion.h2>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {/* Step 1: License Type Selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
            >
              {licenseTypes.map((license, i) => (
                <motion.button
                  key={license.code}
                  onClick={() => setSelectedLicense(license.code)}
                  className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                    selectedLicense === license.code
                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500 shadow-lg shadow-blue-500/30'
                      : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                  }`}
                  whileHover={{ y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="text-4xl mb-3">{license.icon}</div>
                  <h3 className="font-bold text-lg mb-1">{license.name}</h3>
                  <p className="text-sm text-slate-400">{license.description}</p>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 2: Test Center Selection */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4 mb-8"
            >
              {testCenters.map((center, i) => (
                <motion.button
                  key={center.id}
                  onClick={() => selectedCenter !== center.id.toString() && center.available && setSelectedCenter(center.id.toString())}
                  className={`w-full p-6 rounded-xl border-2 transition-all duration-300 text-left ${
                    selectedCenter === center.id.toString()
                      ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500 shadow-lg shadow-blue-500/30'
                      : center.available
                        ? 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-800/30 border-slate-700 opacity-50 cursor-not-allowed'
                  }`}
                  whileHover={center.available ? { x: 5 } : {}}
                  whileTap={center.available ? { scale: 0.98 } : {}}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{center.name}</h3>
                      <p className="text-sm text-slate-400 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {center.location}
                      </p>
                    </div>
                    <motion.div
                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        center.available
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                      animate={center.available ? { scale: [1, 1.05, 1] } : {}}
                      transition={center.available ? { repeat: Infinity, duration: 2 } : {}}
                    >
                      {center.available ? 'Available' : 'Full'}
                    </motion.div>
                  </div>
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Step 3: Date Selection */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-8"
            >
              <AnimatedCard>
                <div className="p-8">
                  {/* Calendar Navigation */}
                  <div className="flex items-center justify-between mb-8">
                    <motion.button
                      onClick={handlePreviousMonth}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </motion.button>
                    <h3 className="text-2xl font-bold">{monthName}</h3>
                    <motion.button
                      onClick={handleNextMonth}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </motion.button>
                  </div>

                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-sm font-semibold text-slate-400">
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, i) => (
                      <motion.button
                        key={i}
                        onClick={() => handleDateSelect(day)}
                        disabled={!day}
                        className={`aspect-square rounded-lg font-semibold transition-all duration-300 ${
                          !day
                            ? 'opacity-0'
                            : isDateSelected(day)
                              ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                              : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                        whileHover={day ? { scale: 1.1 } : {}}
                        whileTap={day ? { scale: 0.95 } : {}}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.02 }}
                      >
                        {day}
                      </motion.button>
                    ))}
                  </div>

                  {selectedDate && (
                    <motion.div
                      className="mt-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-green-300">Selected: {new Date(selectedDate).toLocaleDateString()}</span>
                    </motion.div>
                  )}
                </div>
              </AnimatedCard>
            </motion.div>
          )}

          {/* Step 4: Time Slot Selection */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-8"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {timeSlots.map((slot, i) => (
                  <motion.button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    className={`p-4 rounded-lg border-2 font-semibold transition-all duration-300 ${
                      !slot.available
                        ? 'bg-slate-800/30 border-slate-700 opacity-50 cursor-not-allowed'
                        : selectedTime === slot.time
                          ? 'bg-gradient-to-br from-blue-600/20 to-blue-700/20 border-blue-500 shadow-lg shadow-blue-500/30'
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                    whileHover={slot.available ? { y: -5 } : {}}
                    whileTap={slot.available ? { scale: 0.98 } : {}}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4" />
                      {slot.time}
                    </div>
                    {!slot.available && <div className="text-xs text-slate-500 mt-1">Full</div>}
                  </motion.button>
                ))}
              </div>

              {selectedTime && (
                <motion.div
                  className="mt-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-center gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-300">Selected: {selectedTime}</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mb-8"
            >
              <AnimatedCard>
                <div className="p-8 space-y-6">
                  <div className="text-center mb-8">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold">Booking Summary</h3>
                    <p className="text-slate-400 mt-2">Please review your booking details</p>
                  </div>

                  {[
                    { label: 'License Type', value: licenseTypes.find((l) => l.code === selectedLicense)?.name },
                    { label: 'Test Center', value: testCenters.find((c) => c.id.toString() === selectedCenter)?.name },
                    { label: 'Date', value: selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '' },
                    { label: 'Time', value: selectedTime },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg border border-slate-600/50"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-slate-400">{item.label}</span>
                      <span className="font-bold">{item.value}</span>
                    </motion.div>
                  ))}

                  <motion.div
                    className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <p className="text-sm text-blue-300">
                      💡 A confirmation email will be sent to your registered email address with all booking details.
                    </p>
                  </motion.div>
                </div>
              </AnimatedCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          className="flex gap-4 justify-between mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={() => step > 1 && setStep(step - 1)}
            disabled={step === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </AnimatedButton>

          <AnimatedButton
            variant="primary"
            size="lg"
            onClick={() => {
              if (step === 5) {
                console.log('Booking confirmed!');
              } else {
                setStep(step + 1);
              }
            }}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            {step === 5 ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Confirm Booking
              </>
            ) : (
              <>
                Next <ChevronRight className="w-5 h-5" />
              </>
            )}
          </AnimatedButton>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingPage;
