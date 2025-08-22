import { cva } from 'class-variance-authority';

/**
 * Button Component Variants
 * Enhanced button styling patterns using CVA
 */

export const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[--accent] focus-visible:ring-offset-2 focus-visible:ring-offset-[--bg]",
  {
    variants: {
      variant: {
        default: "bg-[--primary] text-white shadow-sm hover:bg-[--primary]/90 active:bg-[--primary]/80",
        accent: "bg-[--accent] text-[--bg] shadow-sm hover:bg-[--accent-hover] active:bg-[--accent]/80",
        secondary: "bg-[--panel] text-[--text] border border-[--border] hover:bg-[--interactive-hover] active:bg-[--interactive-active]",
        outline: "border border-[--accent] bg-transparent text-[--accent] hover:bg-[--accent] hover:text-[--bg] active:bg-[--accent]/80",
        ghost: "bg-transparent text-[--text] hover:bg-[--interactive-hover] active:bg-[--interactive-active]",
        link: "bg-transparent text-[--accent] underline-offset-4 hover:underline",
        success: "bg-[--success] text-white shadow-sm hover:bg-[--success]/90 active:bg-[--success]/80",
        warning: "bg-[--warning] text-white shadow-sm hover:bg-[--warning]/90 active:bg-[--warning]/80",
        danger: "bg-[--danger] text-white shadow-sm hover:bg-[--danger]/90 active:bg-[--danger]/80",
        glass: "bg-white/10 text-white border border-white/20 backdrop-blur-sm hover:bg-white/20 active:bg-white/30",
      },
      size: {
        xs: "h-6 px-2 text-xs rounded",
        sm: "h-8 px-3 text-sm rounded-md",
        md: "h-9 px-4 py-2 rounded-md",
        lg: "h-10 px-6 py-2 rounded-md text-base",
        xl: "h-12 px-8 py-3 rounded-lg text-lg",
        icon: "h-9 w-9 rounded-md",
      },
      animation: {
        none: "",
        scale: "hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-sm",
        bounce: "hover:animate-bounce",
        pulse: "hover:animate-pulse",
        glow: "hover:shadow-glow active:shadow-glow-lg",
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      animation: "none",
      fullWidth: false,
    },
  }
);

export const buttonGroupVariants = cva(
  "inline-flex",
  {
    variants: {
      orientation: {
        horizontal: "flex-row",
        vertical: "flex-col",
      },
      size: {
        sm: "rounded-md",
        md: "rounded-md",
        lg: "rounded-lg",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "md",
    },
  }
);

export const buttonGroupItemVariants = cva(
  "border-[--border]",
  {
    variants: {
      orientation: {
        horizontal: "border-r last:border-r-0",
        vertical: "border-b last:border-b-0",
      },
      size: {
        sm: "rounded-none",
        md: "rounded-none",
        lg: "rounded-none",
      },
    },
    defaultVariants: {
      orientation: "horizontal",
      size: "md",
    },
  }
);
