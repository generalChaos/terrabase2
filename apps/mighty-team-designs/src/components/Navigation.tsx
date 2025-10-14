'use client';

import React from 'react';
import Link from 'next/link';
import { ThemedButton, ThemedText } from './ThemedContainer';
import { useTheme } from '@/contexts/ThemeContext';

export function Navigation() {
  const { theme } = useTheme();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-lg"
              style={{ backgroundColor: theme?.primary || '#3B82F6' }}
            ></div>
            <ThemedText variant="primary" size="lg" className="text-xl font-bold">
              Mighty Team Designs
            </ThemedText>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/color-analyzer" className="text-gray-600 hover:text-gray-900 transition-colors">
              Color Analyzer
            </Link>
            <Link href="/questionnaire" className="text-gray-600 hover:text-gray-900 transition-colors">
              Create Logo
            </Link>
            <Link href="/admin" className="text-gray-600 hover:text-gray-900 transition-colors">
              Admin
            </Link>
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/questionnaire">
              <ThemedButton variant="primary" size="sm">
                Get Started
              </ThemedButton>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
