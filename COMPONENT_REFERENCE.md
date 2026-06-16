# Component Reference Guide

## 📚 AnimatedComponents.tsx - Complete Component Library

All components are designed to work seamlessly with Tailwind CSS and Framer Motion.

---

## 🎯 AnimatedButton

A versatile button component with multiple variants and animations.

### Props

```tsx
interface AnimatedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  [key: string]: any;
}
```

### Variants

- **primary**: Blue gradient button with shadow
- **secondary**: Gold/Amber gradient button
- **outline**: Outlined button with border
- **ghost**: Text-only button with hover effect

### Sizes

- **sm**: Small button (padding: px-3 py-1.5, font-size: sm)
- **md**: Medium button (padding: px-4 py-2, font-size: base)
- **lg**: Large button (padding: px-6 py-3, font-size: lg)

### Usage

```tsx
import { AnimatedButton } from '@/components/AnimatedComponents';

// Primary button
<AnimatedButton variant="primary" size="lg">
  Get Started
</AnimatedButton>

// Outline button
<AnimatedButton variant="outline" onClick={() => handleClick()}>
  Cancel
</AnimatedButton>

// Disabled button
<AnimatedButton disabled>
  Loading...
</AnimatedButton>
```

### Features

- Ripple effect on click
- Hover scale animation (1.02x)
- Tap scale animation (0.98x)
- Smooth transitions
- Disabled state styling

---

## 📝 AnimatedInput

Advanced input component with focus glow, label animation, and error handling.

### Props

```tsx
interface AnimatedInputProps {
  label?: string;
  error?: string;
  icon?: React.ComponentType;
  className?: string;
  [key: string]: any;
}
```

### Usage

```tsx
import { AnimatedInput } from '@/components/AnimatedComponents';
import { Mail, Lock } from 'lucide-react';

// Basic input
<AnimatedInput
  label="Email"
  type="email"
  placeholder="your@email.com"
/>

// With icon
<AnimatedInput
  label="Password"
  type="password"
  icon={Lock}
  placeholder="Enter password"
/>

// With error
<AnimatedInput
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={errors.email}
  icon={Mail}
/>
```

### Features

- Label color animation on focus
- Icon scale animation on focus
- Focus glow effect with blue shadow
- Error state styling (red border)
- Smooth transitions

---

## 🎴 AnimatedCard

Card component with 3D tilt effect on mouse move.

### Props

```tsx
interface AnimatedCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  [key: string]: any;
}
```

### Usage

```tsx
import { AnimatedCard } from '@/components/AnimatedComponents';

// Basic card
<AnimatedCard>
  <div className="p-6">
    <h3>Card Title</h3>
    <p>Card content</p>
  </div>
</AnimatedCard>

// Non-hoverable card
<AnimatedCard hoverable={false}>
  Content
</AnimatedCard>

// With custom styling
<AnimatedCard className="bg-gradient-to-br from-blue-600 to-purple-600">
  Premium Content
</AnimatedCard>
```

### Features

- 3D perspective on hover
- Mouse position tracking
- Smooth rotation animation
- Hover shadow effect
- Customizable styling

---

## 🏷️ AnimatedBadge

Status badge component with optional pulse animation.

### Props

```tsx
interface AnimatedBadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  pulse?: boolean;
}
```

### Variants

- **blue**: Blue background
- **green**: Green background (success)
- **red**: Red background (danger)
- **amber**: Amber background (warning)
- **purple**: Purple background (info)

### Usage

```tsx
import { AnimatedBadge } from '@/components/AnimatedComponents';

// Status badges
<AnimatedBadge variant="green" pulse>
  Approved
</AnimatedBadge>

<AnimatedBadge variant="amber">
  Pending
</AnimatedBadge>

<AnimatedBadge variant="red">
  Rejected
</AnimatedBadge>

// Non-pulsing
<AnimatedBadge variant="blue">
  Information
</AnimatedBadge>
```

### Features

- Color variants for different states
- Optional pulse animation
- Semi-transparent backgrounds
- Rounded corners
- Dark mode support

---

## ✅ AnimatedCheckbox

Custom animated checkbox component.

### Props

```tsx
interface AnimatedCheckboxProps {
  checked?: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}
```

### Usage

```tsx
import { AnimatedCheckbox } from '@/components/AnimatedComponents';
import { useState } from 'react';

const [agreed, setAgreed] = useState(false);

<AnimatedCheckbox
  checked={agreed}
  onChange={setAgreed}
  label="I agree to the terms and conditions"
/>
```

### Features

- Smooth check animation
- Hover scale effect
- Custom checkmark icon
- Label support
- Easy state management

---

## ⏳ SkeletonLoader

Loading skeleton component with shimmer effect.

### Props

```tsx
interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  count?: number;
  circle?: boolean;
}
```

### Usage

```tsx
import { SkeletonLoader } from '@/components/AnimatedComponents';

// Text skeleton
<SkeletonLoader count={3} />

// Circle skeleton (avatar)
<SkeletonLoader width="w-12" height="h-12" circle count={1} />

// Custom size
<SkeletonLoader width="w-full" height="h-64" count={1} />
```

### Features

- Shimmer animation
- Customizable width/height
- Multiple items
- Circle option for avatars
- Infinite loop animation

---

## 🔢 AnimatedCounter

Number counting animation component.

### Props

```tsx
interface AnimatedCounterProps {
  from?: number;
  to: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}
```

### Usage

```tsx
import { AnimatedCounter } from '@/components/AnimatedComponents';

// Simple counter
<AnimatedCounter to={1000} />

// With duration
<AnimatedCounter from={0} to={125000} duration={2} />

// With prefix/suffix
<AnimatedCounter 
  to={89000} 
  duration={2}
  prefix="$"
  suffix="+"
/>

// Percentage
<AnimatedCounter to={85} suffix="%" />
```

### Features

- Smooth number animation
- Customizable duration
- Prefix and suffix support
- Localized number formatting
- Easing animation

---

## 🔔 AnimatedToast

Toast notification component.

### Props

```tsx
interface AnimatedToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}
```

### Usage

```tsx
import { AnimatedToast } from '@/components/AnimatedComponents';
import { useState } from 'react';

const [toast, setToast] = useState(null);

<AnimatedToast
  message="Operation successful!"
  type="success"
  onClose={() => setToast(null)}
/>

// Or use the ToastProvider hook:
const { addToast } = useToast();
addToast('Success!', 'success');
```

### Types

- **success**: Green background
- **error**: Red background
- **warning**: Amber background
- **info**: Blue background

### Features

- Auto-dismiss after 3 seconds
- Slide-in animation
- Color-coded types
- Customizable message

---

## 🌌 FloatingParticles

Floating particle background animation.

### Props

```tsx
interface FloatingParticlesProps {
  count?: number;
  colors?: string[];
}
```

### Usage

```tsx
import { FloatingParticles } from '@/components/AnimatedComponents';

// Default particles
<FloatingParticles />

// Custom colors
<FloatingParticles 
  count={30}
  colors={['#FF0000', '#FFD700', '#007A5E', '#0033A0']}
/>

// More particles
<FloatingParticles count={50} />

// Single color
<FloatingParticles colors={['#2563eb']} />
```

### Features

- Infinite floating animation
- Random movement patterns
- Customizable count
- South African flag colors by default
- Fixed position background

---

## 🎨 AnimatedGradientText

Gradient text with animated color shift.

### Props

```tsx
interface AnimatedGradientTextProps {
  children: React.ReactNode;
  className?: string;
}
```

### Usage

```tsx
import { AnimatedGradientText } from '@/components/AnimatedComponents';

<AnimatedGradientText className="text-5xl font-bold">
  Welcome to eDLTS
</AnimatedGradientText>

// With custom sizing
<AnimatedGradientText className="text-7xl font-black">
  Modern Licensing
</AnimatedGradientText>
```

### Features

- Blue → Purple → Gold gradient
- Smooth color shift animation
- Customizable size via className
- Infinite loop
- Uses `bg-clip-text` for text effect

---

## 🔄 PageTransition

Page transition wrapper component.

### Props

```tsx
interface PageTransitionProps {
  children: React.ReactNode;
}
```

### Usage

```tsx
import { PageTransition } from '@/components/AnimatedComponents';

<PageTransition>
  <YourPageContent />
</PageTransition>
```

### Features

- Fade in animation
- Slide up animation (10px)
- 0.3s transition duration
- Exit animation
- Smooth page transitions

---

## 🌐 Animations Module

Pre-configured animation variants from `src/lib/animations.ts`

### Available Variants

```tsx
import { 
  fadeInUp, 
  fadeIn, 
  slideInLeft, 
  slideInRight,
  scaleIn,
  rotateIn,
  containerVariants,
  itemVariants,
  buttonHover,
  cardHover,
  shimmer,
  pulse,
  float,
  flip3D,
  gradientShift,
  pageTransition
} from '@/lib/animations';
```

### Usage

```tsx
import { motion } from 'framer-motion';
import { fadeInUp, containerVariants, itemVariants } from '@/lib/animations';

// Single element
<motion.div {...fadeInUp}>Content</motion.div>

// Container with staggered children
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      {item.content}
    </motion.div>
  ))}
</motion.div>
```

---

## 🎯 Theme Provider Hooks

Context providers from `src/lib/theme-provider.tsx`

### useTheme()

```tsx
import { useTheme } from '@/lib/theme-provider';

const { darkMode, toggleDarkMode } = useTheme();

// Use in component
<button onClick={toggleDarkMode}>
  {darkMode ? '☀️' : '🌙'}
</button>
```

### useToast()

```tsx
import { useToast } from '@/lib/theme-provider';

const { addToast } = useToast();

// Add notification
addToast('Success!', 'success');
addToast('Error occurred', 'error');
addToast('Warning', 'warning');
addToast('Info', 'info');
```

### useModal()

```tsx
import { useModal } from '@/lib/theme-provider';

const { openModal, closeModal } = useModal();

// Open modal
openModal(
  <div>Modal content</div>,
  'Modal Title'
);

// Close modal
closeModal();
```

---

## 🎪 Combining Components

### Example 1: Form with Validation

```tsx
const [formData, setFormData] = useState({});
const [errors, setErrors] = useState({});
const { addToast } = useToast();

<AnimatedInput
  label="Email"
  value={formData.email}
  onChange={(e) => setFormData({...formData, email: e.target.value})}
  error={errors.email}
  icon={Mail}
/>

<AnimatedButton 
  variant="primary"
  onClick={() => {
    if (validate(formData)) {
      addToast('Form submitted!', 'success');
    }
  }}
>
  Submit
</AnimatedButton>
```

### Example 2: Product Card

```tsx
<AnimatedCard>
  <img src="product.jpg" className="w-full h-48 object-cover" />
  <div className="p-6">
    <h3 className="text-xl font-bold mb-2">Product Name</h3>
    <p className="text-slate-600 mb-4">Description</p>
    <div className="flex gap-2">
      <AnimatedButton variant="primary" size="sm" className="flex-1">
        Buy Now
      </AnimatedButton>
      <AnimatedButton variant="outline" size="sm" className="flex-1">
        Learn More
      </AnimatedButton>
    </div>
  </div>
</AnimatedCard>
```

### Example 3: Dashboard Stats

```tsx
<motion.div 
  className="grid grid-cols-1 md:grid-cols-3 gap-4"
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {stats.map((stat) => (
    <motion.div key={stat.id} variants={itemVariants}>
      <AnimatedCard>
        <div className="p-6">
          <h4 className="text-slate-600">{stat.label}</h4>
          <p className="text-4xl font-bold mt-2">
            <AnimatedCounter to={stat.value} duration={2} />
          </p>
        </div>
      </AnimatedCard>
    </motion.div>
  ))}
</motion.div>
```

---

## 🎓 Best Practices

1. **Always wrap page content with `PageTransition`**
   ```tsx
   <PageTransition><YourContent /></PageTransition>
   ```

2. **Use `variants` for consistent animations**
   ```tsx
   import { fadeInUp } from '@/lib/animations';
   <motion.div {...fadeInUp}>Content</motion.div>
   ```

3. **Combine with Tailwind classes**
   ```tsx
   <AnimatedButton className="w-full md:w-auto">
     Button
   </AnimatedButton>
   ```

4. **Use providers for global state**
   ```tsx
   const { addToast } = useToast();
   addToast('Success!', 'success');
   ```

5. **Leverage container variants for lists**
   ```tsx
   <motion.div variants={containerVariants} initial="hidden" animate="visible">
     {items.map((item) => (
       <motion.div key={item.id} variants={itemVariants}>{item}</motion.div>
     ))}
   </motion.div>
   ```

---

## 📖 Quick Reference

| Component | Use Case | Key Props |
|-----------|----------|-----------|
| `AnimatedButton` | All interactive buttons | variant, size, onClick |
| `AnimatedInput` | Form inputs | label, error, icon |
| `AnimatedCard` | Content containers | hoverable, className |
| `AnimatedBadge` | Status indicators | variant, pulse |
| `AnimatedCheckbox` | Selections | checked, onChange |
| `SkeletonLoader` | Loading state | count, width, height |
| `AnimatedCounter` | Statistics | to, duration, suffix |
| `AnimatedToast` | Notifications | message, type |
| `FloatingParticles` | Background | count, colors |
| `AnimatedGradientText` | Headlines | className |

---

## 🚀 Performance Tips

1. Use `transform` and `opacity` only for animations
2. Use Tailwind's `transform-gpu` for GPU acceleration
3. Limit particle count to 50 maximum
4. Use `AnimatePresence` for exit animations
5. Lazy load heavy animations
6. Check 60fps performance in Chrome DevTools

---

**Happy Building! 🎉**
