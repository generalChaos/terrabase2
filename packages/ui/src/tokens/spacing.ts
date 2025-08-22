/**
 * Design Token System - Spacing
 * Centralized spacing definitions for consistent layout
 */

export const spacing = {
  // Base spacing units
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '1rem',       // 16px
  lg: '1.5rem',     // 24px
  xl: '2rem',       // 32px
  '2xl': '3rem',    // 48px
  '3xl': '4rem',    // 64px
  '4xl': '6rem',    // 96px
  '5xl': '8rem',    // 128px
  
  // Component-specific spacing
  component: {
    padding: {
      xs: '0.5rem',    // 8px
      sm: '0.75rem',   // 12px
      md: '1rem',      // 16px
      lg: '1.5rem',    // 24px
      xl: '2rem',      // 32px
    },
    margin: {
      xs: '0.5rem',    // 8px
      sm: '1rem',      // 16px
      md: '1.5rem',    // 24px
      lg: '2rem',      // 32px
      xl: '3rem',      // 48px
    },
    gap: {
      xs: '0.25rem',   // 4px
      sm: '0.5rem',    // 8px
      md: '0.75rem',   // 12px
      lg: '1rem',      // 16px
      xl: '1.5rem',    // 24px
    },
  },
  
  // Layout spacing
  layout: {
    container: {
      padding: '1.5rem',    // 24px
      maxWidth: '1100px',
    },
    section: {
      padding: '3rem 0',    // 48px vertical
      gap: '2rem',          // 32px
    },
    card: {
      padding: '1.5rem',    // 24px
      gap: '1rem',          // 16px
    },
  },
  
  // Form spacing
  form: {
    field: {
      padding: '0.75rem 1rem',  // 12px vertical, 16px horizontal
      margin: '0.5rem 0',       // 8px vertical
      gap: '0.5rem',            // 8px
    },
    group: {
      margin: '1rem 0',         // 16px vertical
      gap: '0.75rem',           // 12px
    },
  },
} as const;

export type SpacingToken = keyof typeof spacing;
export type SpacingVariant = keyof typeof spacing.component | keyof typeof spacing.layout | keyof typeof spacing.form;
