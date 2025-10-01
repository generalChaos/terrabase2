'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import QRCode from 'qrcode';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

export function LogoGeneration() {
  const { state, generateLogos } = useQuestionnaire();
  const hasGenerated = useRef(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [showQrCode, setShowQrCode] = useState(false);

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
      console.log('Generating QR code for URL:', resultsUrl); // Debug log
      QRCode.toDataURL(resultsUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      }).then((dataUrl) => {
        console.log('QR code generated successfully'); // Debug log
        setQrCodeDataUrl(dataUrl);
        // Show QR code after a short delay to ensure it's visible
        setTimeout(() => {
          setShowQrCode(true);
        }, 1000);
      }).catch((error) => {
        console.error('QR code generation failed:', error);
      });
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
      {qrCodeDataUrl && showQrCode && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200 animate-fade-in shadow-lg">
          <div className="text-center mb-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              📱 Access Your Results Later
            </h3>
            <p className="text-sm text-gray-600">
              Scan this QR code with your phone to access your logo results anytime
            </p>
          </div>
          
          <div className="flex flex-col items-center space-y-4">
            <div className="bg-white p-4 rounded-xl shadow-md border-2 border-purple-300">
              <Image 
                src={qrCodeDataUrl} 
                alt="QR Code for results page" 
                width={160}
                height={160}
                className="w-40 h-40"
              />
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Perfect if you need to step away during generation!</strong>
              </p>
              <div className="text-xs text-gray-600 bg-white rounded-lg px-4 py-2 font-mono break-all border">
                {typeof window !== 'undefined' ? `${window.location.origin}/results/${state.flow?.id}` : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Loading State */}
      {state.flow?.id && !qrCodeDataUrl && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Preparing QR code...</span>
          </div>
        </div>
      )}
    </div>
  );
}
