/**
 * Design Token System - Typography
 * Centralized typography definitions for consistent text styling
 */

export const typography = {
  // Font families
  fontFamily: {
    sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
    display: ['var(--font-bangers)', 'system-ui', 'sans-serif'],
    mono: ['ui-monospace', 'SFMono-Regular', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
  },
  
  // Font sizes
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
    '5xl': ['3rem', { lineHeight: '1' }],           // 48px
    '6xl': ['3.75rem', { lineHeight: '1' }],        // 60px
    '7xl': ['4.5rem', { lineHeight: '1' }],         // 72px
  },
  
  // Font weights
  fontWeight: {
    thin: '100',
    extralight: '200',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  
  // Line heights
  lineHeight: {
    none: '1',
    tight: '1.25',
    snug: '1.375',
    normal: '1.5',
    relaxed: '1.625',
    loose: '2',
  },
  
  // Letter spacing
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
  
  // Text colors
  textColor: {
    primary: 'var(--text)',
    secondary: 'var(--muted)',
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    muted: 'var(--muted)',
    inverse: 'var(--bg)',
  },
  
  // Component-specific typography
  component: {
    heading: {
      h1: {
        fontSize: '3rem',
        fontWeight: '700',
        lineHeight: '1',
        letterSpacing: '0.05em',
      },
      h2: {
        fontSize: '2.25rem',
        fontWeight: '600',
        lineHeight: '1.25',
        letterSpacing: '0.025em',
      },
      h3: {
        fontSize: '1.875rem',
        fontWeight: '600',
        lineHeight: '1.375',
        letterSpacing: '0.025em',
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: '600',
        lineHeight: '1.5',
        letterSpacing: '0.025em',
      },
    },
    body: {
      large: {
        fontSize: '1.125rem',
        lineHeight: '1.75',
        fontWeight: '400',
      },
      normal: {
        fontSize: '1rem',
        lineHeight: '1.5',
        fontWeight: '400',
      },
      small: {
        fontSize: '0.875rem',
        lineHeight: '1.25',
        fontWeight: '400',
      },
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1',
      fontWeight: '500',
      letterSpacing: '0.025em',
    },
  },
} as const;

export type TypographyToken = keyof typeof typography;
export type TypographyVariant = keyof typeof typography.component;
