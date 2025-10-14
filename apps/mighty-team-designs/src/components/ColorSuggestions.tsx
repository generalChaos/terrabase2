'use client';

import React, { useState } from 'react';
import { type ColorCombination, generateCSSVariables, generateTailwindConfig } from '@/lib/colorPaletteGenerator';

interface ColorSuggestionsProps {
  suggestions: ColorCombination[];
  onSuggestionSelect?: (suggestion: ColorCombination) => void;
}

export function ColorSuggestions({ suggestions, onSuggestionSelect }: ColorSuggestionsProps) {
  console.log('🎨 ColorSuggestions: Received suggestions:', suggestions);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [showCode, setShowCode] = useState<'css' | 'tailwind' | 'none'>('none');

  const handleSuggestionClick = (suggestion: ColorCombination) => {
    setSelectedSuggestion(suggestion.id);
    onSuggestionSelect?.(suggestion);
  };

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-gray-500">
          <p>No color suggestions available</p>
          <p className="text-sm">Analyze an image to get color combination suggestions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-2">Smart Color Suggestions</h3>
        <p className="text-gray-600 text-sm">
          Choose from these carefully crafted color combinations based on your image analysis
        </p>
      </div>

      {/* Color Suggestions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`bg-white rounded-lg shadow-md p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedSuggestion === suggestion.id 
                ? 'ring-2 ring-blue-500 shadow-lg' 
                : 'hover:scale-105'
            }`}
            onClick={() => handleSuggestionClick(suggestion)}
          >
            {/* Suggestion Header */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-gray-800 mb-1">
                {suggestion.name}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                {suggestion.description}
              </p>
              <p className="text-xs text-gray-500 italic">
                {suggestion.reasoning}
              </p>
            </div>

            {/* Color Palette Preview */}
            <div className="space-y-3">
              {/* Primary & Secondary */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Primary</div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: suggestion.primary }}
                    />
                    <span className="text-xs font-mono">{suggestion.primary}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Secondary</div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: suggestion.secondary }}
                    />
                    <span className="text-xs font-mono">{suggestion.secondary}</span>
                  </div>
                </div>
              </div>

              {/* Accent */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Accent</div>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-8 h-8 rounded border border-gray-300"
                    style={{ backgroundColor: suggestion.accent }}
                  />
                  <span className="text-xs font-mono">{suggestion.accent}</span>
                </div>
              </div>

              {/* Background & Surface */}
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Background</div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: suggestion.background }}
                    />
                    <span className="text-xs font-mono">{suggestion.background}</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-gray-500 mb-1">Surface</div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded border border-gray-300"
                      style={{ backgroundColor: suggestion.surface }}
                    />
                    <span className="text-xs font-mono">{suggestion.surface}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Preview */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-xs text-gray-500 mb-2">Preview</div>
              <div className="space-y-2">
                <button 
                  className="w-full px-3 py-2 rounded text-white text-sm font-medium"
                  style={{ backgroundColor: suggestion.primary }}
                >
                  Sample Button
                </button>
                <div 
                  className="p-3 rounded text-sm"
                  style={{ 
                    backgroundColor: suggestion.surface,
                    color: suggestion.text
                  }}
                >
                  Sample card with {suggestion.name.toLowerCase()} colors
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Code Generation for Selected Suggestion */}
      {selectedSuggestion && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Code Generation</h3>
            <select
              value={showCode}
              onChange={(e) => setShowCode(e.target.value as 'css' | 'tailwind' | 'none')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="none">No Code</option>
              <option value="css">CSS Variables</option>
              <option value="tailwind">Tailwind Config</option>
            </select>
          </div>

          {showCode !== 'none' && (
            <div className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
              <pre>
                <code>
                  {showCode === 'css' 
                    ? generateCSSVariables({
                        primary: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                        secondary: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
                        accent: suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000',
                        background: suggestions.find(s => s.id === selectedSuggestion)?.background || '#FFFFFF',
                        surface: suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5',
                        text: {
                          primary: suggestions.find(s => s.id === selectedSuggestion)?.text || '#000000',
                          secondary: suggestions.find(s => s.id === selectedSuggestion)?.text || '#666666',
                          disabled: '#999999'
                        },
                        border: suggestions.find(s => s.id === selectedSuggestion)?.surface || '#E5E5E5',
                        success: '#10B981',
                        warning: '#F59E0B',
                        error: '#EF4444',
                        info: '#3B82F6',
                        neutral: suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5',
                        shadow: 'rgba(0, 0, 0, 0.1)',
                        gradients: {
                          primary: `linear-gradient(135deg, ${suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000'}, ${suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000'})`,
                          secondary: `linear-gradient(135deg, ${suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000'}, ${suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5'})`,
                          background: `linear-gradient(135deg, ${suggestions.find(s => s.id === selectedSuggestion)?.background || '#FFFFFF'}, ${suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5'})`,
                          surface: `linear-gradient(135deg, ${suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5'}, ${suggestions.find(s => s.id === selectedSuggestion)?.background || '#FFFFFF'})`
                        },
                        interactive: {
                          primary: {
                            hover: '#333333',
                            active: '#000000',
                            disabled: 'rgba(0, 0, 0, 0.5)'
                          },
                          secondary: {
                            hover: '#555555',
                            active: '#444444',
                            disabled: 'rgba(102, 102, 102, 0.5)'
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
                            base: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                            hover: '#333333',
                            pressed: '#000000',
                            focus: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                            selected: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                            disabled: 'rgba(0, 0, 0, 0.5)',
                            outline: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                            textOnFill: '#FFFFFF'
                          },
                          secondary: {
                            base: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
                            hover: '#555555',
                            pressed: '#444444',
                            focus: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
                            selected: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
                            disabled: 'rgba(102, 102, 102, 0.5)',
                            outline: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
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
                            base: suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000',
                            hover: '#2563EB',
                            pressed: '#1D4ED8',
                            focus: suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000',
                            selected: suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000',
                            disabled: 'rgba(59, 130, 246, 0.5)',
                            outline: suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000',
                            textOnFill: '#FFFFFF'
                          }
                        },
                        gradientRecipes: {
                          primary: [
                            {
                              type: 'sheen',
                              start: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                              end: '#333333',
                              direction: '135deg',
                              description: 'Subtle sheen effect for primary elements'
                            }
                          ],
                          secondary: [
                            {
                              type: 'analogous',
                              start: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
                              end: suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5',
                              direction: '90deg',
                              description: 'Analogous color harmony'
                            }
                          ],
                          accent: [
                            {
                              type: 'depth',
                              start: suggestions.find(s => s.id === selectedSuggestion)?.background || '#FFFFFF',
                              end: suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5',
                              direction: '180deg',
                              description: 'Depth and dimension for surfaces'
                            }
                          ]
                        },
                        theme: 'light',
                        isDarkTheme: false
                      })
                    : JSON.stringify({
                        colors: {
                          primary: suggestions.find(s => s.id === selectedSuggestion)?.primary || '#000000',
                          secondary: suggestions.find(s => s.id === selectedSuggestion)?.secondary || '#000000',
                          accent: suggestions.find(s => s.id === selectedSuggestion)?.accent || '#000000',
                          background: suggestions.find(s => s.id === selectedSuggestion)?.background || '#FFFFFF',
                          surface: suggestions.find(s => s.id === selectedSuggestion)?.surface || '#F5F5F5',
                          text: suggestions.find(s => s.id === selectedSuggestion)?.text || '#000000'
                        }
                      }, null, 2)
                  }
                </code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
