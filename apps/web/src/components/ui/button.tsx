import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

/**
 * Unified Button Design System
 * 
 * This system provides consistent button styling across the entire app with:
 * - Semantic variants for different action types
 * - Consistent sizing scale (xs to xl)
 * - Unified hover animations and interactions
 * - Accessible focus states
 * 
 * Usage Examples:
 * 
 * // Primary action (form submit, main actions)
 * <Button variant="primary" size="lg">Create Room</Button>
 * 
 * // Secondary action (utility, secondary actions)
 * <Button variant="secondary" size="md">Randomize</Button>
 * 
 * // Game-specific button (dynamic colors)
 * <Button variant="game" size="lg" className={`bg-gradient-to-r ${game.color}`}>
 *   Play Now
 * </Button>
 * 
 * // Success action (apply, confirm)
 * <Button variant="success" size="md">Apply Changes</Button>
 * 
 * // Danger action (delete, remove)
 * <Button variant="danger" size="sm">Delete</Button>
 * 
 * // Info action (help, info)
 * <Button variant="info" size="md">Learn More</Button>
 * 
 * // Warning action (caution, alert)
 * <Button variant="warning" size="md">Proceed with Caution</Button>
 * 
 * // Ghost action (minimal, subtle)
 * <Button variant="ghost" size="md">Cancel</Button>
 * 
 * // Outline action (bordered, subtle)
 * <Button variant="outline" size="md">Save Draft</Button>
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-teal-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
  {
    variants: {
      variant: {
        // Primary actions - main game buttons, form submissions
        primary: 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl',
        
        // Secondary actions - randomize, utility buttons
        secondary: 'bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-white',
        
        // Game-specific colors - dynamic game buttons
        game: 'bg-gradient-to-r text-white shadow-lg hover:shadow-xl',
        
        // Success actions - apply, confirm
        success: 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl',
        
        // Danger actions - delete, remove
        danger: 'bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl',
        
        // Info actions - info, help
        info: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl',
        
        // Warning actions - caution, alert
        warning: 'bg-yellow-600 hover:bg-yellow-700 text-white shadow-lg hover:shadow-xl',
        
        // Ghost actions - minimal, subtle
        ghost: 'bg-transparent hover:bg-white/10 text-white border border-white/20',
        
        // Outline actions - bordered, subtle
        outline: 'bg-transparent border border-slate-600 text-white hover:bg-slate-700/50',
      },
      size: {
        xs: 'h-7 px-3 py-1.5 text-xs rounded-lg',      // Small utility buttons
        sm: 'h-8 px-4 py-2 text-sm rounded-lg',        // Compact buttons
        md: 'h-10 px-6 py-2.5 text-base rounded-xl',   // Standard buttons
        lg: 'h-12 px-8 py-3 text-lg rounded-2xl',      // Large buttons
        xl: 'h-14 px-10 py-4 text-xl rounded-2xl',     // Extra large buttons
        icon: 'h-10 w-10 p-0 rounded-xl',               // Icon-only buttons
      },
      animation: {
        none: '',                                        // No animation
        lift: 'hover:-translate-y-1 hover:shadow-glow active:translate-y-0',  // Lift effect (default)
        scale: 'hover:scale-105 active:scale-95',       // Scale effect
        glow: 'hover:brightness-110',                   // Brightness glow
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      animation: 'lift',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, animation, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, animation, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
