'use client';

import React, { useEffect, useRef } from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';

export function LogoGeneration() {
  const { state, generateLogos } = useQuestionnaire();
  const hasGenerated = useRef(false);

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

      <div className="text-sm text-gray-500">
        This usually takes 30-60 seconds...
      </div>
    </div>
  );
}
