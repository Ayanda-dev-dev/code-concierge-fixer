import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { AnimatedButton, AnimatedInput, AnimatedCheckbox, FloatingParticles, AnimatedCard } from '@/components/AnimatedComponents';
import { containerVariants, itemVariants, confettiPiece } from '@/lib/animations';

export const RegistrationPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    // Step 2
    idNumber: '',
    dateOfBirth: '',
    idType: 'national',
    // Step 3
    address: '',
    city: '',
    province: '',
    postalCode: '',
    password: '',
    confirmPassword: '',
    // Step 4
    acceptTerms: false,
    acceptPopia: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const steps = [
    { number: 1, title: 'Personal Info', description: 'Tell us about yourself' },
    { number: 2, title: 'ID & DOB', description: 'Verify your identity' },
    { number: 3, title: 'Address & Password', description: 'Secure your account' },
    { number: 4, title: 'Review & Consent', description: 'Accept terms' },
  ];

  // Validation functions
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[\d\s\-+()]{10,}$/.test(phone);
  const validateIdNumber = (id: string) => /^\d{13}$/.test(id);
  const validatePassword = (password: string) => password.length >= 8;

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!validateEmail(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      else if (!validatePhone(formData.phone)) newErrors.phone = 'Invalid phone number';
    }

    if (step === 2) {
      if (!formData.idNumber.trim()) newErrors.idNumber = 'ID number is required';
      else if (!validateIdNumber(formData.idNumber)) newErrors.idNumber = 'SA ID must be 13 digits';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (step === 3) {
      if (!formData.address.trim()) newErrors.address = 'Street address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.province) newErrors.province = 'Province is required';
      if (!formData.postalCode.trim()) newErrors.postalCode = 'Postal code is required';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (!validatePassword(formData.password)) newErrors.password = 'Password must be at least 8 characters';
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    }

    if (step === 4) {
      if (!formData.acceptTerms) newErrors.acceptTerms = 'You must accept the terms and conditions';
      if (!formData.acceptPopia) newErrors.acceptPopia = 'You must accept the POPIA consent';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 4) {
        handleSubmit();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      setShowConfetti(true);
      setTimeout(() => {
        // Redirect to dashboard or login
        console.log('Registration complete:', formData);
      }, 2000);
    }, 2000);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  // Confetti animation
  const Confetti = () => {
    return (
      <div className="fixed inset-0 pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-10px`,
              backgroundColor: ['#FF0000', '#FFD700', '#007A5E', '#0033A0', '#10b981', '#3b82f6'][Math.floor(Math.random() * 6)],
            }}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{
              y: window.innerHeight + 20,
              x: (Math.random() - 0.5) * 300,
              opacity: 0,
              scale: 0,
              rotate: Math.random() * 360,
            }}
            transition={{ duration: 2.5 }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden py-12 px-4">
      {/* Floating Particles */}
      <FloatingParticles count={15} colors={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']} />

      {showConfetti && <Confetti />}

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
      <div className="max-w-4xl mx-auto pt-20">
        {/* Progress Steps */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, i) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <motion.div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${
                    step.number < currentStep
                      ? 'bg-green-500 text-white'
                      : step.number === currentStep
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-700 text-slate-400'
                  }`}
                  whileHover={{ scale: 1.1 }}
                >
                  {step.number < currentStep ? '✓' : step.number}
                </motion.div>

                {/* Line to next step */}
                {i < steps.length - 1 && (
                  <motion.div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                      step.number < currentStep ? 'bg-green-500' : 'bg-slate-700'
                    }`}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: step.number < currentStep ? 1 : 0 }}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step Description */}
          <motion.div
            key={`step-${currentStep}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold mb-2">{steps[currentStep - 1].title}</h2>
            <p className="text-slate-400">{steps[currentStep - 1].description}</p>
          </motion.div>
        </motion.div>

        {/* Form Card */}
        <motion.div
          className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 md:p-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatedInput
                    label="First Name"
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    error={errors.firstName}
                  />
                  <AnimatedInput
                    label="Last Name"
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    error={errors.lastName}
                  />
                </div>

                <AnimatedInput
                  label="Email Address"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  error={errors.email}
                />

                <AnimatedInput
                  label="Phone Number"
                  type="tel"
                  placeholder="+27 123 456 7890"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  error={errors.phone}
                />
              </motion.div>
            )}

            {/* Step 2: ID & DOB */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">ID Type</label>
                  <div className="flex gap-4">
                    {['national', 'passport', 'foreign'].map((type) => (
                      <motion.button
                        key={type}
                        onClick={() => handleInputChange('idType', type)}
                        className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                          formData.idType === type
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                            : 'bg-slate-700 text-slate-300 border border-slate-600 hover:border-slate-500'
                        }`}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {type === 'national' ? '🆔' : type === 'passport' ? '📕' : '🌍'} {type.charAt(0).toUpperCase() + type.slice(1)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <AnimatedInput
                  label={formData.idType === 'national' ? 'SA ID Number (13 digits)' : 'Document Number'}
                  type="text"
                  placeholder={formData.idType === 'national' ? 'e.g. 9001015001234' : 'Document number'}
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  error={errors.idNumber}
                />

                <AnimatedInput
                  label="Date of Birth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  error={errors.dateOfBirth}
                />
              </motion.div>
            )}

            {/* Step 3: Address & Password */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <AnimatedInput
                  label="Street Address"
                  type="text"
                  placeholder="123 Main Street"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  error={errors.address}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <AnimatedInput
                    label="City"
                    type="text"
                    placeholder="Johannesburg"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    error={errors.city}
                  />
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Province</label>
                    <select
                      value={formData.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className="w-full px-4 py-2 border-2 border-slate-600 rounded-lg bg-slate-900/50 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">Select Province</option>
                      {['Gauteng', 'Western Cape', 'Eastern Cape', 'KwaZulu-Natal', 'Limpopo', 'Mpumalanga', 'Northern Cape', 'North West', 'Free State'].map((prov) => (
                        <option key={prov} value={prov}>{prov}</option>
                      ))}
                    </select>
                    {errors.province && <p className="text-red-500 text-sm mt-1">{errors.province}</p>}
                  </div>
                </div>

                <AnimatedInput
                  label="Postal Code"
                  type="text"
                  placeholder="2000"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  error={errors.postalCode}
                />

                <AnimatedInput
                  label="Password"
                  type="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  error={errors.password}
                />

                <AnimatedInput
                  label="Confirm Password"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                />
              </motion.div>
            )}

            {/* Step 4: Review & Consent */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Summary Cards */}
                <div className="space-y-4 mb-8">
                  {[
                    { title: 'Personal Info', data: `${formData.firstName} ${formData.lastName}` },
                    { title: 'Email', data: formData.email },
                    { title: 'ID Number', data: formData.idNumber },
                    { title: 'Address', data: `${formData.address}, ${formData.city}` },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <span className="text-slate-400">{item.title}</span>
                      <span className="font-semibold">{item.data}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Consent Checkboxes */}
                <motion.div
                  className="space-y-4 border-t border-slate-700 pt-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <AnimatedCheckbox
                    checked={formData.acceptTerms}
                    onChange={(v) => handleInputChange('acceptTerms', v)}
                    label="I accept the Terms and Conditions"
                  />
                  {errors.acceptTerms && <p className="text-red-500 text-sm">{errors.acceptTerms}</p>}

                  <AnimatedCheckbox
                    checked={formData.acceptPopia}
                    onChange={(v) => handleInputChange('acceptPopia', v)}
                    label="I consent to POPIA (Protection of Personal Information Act) compliance"
                  />
                  {errors.acceptPopia && <p className="text-red-500 text-sm">{errors.acceptPopia}</p>}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div
          className="mt-8 flex gap-4 justify-between"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedButton
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </AnimatedButton>

          <AnimatedButton
            variant="primary"
            size="lg"
            onClick={handleNext}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1 }}
                />
                Creating Account...
              </>
            ) : (
              <>
                {currentStep === 4 ? 'Complete Registration' : 'Next'}
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </AnimatedButton>
        </motion.div>
      </div>
    </div>
  );
};

export default RegistrationPage;
