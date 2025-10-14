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
    <div className={`relative bg-white rounded-lg border-2 transition-all duration-200 cursor-pointer ${
      isSelected 
        ? 'border-blue-500 shadow-lg ring-2 ring-blue-200' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
    }`}
    onClick={onSelect}>
      {/* Logo Preview */}
      <div className="aspect-square bg-gray-100 rounded-t-lg flex items-center justify-center p-4">
        {logo.public_url ? (
          <Image
            src={logo.public_url}
            alt="Team logo"
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
            <p className="text-sm">Loading...</p>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4">
        <div className="space-y-2">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            className="w-full py-2 px-4 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
