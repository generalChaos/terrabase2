'use client';

import React from 'react';
import { MascotOption } from '@/lib/services/questionService';
import { cn } from '@/utils/cn';

interface MascotSelectionProps {
  mascots: MascotOption[];
  selectedMascot: string | null;
  onMascotSelect: (mascotId: string) => void;
  customMascotInput?: string;
  onCustomMascotChange?: (value: string) => void;
  className?: string;
}

export function MascotSelection({ 
  mascots, 
  selectedMascot, 
  onMascotSelect, 
  customMascotInput = '',
  onCustomMascotChange,
  className 
}: MascotSelectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose your mascot:
        </h3>
        <p className="text-sm text-gray-600">
          Select the mascot that best represents your team&apos;s spirit
        </p>
      </div>

      <div className="space-y-3">
        {mascots.map((mascot) => (
          <label
            key={mascot.id}
            className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
              selectedMascot === mascot.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="mascot"
              value={mascot.id}
              checked={selectedMascot === mascot.id}
              onChange={() => onMascotSelect(mascot.id)}
              className="mt-1 mr-3 text-blue-600 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-semibold text-gray-900 mb-1">
                {mascot.name}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                {mascot.description}
              </div>
              <div className="text-xs text-gray-500">
                {mascot.characteristics.join(' • ')}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Custom mascot input */}
      {selectedMascot === 'custom_mascot' && onCustomMascotChange && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <label htmlFor="custom-mascot" className="block text-sm font-medium text-gray-700 mb-2">
            Describe your custom mascot:
          </label>
          <input
            id="custom-mascot"
            type="text"
            value={customMascotInput}
            onChange={(e) => onCustomMascotChange(e.target.value)}
            placeholder="e.g., 'a fierce dragon' or 'a lightning bolt' or 'a golden phoenix'"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="mt-2 text-xs text-gray-600">
            Be creative! Describe any mascot concept you have in mind.
          </p>
        </div>
      )}
    </div>
  );
}

interface MascotCardProps {
  mascot: MascotOption;
  isSelected: boolean;
  onSelect: () => void;
}

function MascotCard({ mascot, isSelected, onSelect }: MascotCardProps) {
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

      {/* Mascot icon placeholder */}
      <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
        <div className="text-4xl sm:text-6xl">
          {getMascotEmoji(mascot.name)}
        </div>
      </div>

      {/* Mascot info */}
      <div className="text-center space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">
          {mascot.name}
        </h4>
        
        <p className="text-xs text-gray-600 leading-tight">
          {mascot.description}
        </p>

        {/* Characteristics */}
        <div className="flex flex-wrap gap-1 justify-center">
          {mascot.characteristics.map((characteristic, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
            >
              {characteristic}
            </span>
          ))}
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

function getMascotEmoji(mascotName: string): string {
  const emojiMap: Record<string, string> = {
    'Eagle': '🦅',
    'Lion': '🦁',
    'Shark': '🦈',
    'Bear': '🐻',
    'Tiger': '🐅',
    'Wolf': '🐺',
    'Hawk': '🦅',
    'Panther': '🐆',
    'Falcon': '🦅',
    'Bull': '🐂',
    'Ram': '🐏',
    'Stallion': '🐎',
    'Dragon': '🐉',
    'Phoenix': '🔥',
    'Thunder': '⚡',
    'Lightning': '⚡',
    'Storm': '⛈️',
    'Fire': '🔥',
    'Ice': '❄️',
    'Wind': '💨'
  };

  // Try exact match first
  if (emojiMap[mascotName]) {
    return emojiMap[mascotName];
  }

  // Try partial matches
  const lowerName = mascotName.toLowerCase();
  for (const [key, emoji] of Object.entries(emojiMap)) {
    if (lowerName.includes(key.toLowerCase())) {
      return emoji;
    }
  }

  // Default fallback
  return '🏆';
}
