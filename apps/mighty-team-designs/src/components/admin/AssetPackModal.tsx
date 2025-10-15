'use client';

import React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface AssetPack {
  id: string;
  asset_pack_id: string;
  clean_logo_url: string;
  tshirt_front_url: string;
  tshirt_back_url: string;
  banner_url?: string;
  processing_time_ms: number;
  created_at: string;
}

interface Logo {
  id: string;
  public_url: string;
  variant_number: number;
  is_selected: boolean;
  created_at: string;
  flow: {
    id: string;
    team_name: string;
    sport: string;
    current_step: string;
  };
  asset_packs: AssetPack[];
}

interface AssetPackModalProps {
  logo: Logo | null;
  isOpen: boolean;
  onClose: () => void;
  onGoToResult: (flowId: string) => void;
}

export function AssetPackModal({ logo, isOpen, onClose, onGoToResult }: AssetPackModalProps) {
  if (!isOpen || !logo) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleGoToResultClick = () => {
    onGoToResult(logo.flow.id);
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {logo.flow.team_name} - Asset Packs
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {logo.flow.sport} • Variant {logo.variant_number}
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={handleGoToResultClick}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              Go to Result Page
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Original Logo */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Original Logo</h3>
            <div className="flex justify-center">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <Image
                  src={logo.public_url}
                  alt={`${logo.flow.team_name} Logo`}
                  width={256}
                  height={256}
                  className="max-w-xs max-h-64 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-logo.png';
                  }}
                />
              </div>
            </div>
          </div>

          {/* Asset Packs */}
          {logo.asset_packs.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Asset Packs ({logo.asset_packs.length})
              </h3>
              <div className="space-y-6">
                {logo.asset_packs.map((assetPack, index) => (
                  <div key={assetPack.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-center mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">
                        Asset Pack #{index + 1}
                      </h4>
                      <p className="text-xs text-gray-500">
                        ID: {assetPack.asset_pack_id}
                      </p>
                      <p className="text-xs text-gray-500">
                        Processed in {assetPack.processing_time_ms}ms
                      </p>
                    </div>

                    {/* Asset Pack Images */}
                    <div className="grid grid-cols-4 gap-4">
                      {/* Clean Logo */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Clean Logo
                        </label>
                        <div className="bg-white rounded border border-gray-200 p-2">
                          <Image
                            src={assetPack.clean_logo_url}
                            alt="Clean Logo"
                            width={128}
                            height={128}
                            className="w-full h-32 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-logo.png';
                            }}
                          />
                        </div>
                      </div>

                      {/* T-shirt Front */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          T-shirt Front
                        </label>
                        <div className="bg-white rounded border border-gray-200 p-2">
                          <Image
                            src={assetPack.tshirt_front_url}
                            alt="T-shirt Front"
                            width={128}
                            height={128}
                            className="w-full h-32 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-logo.png';
                            }}
                          />
                        </div>
                      </div>

                      {/* T-shirt Back */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          T-shirt Back
                        </label>
                        <div className="bg-white rounded border border-gray-200 p-2">
                          <Image
                            src={assetPack.tshirt_back_url}
                            alt="T-shirt Back"
                            width={128}
                            height={128}
                            className="w-full h-32 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-logo.png';
                            }}
                          />
                        </div>
                      </div>

                      {/* Banner (if available) */}
                      {assetPack.banner_url && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Banner
                          </label>
                          <div className="bg-white rounded border border-gray-200 p-2">
                            <Image
                              src={assetPack.banner_url}
                              alt="Banner"
                              width={128}
                              height={128}
                              className="w-full h-32 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-logo.png';
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Asset Packs</h3>
              <p className="text-gray-500">
                This logo doesn&apos;t have any asset packs generated yet.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            onClick={onClose}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
