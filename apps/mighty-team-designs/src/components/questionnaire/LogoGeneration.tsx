'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

export function LogoGeneration() {
  const { state, generateLogos } = useQuestionnaire();
  const hasGenerated = useRef(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    if (state.currentStep === 'generating' && state.round2Answers.length > 0 && !hasGenerated.current) {
      hasGenerated.current = true;
      generateLogos();
    }
  }, [state.currentStep, state.round2Answers.length, generateLogos]);

  // Reset the flag when step changes away from generating
  useEffect(() => {
    if (state.currentStep !== 'generating') {
      hasGenerated.current = false;
    }
  }, [state.currentStep]);

  // Generate QR code for results page
  useEffect(() => {
    if (state.flow?.id) {
      const resultsUrl = `${window.location.origin}/results/${state.flow.id}`;
      QRCode.toDataURL(resultsUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      }).then(setQrCodeDataUrl).catch(console.error);
    }
  }, [state.flow?.id]);

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Generating Your Logo
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          Our AI is creating custom logo options for <strong>{state.round1Answers.team_name}</strong>
        </p>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">
          What we&apos;re creating:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>High-resolution logo designs</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>Multiple style variations</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>Age-appropriate design</span>
          </div>
          <div className="flex items-center">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span>Sport-specific elements</span>
          </div>
        </div>
      </div>

      <div className="text-sm text-gray-500 mb-8">
        This usually takes 30-60 seconds...
      </div>

      {/* QR Code Section */}
      {qrCodeDataUrl && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📱 Access Your Results Later
          </h3>
          <div className="flex items-center justify-center space-x-6">
            <div className="flex-shrink-0">
              <img 
                src={qrCodeDataUrl} 
                alt="QR Code for results page" 
                className="w-32 h-32 border-2 border-white rounded-lg shadow-md"
              />
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Scan this QR code</strong> with your phone to access your logo results anytime.
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Perfect if you need to step away during generation!
              </p>
              <div className="text-xs text-gray-600 bg-white rounded px-3 py-2 font-mono break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/results/${state.flow?.id}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
