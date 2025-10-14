'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemedContainerProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'page' | 'card' | 'surface' | 'accent';
}

export function ThemedContainer({ children, className = '', variant = 'page' }: ThemedContainerProps) {
  const { theme } = useTheme();

  if (!theme) {
    return <div className={className}>{children}</div>;
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'page':
        return {
          backgroundColor: theme.background,
          color: theme.text.primary,
          minHeight: '100vh'
        };
      case 'card':
        return {
          backgroundColor: theme.surface,
          color: theme.text.primary,
          border: `1px solid ${theme.border}`,
          boxShadow: `0 4px 6px -1px ${theme.shadow}`
        };
      case 'surface':
        return {
          backgroundColor: theme.surface,
          color: theme.text.primary,
          border: `1px solid ${theme.border}`
        };
      case 'accent':
        return {
          background: theme.gradients.primary,
          color: theme.states.primary.textOnFill
        };
      default:
        return {};
    }
  };

  return (
    <div 
      className={`rounded-lg ${className}`}
      style={getVariantStyles()}
    >
      {children}
    </div>
  );
}

interface ThemedButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function ThemedButton({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md',
  className = '',
  disabled = false
}: ThemedButtonProps) {
  const { theme } = useTheme();

  if (!theme) {
    return <button className={className} onClick={onClick}>{children}</button>;
  }

  const getVariantStyles = () => {
    const baseStyles = {
      border: 'none',
      borderRadius: '0.5rem',
      fontWeight: '500',
      transition: 'all 0.2s ease-in-out',
      cursor: 'pointer'
    };

    const sizeStyles = {
      sm: { padding: '0.25rem 0.75rem', fontSize: '0.875rem' },
      md: { padding: '0.5rem 1rem', fontSize: '1rem' },
      lg: { padding: '0.75rem 1.5rem', fontSize: '1.125rem' }
    };

    const variantStyles = {
      primary: {
        backgroundColor: theme.states.primary.base,
        color: theme.states.primary.textOnFill
      },
      secondary: {
        backgroundColor: theme.states.secondary.base,
        color: theme.states.secondary.textOnFill
      },
      accent: {
        backgroundColor: theme.states.accent.base,
        color: theme.states.accent.textOnFill
      },
      success: {
        backgroundColor: theme.states.success.base,
        color: theme.states.success.textOnFill
      },
      warning: {
        backgroundColor: theme.states.warning.base,
        color: theme.states.warning.textOnFill
      },
      error: {
        backgroundColor: theme.states.error.base,
        color: theme.states.error.textOnFill
      }
    };

    return {
      ...baseStyles,
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  return (
    <button 
      className={className}
      style={getVariantStyles()}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      onMouseEnter={disabled ? undefined : (e) => {
        const variantStyles = getVariantStyles();
        e.currentTarget.style.backgroundColor = theme.states[variant].hover;
      }}
      onMouseLeave={disabled ? undefined : (e) => {
        const variantStyles = getVariantStyles();
        e.currentTarget.style.backgroundColor = theme.states[variant].base;
      }}
      onMouseDown={disabled ? undefined : (e) => {
        e.currentTarget.style.backgroundColor = theme.states[variant].pressed;
      }}
      onMouseUp={disabled ? undefined : (e) => {
        e.currentTarget.style.backgroundColor = theme.states[variant].hover;
      }}
    >
      {children}
    </button>
  );
}

interface ThemedTextProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'disabled' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function ThemedText({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '' 
}: ThemedTextProps) {
  const { theme } = useTheme();

  if (!theme) {
    return <span className={className}>{children}</span>;
  }

  const getVariantStyles = () => {
    const sizeStyles = {
      xs: { fontSize: '0.75rem', lineHeight: '1rem' },
      sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },
      md: { fontSize: '1rem', lineHeight: '1.5rem' },
      lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },
      xl: { fontSize: '1.25rem', lineHeight: '1.75rem' }
    };

    const variantStyles = {
      primary: { color: theme.text.primary },
      secondary: { color: theme.text.secondary },
      disabled: { color: theme.text.disabled },
      accent: { color: theme.primary }
    };

    return {
      ...sizeStyles[size],
      ...variantStyles[variant]
    };
  };

  return (
    <span 
      className={className}
      style={getVariantStyles()}
    >
      {children}
    </span>
  );
}
