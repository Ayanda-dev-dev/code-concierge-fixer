// Animation constants and utilities for eDLTS
export const animationConfig = {
  // Durations (ms)
  fast: 0.2,
  base: 0.3,
  slow: 0.5,
  slower: 0.8,
  
  // Easing
  easing: {
    easeInOut: [0.4, 0, 0.2, 1],
    easeOut: [0, 0, 0.2, 1],
    easeIn: [0.4, 0, 1, 1],
    spring: { type: 'spring', stiffness: 100, damping: 15 },
    bounce: { type: 'spring', stiffness: 100, damping: 10 },
  },
};

// Variant animations for common patterns
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: animationConfig.base },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: animationConfig.base },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
  transition: { duration: animationConfig.base },
};

export const slideInRight = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
  transition: { duration: animationConfig.base },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: animationConfig.base },
};

export const rotateIn = {
  initial: { opacity: 0, rotate: -10 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: -10 },
  transition: { duration: animationConfig.base },
};

// Container animations for staggered children
export const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 },
  },
};

// Hover animations
export const buttonHover = {
  scale: 1.02,
  transition: { duration: 0.2 },
};

export const cardHover = {
  y: -5,
  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  transition: { duration: 0.3 },
};

// Loading animation
export const shimmer = {
  animate: {
    backgroundPosition: ['0% 0%', '100% 100%'],
  },
  transition: {
    repeat: Infinity,
    duration: 2,
    ease: 'linear',
  },
};

// Pulse animation
export const pulse = {
  animate: {
    opacity: [1, 0.5, 1],
  },
  transition: {
    repeat: Infinity,
    duration: 2,
  },
};

// Float animation
export const float = {
  animate: {
    y: [0, -10, 0],
  },
  transition: {
    repeat: Infinity,
    duration: 3,
    ease: 'easeInOut',
  },
};

// 3D flip animation
export const flip3D = {
  initial: { rotateY: 0 },
  hover: { rotateY: 180 },
  transition: { duration: 0.6 },
};

// Gradient animation
export const gradientShift = {
  animate: {
    backgroundPosition: ['0%', '100%', '0%'],
  },
  transition: {
    repeat: Infinity,
    duration: 3,
    ease: 'linear',
  },
};

// Confetti animation for success
export const confettiPiece = {
  initial: { 
    y: 0, 
    x: 0, 
    opacity: 1, 
    scale: 1, 
    rotate: 0 
  },
  animate: {
    y: 300,
    x: (Math.random() - 0.5) * 200,
    opacity: 0,
    scale: 0,
    rotate: Math.random() * 360,
  },
  transition: { duration: 2.5 },
};

// Page transition
export const pageTransition = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: animationConfig.base },
};
