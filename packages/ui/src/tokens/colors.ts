/**
 * Design Token System - Colors
 * Centralized color definitions for consistent theming
 */

export const colors = {
  // Background colors
  bg: {
    primary: 'var(--bg)',
    secondary: 'var(--panel)',
    tertiary: 'var(--muted)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    glass: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Text colors
  text: {
    primary: 'var(--text)',
    secondary: 'var(--muted)',
    inverse: 'var(--bg)',
    muted: 'var(--muted)',
  },
  
  // Accent colors
  accent: {
    primary: 'var(--accent)',
    hover: 'var(--accent-hover)',
    light: 'rgba(34, 211, 238, 0.1)',
    medium: 'rgba(34, 211, 238, 0.2)',
    strong: 'rgba(34, 211, 238, 0.3)',
  },
  
  // Status colors
  status: {
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    info: 'var(--accent)',
  },
  
  // Border colors
  border: {
    primary: 'var(--border)',
    accent: 'var(--accent)',
    success: 'var(--success)',
    warning: 'var(--warning)',
    danger: 'var(--danger)',
    muted: 'var(--muted)',
  },
  
  // Interactive states
  interactive: {
    hover: 'rgba(255, 255, 255, 0.1)',
    active: 'rgba(255, 255, 255, 0.2)',
    focus: 'var(--accent)',
    disabled: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Gradients
  gradient: {
    primary: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
    accent: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)',
    success: 'linear-gradient(135deg, var(--success) 0%, #16a34a 100%)',
    warning: 'linear-gradient(135deg, var(--warning) 0%, #d97706 100%)',
    danger: 'linear-gradient(135deg, var(--danger) 0%, #dc2626 100%)',
  },
} as const;

export type ColorToken = keyof typeof colors;
export type ColorVariant = keyof typeof colors.bg | keyof typeof colors.text | keyof typeof colors.accent | keyof typeof colors.status | keyof typeof colors.border | keyof typeof colors.interactive | keyof typeof colors.gradient;
