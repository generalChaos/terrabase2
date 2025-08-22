import { cva } from 'class-variance-authority';

/**
 * Card Component Variants
 * Consistent card styling patterns using CVA
 */

export const cardVariants = cva(
  // Base styles
  "rounded-xl border-2 transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default: "border-[--border] bg-[--panel] hover:border-[--accent] hover:bg-[--accent]/5",
        accent: "border-[--accent] bg-[--accent]/10 hover:bg-[--accent]/20",
        success: "border-[--success] bg-[--success]/10 hover:bg-[--success]/20",
        warning: "border-[--warning] bg-[--warning]/10 hover:bg-[--warning]/20",
        danger: "border-[--danger] bg-[--danger]/10 hover:bg-[--danger]/20",
        glass: "border-white/20 bg-white/10 backdrop-blur-sm hover:bg-white/20",
        elevated: "border-[--border] bg-[--panel] shadow-lg hover:shadow-xl hover:-translate-y-1",
      },
      size: {
        sm: "p-3 gap-2",
        md: "p-4 gap-3",
        lg: "p-6 gap-4",
        xl: "p-8 gap-6",
      },
      interactive: {
        true: "cursor-pointer hover:-translate-y-1 hover:shadow-lg active:translate-y-0",
        false: "",
      },
      animation: {
        none: "",
        fade: "animate-fade-in",
        slide: "animate-slide-up",
        scale: "animate-scale-in",
        bounce: "animate-bounce-in",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      interactive: false,
      animation: "none",
    },
  }
);

export const cardHeaderVariants = cva(
  "flex items-center justify-between",
  {
    variants: {
      size: {
        sm: "mb-2",
        md: "mb-3",
        lg: "mb-4",
        xl: "mb-6",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const cardContentVariants = cva(
  "space-y-2",
  {
    variants: {
      size: {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg",
        xl: "text-xl",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export const cardFooterVariants = cva(
  "flex items-center justify-between pt-4",
  {
    variants: {
      size: {
        sm: "pt-2",
        md: "pt-4",
        lg: "pt-6",
        xl: "pt-8",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);
