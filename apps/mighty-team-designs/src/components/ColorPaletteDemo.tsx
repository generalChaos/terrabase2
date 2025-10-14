'use client';

import React, { useState, useEffect } from 'react';
import { generateColorSuggestions, type AnalyzedColor, type ColorCombination } from '@/lib/colorPaletteGenerator';
import { ColorSuggestions } from './ColorSuggestions';

interface ColorPaletteDemoProps {
  analyzedColors: AnalyzedColor[];
  onPaletteGenerated?: (palette: any) => void;
}

export function ColorPaletteDemo({ analyzedColors, onPaletteGenerated }: ColorPaletteDemoProps) {
  const [suggestions, setSuggestions] = useState<ColorCombination[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<ColorCombination | null>(null);

  useEffect(() => {
    console.log('🎨 ColorPaletteDemo: analyzedColors changed:', analyzedColors);
    if (analyzedColors.length > 0) {
      // Generate smart color suggestions instead of a full theme
      const colorSuggestions = generateColorSuggestions(analyzedColors);
      console.log('🎨 ColorPaletteDemo: Generated suggestions:', colorSuggestions);
      setSuggestions(colorSuggestions);
      
      // Auto-select the first suggestion
      if (colorSuggestions.length > 0) {
        setSelectedSuggestion(colorSuggestions[0]);
        onPaletteGenerated?.(colorSuggestions[0]);
      }
    }
  }, [analyzedColors, onPaletteGenerated]);

  const handleSuggestionSelect = (suggestion: ColorCombination) => {
    setSelectedSuggestion(suggestion);
    onPaletteGenerated?.(suggestion);
  };

  if (suggestions.length === 0) {
    return <div className="p-4 text-gray-500">No colors analyzed yet</div>;
  }

  return (
    <ColorSuggestions 
      suggestions={suggestions}
      onSuggestionSelect={handleSuggestionSelect}
    />
  );
}
