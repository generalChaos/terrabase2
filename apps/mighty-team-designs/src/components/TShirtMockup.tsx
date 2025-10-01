import React, { useState } from 'react';
import Image from 'next/image';

interface TShirtMockupProps {
  logoUrl: string;
  teamName: string;
}

const SHIRT_COLORS = [
  { name: 'White', value: '#FFFFFF', textColor: '#000000' },
  { name: 'Black', value: '#000000', textColor: '#FFFFFF' },
  { name: 'Navy', value: '#1E3A8A', textColor: '#FFFFFF' },
  { name: 'Gray', value: '#6B7280', textColor: '#FFFFFF' },
  { name: 'Red', value: '#DC2626', textColor: '#FFFFFF' },
  { name: 'Forest Green', value: '#166534', textColor: '#FFFFFF' },
];

export default function TShirtMockup({ logoUrl, teamName }: TShirtMockupProps) {
  const [selectedColor, setSelectedColor] = useState(SHIRT_COLORS[0]);
  const [view, setView] = useState<'front' | 'back'>('front');

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {teamName} T-Shirt Preview
        </h2>
        <p className="text-gray-600">
          See how your logo looks on different shirt colors
        </p>
      </div>

      {/* View Toggle */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setView('front')}
            className={`px-4 py-2 rounded-md transition-colors ${
              view === 'front'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Front
          </button>
          <button
            onClick={() => setView('back')}
            className={`px-4 py-2 rounded-md transition-colors ${
              view === 'back'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Back
          </button>
        </div>
      </div>

      {/* T-Shirt Display */}
      <div className="flex justify-center mb-8">
        <div className="relative w-80 h-96">
          {/* T-Shirt with Mask */}
          <div
            className="w-full h-full transition-colors duration-300"
            style={{
              backgroundColor: selectedColor.value,
              maskImage: 'url(/black_part_transparent.png)',
              maskSize: 'contain',
              maskRepeat: 'no-repeat',
              maskPosition: 'center',
              WebkitMaskImage: 'url(/black_part_transparent.png)',
              WebkitMaskSize: 'contain',
              WebkitMaskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center'
            }}
          />
          
          {/* Logo Overlay */}
          <div className="absolute inset-0 pointer-events-none">
            {/* Front View */}
            {view === 'front' && (
              <div className="relative w-full h-full">
                {/* Left Chest Logo */}
                <div className="absolute top-24 left-16 w-16 h-16">
                  <Image
                    src={logoUrl}
                    alt={`${teamName} logo`}
                    width={64}
                    height={64}
                    className="object-contain"
                  />
                </div>
              </div>
            )}

            {/* Back View */}
            {view === 'back' && (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Back Logo */}
                <div className="w-32 h-32">
                  <Image
                    src={logoUrl}
                    alt={`${teamName} logo`}
                    width={128}
                    height={128}
                    className="object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Color Options */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Shirt Color
        </h3>
        <div className="flex flex-wrap justify-center gap-3">
          {SHIRT_COLORS.map((color) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(color)}
              className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 ${
                selectedColor.name === color.name
                  ? 'border-gray-900 shadow-md'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{
                backgroundColor: color.value,
                color: color.textColor,
              }}
            >
              {color.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          💡 <strong>Tip:</strong> White and black shirts work well with most logo colors
        </p>
      </div>
    </div>
  );
}
