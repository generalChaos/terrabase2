'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { type ColorPalette } from '@/lib/colorPaletteGenerator';

interface ThemeContextType {
  theme: ColorPalette | null;
  setTheme: (theme: ColorPalette | null) => void;
  applyBalancedTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ColorPalette | null>(null);

  // Default balanced theme colors
  const applyBalancedTheme = () => {
    const balancedTheme: ColorPalette = {
      primary: '#3B82F6',      // Blue
      secondary: '#10B981',     // Green  
      accent: '#F59E0B',        // Orange
      background: '#F8FAFC',    // Very light gray
      surface: '#F1F5F9',       // Light gray
      text: {
        primary: '#1E293B',     // Dark slate
        secondary: '#64748B',   // Medium slate
        disabled: '#94A3B8'     // Light slate
      },
      border: '#E2E8F0',        // Light border
      success: '#10B981',
      warning: '#F59E0B', 
      error: '#EF4444',
      info: '#3B82F6',
      neutral: '#F1F5F9',
      shadow: 'rgba(15, 23, 42, 0.1)',
      gradients: {
        primary: 'linear-gradient(135deg, #3B82F6, #1D4ED8)',
        secondary: 'linear-gradient(135deg, #10B981, #059669)',
        background: 'linear-gradient(135deg, #F8FAFC, #F1F5F9)',
        surface: 'linear-gradient(135deg, #F1F5F9, #E2E8F0)'
      },
      interactive: {
        primary: {
          hover: '#2563EB',
          active: '#1D4ED8',
          disabled: 'rgba(59, 130, 246, 0.5)'
        },
        secondary: {
          hover: '#059669',
          active: '#047857',
          disabled: 'rgba(16, 185, 129, 0.5)'
        },
        success: {
          hover: '#059669',
          active: '#047857',
          disabled: 'rgba(16, 185, 129, 0.5)'
        },
        warning: {
          hover: '#D97706',
          active: '#B45309',
          disabled: 'rgba(245, 158, 11, 0.5)'
        },
        error: {
          hover: '#DC2626',
          active: '#B91C1C',
          disabled: 'rgba(239, 68, 68, 0.5)'
        }
      },
      states: {
        primary: {
          base: '#3B82F6',
          hover: '#2563EB',
          pressed: '#1D4ED8',
          focus: '#3B82F6',
          selected: '#3B82F6',
          disabled: 'rgba(59, 130, 246, 0.5)',
          outline: '#3B82F6',
          textOnFill: '#FFFFFF'
        },
        secondary: {
          base: '#10B981',
          hover: '#059669',
          pressed: '#047857',
          focus: '#10B981',
          selected: '#10B981',
          disabled: 'rgba(16, 185, 129, 0.5)',
          outline: '#10B981',
          textOnFill: '#FFFFFF'
        },
        success: {
          base: '#10B981',
          hover: '#059669',
          pressed: '#047857',
          focus: '#10B981',
          selected: '#10B981',
          disabled: 'rgba(16, 185, 129, 0.5)',
          outline: '#10B981',
          textOnFill: '#FFFFFF'
        },
        warning: {
          base: '#F59E0B',
          hover: '#D97706',
          pressed: '#B45309',
          focus: '#F59E0B',
          selected: '#F59E0B',
          disabled: 'rgba(245, 158, 11, 0.5)',
          outline: '#F59E0B',
          textOnFill: '#FFFFFF'
        },
        error: {
          base: '#EF4444',
          hover: '#DC2626',
          pressed: '#B91C1C',
          focus: '#EF4444',
          selected: '#EF4444',
          disabled: 'rgba(239, 68, 68, 0.5)',
          outline: '#EF4444',
          textOnFill: '#FFFFFF'
        },
        info: {
          base: '#3B82F6',
          hover: '#2563EB',
          pressed: '#1D4ED8',
          focus: '#3B82F6',
          selected: '#3B82F6',
          disabled: 'rgba(59, 130, 246, 0.5)',
          outline: '#3B82F6',
          textOnFill: '#FFFFFF'
        },
        accent: {
          base: '#F59E0B',
          hover: '#D97706',
          pressed: '#B45309',
          focus: '#F59E0B',
          selected: '#F59E0B',
          disabled: 'rgba(245, 158, 11, 0.5)',
          outline: '#F59E0B',
          textOnFill: '#FFFFFF'
        }
      },
      gradientRecipes: {
        primary: [
          {
            type: 'sheen',
            start: '#3B82F6',
            end: '#1D4ED8',
            direction: '135deg',
            description: 'Blue gradient for primary elements'
          }
        ],
        secondary: [
          {
            type: 'analogous',
            start: '#10B981',
            end: '#059669',
            direction: '90deg',
            description: 'Green gradient for secondary elements'
          }
        ],
        accent: [
          {
            type: 'depth',
            start: '#F59E0B',
            end: '#D97706',
            direction: '180deg',
            description: 'Orange gradient for accent elements'
          }
        ]
      },
      theme: 'light',
      isDarkTheme: false
    };
    
    setTheme(balancedTheme);
  };

  // Apply balanced theme on mount
  useEffect(() => {
    applyBalancedTheme();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, applyBalancedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
