import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, LogIn } from 'lucide-react';
import { AnimatedButton, AnimatedInput, AnimatedCheckbox, AnimatedCard, FloatingParticles } from '@/components/AnimatedComponents';
import { containerVariants, itemVariants } from '@/lib/animations';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState<'applicant' | 'admin'>('applicant');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Password strength calculator
  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^a-zA-Z0-9]/.test(pass)) strength++;
    return strength;
  };

  const passwordStrength = calculatePasswordStrength(password);
  const strengthLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const strengthColors = ['', 'bg-red-500', 'bg-amber-500', 'bg-blue-500', 'bg-green-500'];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({ email: '', password: '' });

    // Validation
    if (!email) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
      return;
    }
    if (!password) {
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      console.log('Login attempt:', { email, password, role, rememberMe });
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Floating Particles */}
      <FloatingParticles count={20} colors={['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']} />

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
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-400">Don't have an account?</span>
            <AnimatedButton variant="primary">Sign Up</AnimatedButton>
          </div>
        </div>
      </motion.nav>

      {/* Main Content */}
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 min-h-screen flex items-center justify-center">
        <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Animation */}
          <motion.div
            className="hidden lg:flex flex-col items-center justify-center gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Rotating Globe-like Element */}
            <motion.div
              className="relative w-64 h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 flex items-center justify-center"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              <motion.div
                className="text-6xl"
                animate={{
                  rotate: -360,
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                🔐
              </motion.div>

              {/* Orbiting elements */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-4 h-4 bg-blue-500 rounded-full"
                  animate={{
                    x: Math.cos((i / 3) * Math.PI * 2 + Date.now() / 1000) * 100,
                    y: Math.sin((i / 3) * Math.PI * 2 + Date.now() / 1000) * 100,
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4,
                    ease: 'linear',
                  }}
                />
              ))}
            </motion.div>

            {/* Text Content */}
            <motion.div variants={itemVariants} className="text-center max-w-md">
              <h2 className="text-4xl font-bold mb-4">Secure Login</h2>
              <p className="text-slate-400 text-lg">
                Access your eDLTS account with bank-level security. Your data is encrypted and protected.
              </p>
            </motion.div>

            {/* Feature List */}
            <motion.div variants={itemVariants} className="space-y-4 w-full max-w-md">
              {[
                { icon: '🔒', text: '256-bit Encryption' },
                { icon: '🛡️', text: 'Two-Factor Authentication' },
                { icon: '✅', text: 'POPIA Compliant' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50"
                  whileHover={{ x: 5, backgroundColor: 'rgba(51, 65, 85, 0.8)' }}
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <span className="text-slate-300">{feature.text}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Role Selector with Animation */}
            <motion.div variants={itemVariants} className="mb-8">
              <label className="block text-sm font-medium text-slate-300 mb-3">Login As</label>
              <div className="flex gap-4">
                {['applicant', 'admin'].map((r) => (
                  <motion.button
                    key={r}
                    onClick={() => setRole(r as any)}
                    className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-300 ${
                      role === r
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/50'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:border-slate-600'
                    }`}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {r === 'applicant' ? '👤 Applicant' : '⚙️ Admin'}
                  </motion.button>
                ))}
              </div>
            </motion.div>

            {/* Glassmorphic Card */}
            <motion.div
              variants={itemVariants}
              className="relative"
              whileHover={{ boxShadow: '0 20px 40px rgba(37, 99, 235, 0.2)' }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 rounded-2xl blur-xl" />

              <div className="relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                <h3 className="text-2xl font-bold mb-8">Welcome Back</h3>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <motion.div variants={itemVariants}>
                    <AnimatedInput
                      label="Email Address"
                      type="email"
                      placeholder="Enter your email"
                      icon={Mail}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      error={errors.email}
                    />
                  </motion.div>

                  {/* Password Field */}
                  <motion.div variants={itemVariants}>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                    <div className="relative">
                      <motion.input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className={`w-full px-4 py-2 pl-10 border-2 border-slate-600 rounded-lg bg-slate-900/50 text-white focus:outline-none transition-all duration-200 ${
                          errors.password ? 'border-red-500' : 'focus:border-blue-500 focus:shadow-lg focus:shadow-blue-500/20'
                        }`}
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                    {errors.password && (
                      <motion.p className="text-red-500 text-sm mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        {errors.password}
                      </motion.p>
                    )}

                    {/* Password Strength Indicator */}
                    {password && (
                      <motion.div
                        className="mt-3"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${strengthColors[passwordStrength]}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(passwordStrength / 4) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className={`text-xs font-semibold ${strengthColors[passwordStrength].replace('bg-', 'text-')}`}>
                            {strengthLabels[passwordStrength]}
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Remember & Forgot */}
                  <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <AnimatedCheckbox
                      checked={rememberMe}
                      onChange={setRememberMe}
                      label="Remember me"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-semibold transition-colors"
                      whileHover={{ x: 2 }}
                    >
                      Forgot Password?
                    </motion.button>
                  </motion.div>

                  {/* Login Button */}
                  <motion.div variants={itemVariants}>
                    <AnimatedButton
                      variant="primary"
                      size="lg"
                      onClick={handleLogin}
                      disabled={isLoading}
                      className="w-full justify-center"
                    >
                      {isLoading ? (
                        <motion.div className="flex items-center gap-2">
                          <motion.div
                            className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1 }}
                          />
                          Logging in...
                        </motion.div>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5 mr-2" />
                          Sign In
                        </>
                      )}
                    </AnimatedButton>
                  </motion.div>

                  {/* Divider */}
                  <motion.div variants={itemVariants} className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-600"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-slate-800/40 backdrop-blur-xl text-slate-400">Or continue with</span>
                    </div>
                  </motion.div>

                  {/* Social Login */}
                  <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
                    {['Google', 'Microsoft'].map((provider) => (
                      <motion.button
                        key={provider}
                        type="button"
                        className="py-2 px-4 rounded-lg bg-slate-700/50 border border-slate-600 hover:border-slate-500 transition-all duration-200"
                        whileHover={{ y: -2, boxShadow: '0 10px 25px rgba(37, 99, 235, 0.1)' }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {provider === 'Google' ? '🔍' : '⊞'} {provider}
                      </motion.button>
                    ))}
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Sign Up Link */}
            <motion.p variants={itemVariants} className="text-center mt-6 text-slate-400">
              New to eDLTS?{' '}
              <motion.a
                href="/register"
                className="text-blue-400 font-semibold hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                whileHover={{ x: 2 }}
              >
                Create an account <ArrowRight className="w-4 h-4" />
              </motion.a>
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowForgotModal(false)}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-bold mb-4">Reset Password</h3>
              <p className="text-slate-400 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>

              <AnimatedInput
                label="Email Address"
                type="email"
                placeholder="your@email.com"
                icon={Mail}
              />

              <div className="flex gap-4 mt-8">
                <AnimatedButton
                  variant="outline"
                  size="md"
                  className="flex-1 justify-center"
                  onClick={() => setShowForgotModal(false)}
                >
                  Cancel
                </AnimatedButton>
                <AnimatedButton
                  variant="primary"
                  size="md"
                  className="flex-1 justify-center"
                  onClick={() => setShowForgotModal(false)}
                >
                  Send Reset Link
                </AnimatedButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
