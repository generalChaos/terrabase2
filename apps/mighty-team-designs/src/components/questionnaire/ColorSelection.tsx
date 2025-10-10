'use client';

import React from 'react';
import { ColorOption } from '@/lib/services/questionService';
import { cn } from '@/utils/cn';

interface ColorSelectionProps {
  colors: ColorOption[];
  selectedColor: string | null;
  onColorSelect: (colorId: string) => void;
  customColorInput?: string;
  onCustomColorChange?: (value: string) => void;
  className?: string;
}

export function ColorSelection({ 
  colors, 
  selectedColor, 
  onColorSelect, 
  customColorInput = '',
  onCustomColorChange,
  className 
}: ColorSelectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose your team colors:
        </h3>
        <p className="text-sm text-gray-600">
          Select the color combination that best represents your team
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {colors.map((color) => (
          <ColorCard
            key={color.id}
            color={color}
            isSelected={selectedColor === color.id}
            onSelect={() => onColorSelect(color.id)}
          />
        ))}
      </div>

      {/* Custom color input */}
      {selectedColor === 'custom_colors' && onCustomColorChange && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label htmlFor="custom-colors" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your custom colors:
          </label>
          <input
            id="custom-colors"
            type="text"
            value={customColorInput}
            onChange={(e) => onCustomColorChange(e.target.value)}
            placeholder="e.g., 'purple and teal' or 'navy blue with gold accents'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-600">
            Be as specific as you'd like - we'll use this to create your perfect logo colors!
          </p>
        </div>
      )}
    </div>
  );
}

interface ColorCardProps {
  color: ColorOption;
  isSelected: boolean;
  onSelect: () => void;
}

function ColorCard({ color, isSelected, onSelect }: ColorCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative group p-4 sm:p-6 rounded-xl border-2 transition-all duration-300 w-full',
        'hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'sm:max-w-none',
        isSelected
          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-200 bg-white hover:border-gray-300'
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          SELECTED
        </div>
      )}

      {/* Color palette display */}
      <div className="flex items-center justify-center space-x-3 mb-4">
        <div 
          className="w-10 h-10 rounded-full border-2 border-gray-300"
          style={{ backgroundColor: color.primary }}
          title={`Primary: ${color.primary}`}
        />
        <div 
          className="w-10 h-10 rounded-full border-2 border-gray-300"
          style={{ backgroundColor: color.secondary }}
          title={`Secondary: ${color.secondary}`}
        />
      </div>

      {/* Color info */}
      <div className="text-center space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">
          {color.name}
        </h4>
        
        <p className="text-xs text-gray-600 leading-tight">
          {color.description}
        </p>

        {/* Color codes */}
        <div className="text-xs text-gray-500">
          <div className="flex justify-center space-x-2">
            <span className="font-mono">{color.primary}</span>
            <span className="font-mono">{color.secondary}</span>
          </div>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className={cn(
        'absolute inset-0 rounded-xl transition-opacity duration-300',
        'bg-gradient-to-t from-blue-500/10 to-transparent',
        'opacity-0 group-hover:opacity-100'
      )} />
    </button>
  );
}
