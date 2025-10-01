# Animations & Micro-interactions - Homepage V1

## 🎯 **Animation Philosophy**

### **Mobile-First Approach**
- **Performance**: 60fps on mobile devices
- **Battery Conscious**: Minimal CPU/GPU usage
- **Touch-Friendly**: Animations that respond to touch
- **Accessibility**: Respects `prefers-reduced-motion`

### **Design Principles**
- **Purposeful**: Every animation serves a function
- **Subtle**: Enhances UX without being distracting
- **Fast**: Quick transitions (200-300ms)
- **Natural**: Feels like real-world physics

## 📱 **Homepage Animations**

### **1. Page Load Animations**

#### **Hero Section Entrance**
```css
/* Fade in from bottom with slight scale */
@keyframes heroEntrance {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.hero-logo {
  animation: heroEntrance 0.6s ease-out;
}

.hero-text {
  animation: heroEntrance 0.6s ease-out 0.2s both;
}

.hero-cta {
  animation: heroEntrance 0.6s ease-out 0.4s both;
}
```

#### **Examples Grid Stagger**
```css
/* Staggered entrance for grid items */
@keyframes gridItemEntrance {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid-item {
  animation: gridItemEntrance 0.4s ease-out both;
}

/* Stagger delay for each item */
.grid-item:nth-child(1) { animation-delay: 0.1s; }
.grid-item:nth-child(2) { animation-delay: 0.2s; }
.grid-item:nth-child(3) { animation-delay: 0.3s; }
/* ... continue pattern */
```

### **2. Interactive Animations**

#### **Button Hover/Touch States**
```css
/* Primary CTA Button */
.cta-primary {
  transition: all 0.2s ease;
  transform: translateY(0);
}

.cta-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.cta-primary:active {
  transform: translateY(0);
  transition: all 0.1s ease;
}

/* Touch feedback for mobile */
.cta-primary:active {
  transform: scale(0.98);
}
```

#### **Card Hover States**
```css
/* Example logo cards */
.logo-card {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.logo-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

/* Mobile touch feedback */
.logo-card:active {
  transform: scale(0.95);
  transition: all 0.1s ease;
}
```

### **3. Scroll Animations**

#### **Intersection Observer Animations**
```css
/* Fade in as elements come into view */
@keyframes fadeInUp {
  0% {
    opacity: 0;
    transform: translateY(30px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.scroll-reveal {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.6s ease;
}

.scroll-reveal.visible {
  opacity: 1;
  transform: translateY(0);
}
```

#### **Parallax Effect (Subtle)**
```css
/* Very subtle parallax for hero logo */
.hero-logo {
  transform: translateY(var(--scroll-offset, 0));
  transition: transform 0.1s ease-out;
}
```

### **4. Loading States**

#### **Skeleton Loading**
```css
/* Skeleton for loading examples */
@keyframes skeletonPulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: skeletonPulse 1.5s ease-in-out infinite;
}
```

#### **Progress Indicators**
```css
/* Loading progress bar */
@keyframes progressFill {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}

.progress-bar {
  animation: progressFill 2s ease-out;
}
```

## 🎨 **Micro-interactions**

### **1. Touch Feedback**

#### **Ripple Effect**
```css
/* Touch ripple for buttons */
@keyframes ripple {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(4);
    opacity: 0;
  }
}

.ripple {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  animation: ripple 0.6s ease-out;
}
```

#### **Haptic Feedback (JavaScript)**
```javascript
// Haptic feedback for mobile
function triggerHaptic() {
  if ('vibrate' in navigator) {
    navigator.vibrate(10); // Short vibration
  }
}

// Add to button clicks
button.addEventListener('click', triggerHaptic);
```

### **2. Form Interactions**

#### **Input Focus States**
```css
/* Input field focus animation */
.input-field {
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.input-field:focus {
  border-color: #3B82F6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  transform: scale(1.02);
}
```

#### **Label Animations**
```css
/* Floating label effect */
.input-label {
  transition: all 0.3s ease;
  transform: translateY(0);
}

.input-field:focus + .input-label {
  transform: translateY(-20px) scale(0.8);
  color: #3B82F6;
}
```

### **3. Navigation Animations**

#### **Smooth Scrolling**
```css
/* Smooth scroll behavior */
html {
  scroll-behavior: smooth;
}

/* Custom smooth scroll for better control */
.smooth-scroll {
  scroll-behavior: smooth;
  transition: scroll-behavior 0.3s ease;
}
```

#### **Page Transitions**
```css
/* Fade transition between pages */
@keyframes pageFadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-enter {
  animation: pageFadeIn 0.4s ease-out;
}
```

## 📱 **Mobile-Specific Animations**

### **1. Touch Gestures**

#### **Swipe Indicators**
```css
/* Swipe hint animation */
@keyframes swipeHint {
  0%, 100% {
    transform: translateX(0);
  }
  50% {
    transform: translateX(10px);
  }
}

.swipe-hint {
  animation: swipeHint 2s ease-in-out infinite;
}
```

#### **Pull to Refresh**
```css
/* Pull to refresh animation */
@keyframes pullRefresh {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(0);
  }
}

.pull-refresh {
  animation: pullRefresh 0.3s ease-out;
}
```

### **2. Performance Optimizations**

#### **GPU Acceleration**
```css
/* Use transform and opacity for smooth animations */
.animated-element {
  will-change: transform, opacity;
  transform: translateZ(0); /* Force GPU acceleration */
}
```

#### **Reduced Motion Support**
```css
/* Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## 🎯 **Animation Timing**

### **Duration Guidelines**
- **Micro-interactions**: 100-200ms
- **Hover states**: 200-300ms
- **Page transitions**: 300-500ms
- **Loading states**: 1-2s
- **Scroll animations**: 400-600ms

### **Easing Functions**
- **Ease-out**: For entrances (feels natural)
- **Ease-in**: For exits (feels snappy)
- **Ease-in-out**: For state changes (feels balanced)
- **Cubic-bezier**: For custom timing (advanced)

## 🚀 **Implementation Strategy**

### **CSS Animations**
- **Simple animations**: CSS keyframes
- **Performance**: Hardware accelerated
- **Fallback**: Graceful degradation

### **JavaScript Animations**
- **Complex interactions**: GSAP or Framer Motion
- **Scroll triggers**: Intersection Observer
- **Touch gestures**: Touch events

### **Performance Monitoring**
- **FPS tracking**: Monitor 60fps target
- **Battery usage**: Minimize CPU/GPU load
- **Memory usage**: Clean up animation listeners

## 🎨 **Animation Examples**

### **Logo Card Hover**
```css
.logo-card {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.logo-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}
```

### **Button Press**
```css
.cta-button {
  transition: all 0.1s ease;
}

.cta-button:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
```

### **Loading Spinner**
```css
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}
```

This animation strategy ensures the app feels smooth, responsive, and delightful on mobile devices while maintaining excellent performance and accessibility.
