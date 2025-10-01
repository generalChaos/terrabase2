'use client';

import React from 'react';
import Image from 'next/image';
import { LogoVariant } from '@/types';
import { Button } from '@/components/ui/Button';

interface LogoCardProps {
  logo: LogoVariant;
  isSelected: boolean;
  onSelect: () => void;
  onDownload: () => void;
  variantNumber: number;
}

export function LogoCard({ logo, isSelected, onSelect, onDownload, variantNumber }: LogoCardProps) {
  return (
    <div className={`relative bg-white rounded-lg border-2 transition-all duration-200 ${
      isSelected 
        ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}>
      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
          SELECTED
        </div>
      )}

      {/* Logo Preview */}
      <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center p-4">
        {logo.public_url ? (
          <Image
            src={logo.public_url}
            alt={`Logo variant ${variantNumber}`}
            width={200}
            height={200}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-gray-400 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2 flex items-center justify-center">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm">Logo {variantNumber}</p>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900">
            Variant {variantNumber}
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full ${
            isSelected ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {isSelected ? 'Selected' : 'Option'}
          </span>
        </div>

        <div className="space-y-2">
          <Button
            onClick={onSelect}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isSelected ? 'Selected' : 'Select This Logo'}
          </Button>

          <Button
            onClick={onDownload}
            className="w-full py-2 px-4 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
