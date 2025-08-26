// Shared styling system for Fibbing It game
// This centralizes common styling patterns used across the game

// Layout Patterns
export const gameStyles = {
  // Main game background - used in multiple components
  background: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
  
  // Common container layouts
  container: {
    // Full screen game layout
    fullScreen: 'flex flex-col animate-fade-in min-h-screen',
    
    // Centered content container
    centered: 'flex-1 flex flex-col items-center justify-center px-6',
    
    // Content wrapper with max width
    content: 'text-center space-y-8 w-full max-w-4xl',
    
    // Mobile-friendly content wrapper
    mobile: 'text-center space-y-6 w-full max-w-2xl md:max-w-3xl lg:max-w-4xl',
  },
  
  // Common content containers
  content: {
    // Standard content box
    box: 'w-full max-w-md mx-auto space-y-3',
    
    // Form input container
    form: 'w-full max-w-md mx-auto space-y-4',
    
    // Question display container
    question: 'relative p-8',
    
    // Round info container
    roundInfo: 'text-center mb-8 mt-12',
  },
  
  // Animation patterns
  animation: {
    // Base fade-in animation
    fadeIn: 'animate-fade-in-up',
    
    // Scale animation for interactive elements
    scale: 'animate-scale-in',
    
    // Slide animations
    slideDown: 'animate-slide-down',
    slideIn: 'animate-slide-in',
    
    // Pulse animation for timers
    pulse: 'animate-pulse-slow',
    
    // Bounce animation for selections
    bounce: 'animate-bounce',
    
    // Shimmer effect for options
    shimmer: 'animate-shimmer',
  },
  
  // Common spacing patterns
  spacing: {
    // Component spacing
    component: 'space-y-8',
    componentMobile: 'space-y-6',
    
    // Content spacing
    content: 'space-y-3',
    contentLarge: 'space-y-4',
    
    // Section spacing
    section: 'mb-8 mt-12',
    sectionSmall: 'mb-4 mt-6',
  },
  
  // Text styles
  text: {
    // Headings
    heading: 'font-bold text-white leading-tight tracking-wide',
    headingLarge: 'text-4xl font-bold text-white max-w-4xl leading-relaxed',
    headingMedium: 'text-2xl font-bold text-white',
    
    // Body text
    body: 'text-xl text-slate-300',
    bodyMedium: 'text-lg text-slate-300',
    bodySmall: 'text-sm text-slate-400',
    
    // Accent text
    accent: 'text-teal-400 font-medium',
    accentBold: 'text-teal-400 font-bold text-lg',
    accentLarge: 'text-teal-400 font-bold text-3xl',
    
    // Success text
    success: 'text-green-400 font-medium',
    
    // Room code styling
    roomCode: 'text-2xl font-mono text-teal-400 bg-slate-800 px-4 py-2 rounded-lg',
  },
  
  // Button styles
  button: {
    // Primary button
    primary: 'bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-xl font-baloo2 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl',
    
    // Secondary button
    secondary: 'bg-slate-800/90 backdrop-blur-sm rounded-2xl px-4 py-2 border border-slate-600/50 text-white hover:bg-slate-700/90 transition-colors',
    
    // Danger button
    danger: 'bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors',
    
    // Back button
    back: 'text-white text-2xl hover:scale-110 transition-transform duration-200',
  },
  
  // Card styles
  card: {
    // Standard card
    standard: 'bg-slate-800/50 rounded-2xl p-6 border border-slate-600',
    
    // Interactive card
    interactive: 'bg-slate-800 border border-slate-600 text-white hover:border-teal-400 hover:bg-slate-700 transition-colors',
    
    // Option card background
    option: 'absolute inset-0 rounded-xl bg-gradient-to-r',
    optionBorder: 'absolute inset-0 rounded-xl',
    optionHighlight: 'absolute inset-0 rounded-xl bg-gradient-to-br from-white/40 via-transparent to-transparent',
    optionShimmer: 'absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/60 to-transparent -translate-x-full animate-shimmer',
  },
} as const;

// Animation delay utilities
export const animationDelays = {
  // Common animation delays
  immediate: '0ms',
  quick: '200ms',
  fast: '300ms',
  normal: '400ms',
  medium: '500ms',
  slow: '600ms',
  slower: '700ms',
  slowest: '800ms',
  
  // Staggered delays for lists
  stagger: (baseDelay: number, index: number, increment: number = 100) => 
    `${baseDelay + (index * increment)}ms`,
  
  // Common staggered patterns
  list: (index: number) => `${900 + (index * 100)}ms`,
  content: (index: number) => `${500 + (index * 100)}ms`,
} as const;

// Helper function to combine styles
export const combineStyles = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ');
};
