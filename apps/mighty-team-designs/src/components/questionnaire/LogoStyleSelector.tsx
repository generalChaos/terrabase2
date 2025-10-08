'use client';

import React from 'react';
import Image from 'next/image';
import { LOGO_STYLES, LogoStyle } from '@/constants/logoStyles';
import { cn } from '@/utils/cn';

interface LogoStyleSelectorProps {
  selectedStyle: string | null;
  onStyleSelect: (styleId: string) => void;
  className?: string;
}

export function LogoStyleSelector({ 
  selectedStyle, 
  onStyleSelect, 
  className 
}: LogoStyleSelectorProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose your logo style:
        </h3>
        <p className="text-sm text-gray-600">
          Select the style that best represents your team
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {LOGO_STYLES.map((style) => (
          <LogoStyleCard
            key={style.id}
            style={style}
            isSelected={selectedStyle === style.id}
            onSelect={() => onStyleSelect(style.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface LogoStyleCardProps {
  style: LogoStyle;
  isSelected: boolean;
  onSelect: () => void;
}

function LogoStyleCard({ style, isSelected, onSelect }: LogoStyleCardProps) {
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

      {/* Style image */}
      <div className="aspect-square bg-gray-100 rounded-lg mb-4 sm:mb-3 overflow-hidden relative p-2 mx-auto max-w-[200px] sm:max-w-none">
        <div className="w-full h-full relative">
          <Image
            src={style.image}
            alt={`${style.name} style example`}
            fill
            className="object-cover rounded"
          />
        </div>
      </div>

      {/* Style info */}
      <div className="text-center space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm">
          {style.name}
        </h4>
        
        <p className="text-xs text-gray-600 leading-tight">
          {style.description}
        </p>

        {/* Soccer tag for all except classic */}
        {style.id !== 'classic-and-iconic' && (
          <div className="flex justify-center">
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Soccer
            </span>
          </div>
        )}
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
