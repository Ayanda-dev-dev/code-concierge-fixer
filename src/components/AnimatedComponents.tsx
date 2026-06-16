import React from 'react';
import { motion } from 'framer-motion';
import { animationConfig, fadeInUp, scaleIn, buttonHover } from '@/lib/animations';

/**
 * Animated Button Component
 * Features: Ripple effect, hover scale, color variants
 */
export const AnimatedButton = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}) => {
  const baseStyles = 'font-semibold transition-all duration-200 relative overflow-hidden';
  
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:shadow-blue-500/50',
    secondary: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/50',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : {}}
      whileTap={!disabled ? { scale: 0.98 } : {}}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      <span className="relative z-10">{children}</span>
      {/* Ripple effect */}
      <motion.div
        className="absolute inset-0 bg-white/20"
        initial={{ scale: 0, opacity: 1 }}
        whileTap={{ scale: 4, opacity: 0 }}
        transition={{ duration: 0.6 }}
      />
    </motion.button>
  );
};

/**
 * Animated Input Component
 * Features: Focus glow, label animation, error states
 */
export const AnimatedInput = ({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}: {
  label?: string;
  error?: string;
  icon?: any;
  className?: string;
  [key: string]: any;
}) => {
  const [isFocused, setIsFocused] = React.useState(false);

  return (
    <div className="w-full">
      {label && (
        <motion.label
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
          animate={isFocused ? { color: '#2563eb' } : {}}
        >
          {label}
        </motion.label>
      )}
      <div className="relative">
        {Icon && (
          <motion.div
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            animate={isFocused ? { color: '#2563eb', scale: 1.1 } : {}}
          >
            <Icon size={20} />
          </motion.div>
        )}
        <motion.input
          className={`w-full px-4 py-2 ${Icon ? 'pl-10' : ''} border-2 border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none transition-all duration-200 ${
            error ? 'border-red-500' : isFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : ''
          } ${className}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          animate={isFocused ? { boxShadow: '0 0 20px rgba(37, 99, 235, 0.2)' } : {}}
          {...props}
        />
      </div>
      {error && (
        <motion.p
          className="text-red-500 text-sm mt-1"
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

/**
 * Animated Card Component
 * Features: 3D tilt effect on hover, smooth transitions
 */
export const AnimatedCard = ({
  children,
  className = '',
  hoverable = true,
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  [key: string]: any;
}) => {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!hoverable || !cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    
    setMousePosition({ x: x * 5, y: y * 5 });
  };

  const handleMouseLeave = () => {
    setMousePosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={hoverable ? {
        rotateX: mousePosition.y,
        rotateY: mousePosition.x,
      } : {}}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Animated Badge Component
 * Features: Color variants, pulsing animation
 */
export const AnimatedBadge = ({
  children,
  variant = 'blue',
  pulse = false,
}: {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  pulse?: boolean;
}) => {
  const variants = {
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  };

  return (
    <motion.span
      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${variants[variant]}`}
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={pulse ? { repeat: Infinity, duration: 2 } : {}}
    >
      {children}
    </motion.span>
  );
};

/**
 * Animated Checkbox Component
 */
export const AnimatedCheckbox = ({
  checked = false,
  onChange,
  label,
}: {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <motion.div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          checked
            ? 'bg-blue-600 border-blue-600'
            : 'border-slate-300 dark:border-slate-600'
        }`}
        onClick={() => onChange(!checked)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {checked && (
          <motion.svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </motion.div>
      {label && <span className="text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  );
};

/**
 * Loading Skeleton Component
 * Features: Shimmer effect
 */
export const SkeletonLoader = ({
  width = 'w-full',
  height = 'h-4',
  count = 3,
  circle = false,
}: {
  width?: string;
  height?: string;
  count?: number;
  circle?: boolean;
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className={`${width} ${height} ${circle ? 'rounded-full' : 'rounded-lg'} bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-600`}
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
            ease: 'linear',
          }}
          style={{
            backgroundSize: '200% 200%',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Animated Counter Component
 * Features: Number counting animation
 */
export const AnimatedCounter = ({
  from = 0,
  to = 100,
  duration = 2,
  suffix = '',
  prefix = '',
}: {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) => {
  const [count, setCount] = React.useState(from);

  React.useEffect(() => {
    let start = from;
    const increment = (to - from) / (duration * 60);
    const interval = setInterval(() => {
      start += increment;
      if (start >= to) {
        setCount(to);
        clearInterval(interval);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);

    return () => clearInterval(interval);
  }, [from, to, duration]);

  return <span>{prefix}{count.toLocaleString()}{suffix}</span>;
};

/**
 * Animated Toast Component
 * Features: Slide-in animation, auto-dismiss
 */
export const AnimatedToast = ({
  message,
  type = 'info',
  onClose,
}: {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}) => {
  const variants = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
  };

  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ x: 400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 400, opacity: 0 }}
      className={`${variants[type]} text-white px-6 py-3 rounded-lg shadow-lg`}
    >
      {message}
    </motion.div>
  );
};

/**
 * Floating Particle Component
 * Features: Floating animation, configurable colors
 */
export const FloatingParticles = ({
  count = 20,
  colors = ['#FF0000', '#FFD700', '#007A5E', '#0033A0'],
}: {
  count?: number;
  colors?: string[];
}) => {
  const particles = Array.from({ length: count }).map((_, i) => ({
    id: i,
    size: Math.random() * 8 + 4,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 5,
    left: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.left}%`,
            top: '-10px',
            backgroundColor: particle.color,
            opacity: 0.3,
          }}
          animate={{
            y: window.innerHeight + 20,
            x: (Math.random() - 0.5) * 200,
            opacity: [0.3, 0.5, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Animated Gradient Text
 * Features: Shifting gradient colors
 */
export const AnimatedGradientText = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <motion.div
      className={`bg-gradient-to-r from-blue-600 via-purple-600 to-amber-500 bg-clip-text text-transparent ${className}`}
      animate={{
        backgroundPosition: ['0%', '100%', '0%'],
      }}
      transition={{
        repeat: Infinity,
        duration: 3,
        ease: 'linear',
      }}
      style={{
        backgroundSize: '200% 200%',
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * Page Transition Wrapper
 */
export const PageTransition = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};
