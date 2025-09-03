import { useCallback, useEffect, useRef } from 'react';

interface ConfettiStyleProps {
  tileSize: number;
  animationDuration: number;
  backgroundColor: string;
  selectedBackground: string;
  gradientMask?: 'none' | 'subtle' | 'normal' | 'strong' | 'aggressive';
}

interface ParallaxLayerProps {
  index: number;
  pattern: string;
  size: number;
  speed: number;
  opacity: number;
  offsetX: number;
  offsetY: number;
  fallingDirection: string;
  fadeOutDistance: number;
  windEffect: number;
}

interface PerformanceMetrics {
  fps: number;
  memoryUsage?: number;
  animationTime: number;
}

interface BatteryManager {
  level: number;
  charging: boolean;
  chargingTime: number;
  dischargingTime: number;
}

export const useConfettiStyles = () => {
  const performanceRef = useRef<PerformanceMetrics>({
    fps: 60,
    animationTime: 0
  });
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationIdRef = useRef<number | null>(null);
  const cleanupRef = useRef<Set<HTMLElement>>(new Set());
  const activeElementsRef = useRef<Map<HTMLElement, NodeJS.Timeout>>(new Map());
  const debounceTimersRef = useRef<Map<HTMLElement, NodeJS.Timeout>>(new Map());
  const updatingElementsRef = useRef<Set<HTMLElement>>(new Set());

  // Performance monitoring
  const measurePerformance = useCallback(() => {
    if (typeof performance === 'undefined') return;
    
    const now = performance.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      performanceRef.current.fps = fps;
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      // Log performance warnings
      if (fps < 30) {
        console.warn(`Low FPS detected: ${fps}. Consider reducing animation complexity.`);
      }
    }
  }, []);

  // Mobile detection
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Battery level detection
  const getBatteryLevel = useCallback(async (): Promise<number | null> => {
    if (typeof navigator === 'undefined') return null;
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as Navigator & { getBattery(): Promise<BatteryManager> }).getBattery();
        return battery.level;
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  // Adaptive performance settings
  const getAdaptiveSettings = useCallback(async () => {
    if (typeof window === 'undefined') {
      return {
        reduceComplexity: true,
        maxLayers: 2,
        animationMultiplier: 2,
        enableAdvancedEffects: false
      };
    }
    
    const mobile = isMobile();
    const batteryLevel = await getBatteryLevel();
    
    return {
      reduceComplexity: mobile || (batteryLevel !== null && batteryLevel < 0.2),
      maxLayers: mobile ? 3 : 6,
      animationMultiplier: mobile ? 1.5 : 1,
      enableAdvancedEffects: !mobile && (batteryLevel === null || batteryLevel > 0.3)
    };
  }, [isMobile, getBatteryLevel]);

    const setConfettiStyles = useCallback(async (element: HTMLElement, props: ConfettiStyleProps) => {
    try {
      // Prevent multiple simultaneous updates to the same element
      if (updatingElementsRef.current.has(element)) {
        return;
      }

      // Clear any existing debounce timer for this element
      const existingTimer = debounceTimersRef.current.get(element);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      // Mark element as being updated
      updatingElementsRef.current.add(element);

      // Debounce the style updates to prevent constant restarts
      const timer = setTimeout(async () => {
        try {
          // Cleanup previous styles if element was already styled
          if (cleanupRef.current.has(element)) {
            // Inline cleanup to avoid circular dependency
            element.style.removeProperty('--tile-size');
            element.style.removeProperty('--tile-size-negative');
            element.style.removeProperty('--tile-size-half-negative');
            element.style.removeProperty('--tile-size-150-negative');
            element.style.removeProperty('--animation-duration');
            element.style.removeProperty('--background-color');
            element.style.backgroundImage = 'none';
            element.style.animation = 'none';
            element.style.willChange = 'auto';
            element.style.backfaceVisibility = 'visible';
            element.style.transform = 'none';
            cleanupRef.current.delete(element);
          }
          
          // Track this element for cleanup
          cleanupRef.current.add(element);
          
          const adaptiveSettings = await getAdaptiveSettings();
          
          const {
            tileSize,
            animationDuration,
            backgroundColor,
            selectedBackground
          } = props;

          // Set CSS custom properties
          element.style.setProperty('--tile-size', `${tileSize}px`);
          element.style.setProperty('--tile-size-negative', `-${tileSize}px`);
          element.style.setProperty('--tile-size-half-negative', `-${tileSize / 2}px`);
          element.style.setProperty('--tile-size-150-negative', `-${tileSize * 1.5}px`);
          element.style.setProperty('--animation-duration', `${animationDuration}s`);
          element.style.setProperty('--background-color', backgroundColor);

          // Set background image - only the confetti pattern
          // Hero glow is handled by CSS pseudo-elements for static positioning
          element.style.backgroundImage = `url('/confetti-pack/${selectedBackground}')`;
          
          // Set performance optimizations
          if (adaptiveSettings?.reduceComplexity) {
            element.style.willChange = 'auto';
            element.style.backfaceVisibility = 'visible';
          } else {
            element.style.willChange = 'transform, opacity';
            element.style.backfaceVisibility = 'hidden';
          }
        } finally {
          // Mark element as no longer being updated
          updatingElementsRef.current.delete(element);
        }
      }, 150); // Increased to 150ms debounce delay

      // Store the timer for cleanup
      debounceTimersRef.current.set(element, timer);
      
    } catch (error) {
      console.error('Error setting confetti styles:', error);
      // Mark element as no longer being updated on error
      updatingElementsRef.current.delete(element);
    }
  }, [getAdaptiveSettings]);

  const setParallaxLayerStyles = useCallback((element: HTMLElement, props: ParallaxLayerProps) => {
    try {
      // Cleanup previous styles if element was already styled
      if (cleanupRef.current.has(element)) {
        // Inline cleanup to avoid circular dependency
        element.style.removeProperty('--tile-size');
        element.style.removeProperty('--offset-x');
        element.style.removeProperty('--offset-y');
        element.style.removeProperty('--layer-opacity');
        element.style.removeProperty('--layer-z-index');
        element.style.removeProperty('--fade-out-start');
        element.style.removeProperty('--wind-x');
        element.style.removeProperty('--wind-y');
        element.style.backgroundImage = 'none';
        element.style.backgroundSize = 'auto';
        element.style.animation = 'none';
        cleanupRef.current.delete(element);
      }
      
      // Track this element for cleanup
      cleanupRef.current.add(element);
      
      const {
        index,
        pattern,
        size,
        speed,
        opacity,
        offsetX,
        offsetY,
        fallingDirection,
        fadeOutDistance,
        windEffect
      } = props;

      // Set CSS custom properties for the layer
      element.style.setProperty('--tile-size', `${size}px`);
      element.style.setProperty('--offset-x', `${offsetX}px`);
      element.style.setProperty('--offset-y', `${offsetY}px`);
      element.style.setProperty('--layer-opacity', opacity.toString());
      element.style.setProperty('--layer-z-index', `${-index - 1}`);
      element.style.setProperty('--fade-out-start', `${100 - fadeOutDistance}%`);

      // Calculate wind effects
      let windX = 0;
      let windY = 0;
      
      switch (fallingDirection) {
        case 'down':
        case 'up':
          windX = windEffect * speed * 0.1;
          break;
        case 'left':
        case 'right':
          windY = windEffect * speed * 0.1;
          break;
      }

      element.style.setProperty('--wind-x', `${windX}px`);
      element.style.setProperty('--wind-y', `${windY}px`);

      // Set background image
      element.style.backgroundImage = `url('/confetti-pack/${pattern}')`;
      element.style.backgroundSize = `${size}px ${size}px`;

      // Set animation based on direction
      const animationName = `layer-fall-${fallingDirection}`;
      element.style.animation = `${animationName} ${speed}s linear infinite`;
      
    } catch (error) {
      console.error('Error setting parallax layer styles:', error);
    }
  }, []);

  const getAnimationClass = useCallback((animationType: string) => {
    switch (animationType) {
      case 'fall': return 'animate-tile-fall';
      case 'fall-down': return 'animate-tile-fall-down';
      case 'drift': return 'animate-tile-drift';
      case 'bounce': return 'animate-tile-bounce';
      case 'pulse': return 'animate-tile-pulse';
      case 'wave': return 'animate-tile-wave';
      case 'spiral': return 'animate-tile-spiral';
      case 'float': return 'animate-tile-float';
      default: return 'animate-tile-fall-down';
    }
  }, []);

  const getBackgroundClasses = useCallback((showGradients: boolean, showHeroGlow: boolean, gradientMask: 'none' | 'subtle' | 'normal' | 'strong' | 'aggressive' = 'none') => {
    let classes = 'confetti-bg';
    
    if (showHeroGlow) {
      classes += ' confetti-bg-with-mask-hero-glow';
    }
    
    if (gradientMask !== 'none') {
      switch (gradientMask) {
        case 'subtle':
          classes += ' confetti-bg-with-mask-subtle';
          break;
        case 'normal':
          classes += ' confetti-bg-with-mask';
          break;
        case 'strong':
          classes += ' confetti-bg-with-mask-strong';
          break;
        case 'aggressive':
          classes += ' confetti-bg-with-mask-aggressive';
          break;
      }
    }
    
    return classes;
  }, []);

  // Cleanup function for individual elements
  const cleanupElement = useCallback((element: HTMLElement) => {
    try {
      // Clear any pending debounce timers
      const debounceTimer = debounceTimersRef.current.get(element);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimersRef.current.delete(element);
      }

      // Remove all CSS custom properties
      element.style.removeProperty('--tile-size');
      element.style.removeProperty('--tile-size-negative');
      element.style.removeProperty('--tile-size-half-negative');
      element.style.removeProperty('--tile-size-150-negative');
      element.style.removeProperty('--animation-duration');
      element.style.removeProperty('--background-color');
      element.style.removeProperty('--offset-x');
      element.style.removeProperty('--offset-y');
      element.style.removeProperty('--layer-opacity');
      element.style.removeProperty('--layer-z-index');
      element.style.removeProperty('--fade-out-start');
      element.style.removeProperty('--wind-x');
      element.style.removeProperty('--wind-y');
      
      // Clear background image
      element.style.backgroundImage = 'none';
      element.style.backgroundSize = 'auto';
      element.style.animation = 'none';
      
      // Reset performance properties
      element.style.willChange = 'auto';
      element.style.backfaceVisibility = 'visible';
      element.style.transform = 'none';
      
      // Remove from tracking
      cleanupRef.current.delete(element);
      const timeoutId = activeElementsRef.current.get(element);
      if (timeoutId) {
        clearTimeout(timeoutId);
        activeElementsRef.current.delete(element);
      }
      
      // Clear updating flag
      updatingElementsRef.current.delete(element);
      
    } catch (error) {
      console.warn('Error cleaning up element:', error);
    }
  }, []);

  // Batch cleanup function
  const cleanupAllElements = useCallback(() => {
    // Create a copy of the set to avoid modification during iteration
    const elementsToCleanup = new Set(cleanupRef.current);
    elementsToCleanup.forEach((element) => {
      try {
        // Clear any pending debounce timers
        const debounceTimer = debounceTimersRef.current.get(element);
        if (debounceTimer) {
          clearTimeout(debounceTimer);
          debounceTimersRef.current.delete(element);
        }

        // Remove all CSS custom properties
        element.style.removeProperty('--tile-size');
        element.style.removeProperty('--tile-size-negative');
        element.style.removeProperty('--tile-size-half-negative');
        element.style.removeProperty('--tile-size-150-negative');
        element.style.removeProperty('--animation-duration');
        element.style.removeProperty('--background-color');
        element.style.removeProperty('--offset-x');
        element.style.removeProperty('--offset-y');
        element.style.removeProperty('--layer-opacity');
        element.style.removeProperty('--layer-z-index');
        element.style.removeProperty('--fade-out-start');
        element.style.removeProperty('--wind-x');
        element.style.removeProperty('--wind-y');
        
        // Clear background image
        element.style.backgroundImage = 'none';
        element.style.backgroundSize = 'auto';
        element.style.animation = 'none';
        
        // Reset performance properties
        element.style.willChange = 'auto';
        element.style.backfaceVisibility = 'visible';
        element.style.transform = 'none';
        
        // Remove from tracking
        cleanupRef.current.delete(element);
        const timeoutId = activeElementsRef.current.get(element);
        if (timeoutId) {
          clearTimeout(timeoutId);
          activeElementsRef.current.delete(element);
        }
        
      } catch (error) {
        console.warn('Error cleaning up element:', error);
      }
    });
    
    // Clear all references
    cleanupRef.current.clear();
    activeElementsRef.current.clear();
    debounceTimersRef.current.clear();
    updatingElementsRef.current.clear();
  }, []);

  // Performance monitoring effect
  useEffect(() => {
    let animationId: number;
    
    const monitorPerformance = () => {
      if (typeof window !== 'undefined') {
        measurePerformance();
        animationId = requestAnimationFrame(monitorPerformance);
      }
    };
    
    if (typeof window !== 'undefined') {
      animationId = requestAnimationFrame(monitorPerformance);
      animationIdRef.current = animationId;
    }
    
    return () => {
      if (animationId && typeof window !== 'undefined') {
        cancelAnimationFrame(animationId);
      }
      // Cleanup all elements when hook unmounts
      cleanupAllElements();
    };
  }, [measurePerformance, cleanupAllElements]);

  return {
    setConfettiStyles,
    setParallaxLayerStyles,
    getAnimationClass,
    getBackgroundClasses,
    performanceMetrics: performanceRef.current,
    isMobile,
    getAdaptiveSettings,
    cleanupElement,
    cleanupAllElements
  };
};
