'use client';

import React from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';
import { Round1Form } from './Round1Form';
import { V1Round2Form } from './V1Round2Form';
import { LogoGeneration } from './LogoGeneration';
import { LogoSelection } from './LogoSelection';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export function QuestionnaireFlow() {
  const { state, dispatch } = useQuestionnaire();

  if (state.error) {
    return <ErrorMessage message={state.error} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Your Team Logo
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Answer a few questions and we&apos;ll generate custom logo options for your team
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-2 sm:space-x-4 overflow-x-auto">
            <div className={`flex items-center ${state.currentStep === 'round1' ? 'text-blue-600' : state.currentStep === 'round2' || state.currentStep === 'generating' || state.currentStep === 'results' || state.currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${state.currentStep === 'round1' ? 'bg-blue-600 text-white' : state.currentStep === 'round2' || state.currentStep === 'generating' || state.currentStep === 'results' || state.currentStep === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Basic Info</span>
            </div>
            
            <div className={`w-8 h-0.5 sm:w-16 ${state.currentStep === 'round2' || state.currentStep === 'generating' || state.currentStep === 'results' || state.currentStep === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center ${state.currentStep === 'round2' ? 'text-blue-600' : state.currentStep === 'generating' || state.currentStep === 'results' || state.currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${state.currentStep === 'round2' ? 'bg-blue-600 text-white' : state.currentStep === 'generating' || state.currentStep === 'results' || state.currentStep === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Preferences</span>
            </div>
            
            <div className={`w-8 h-0.5 sm:w-16 ${state.currentStep === 'generating' || state.currentStep === 'results' || state.currentStep === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center ${state.currentStep === 'generating' ? 'text-blue-600' : state.currentStep === 'results' || state.currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${state.currentStep === 'generating' ? 'bg-blue-600 text-white' : state.currentStep === 'results' || state.currentStep === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Generate</span>
            </div>
            
            <div className={`w-8 h-0.5 sm:w-16 ${state.currentStep === 'results' || state.currentStep === 'completed' ? 'bg-green-600' : 'bg-gray-300'}`} />
            
            <div className={`flex items-center ${state.currentStep === 'results' ? 'text-blue-600' : state.currentStep === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${state.currentStep === 'results' ? 'bg-blue-600 text-white' : state.currentStep === 'completed' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'}`}>
                4
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Select</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {state.currentStep === 'round1' && <Round1Form />}
          {state.currentStep === 'round2' && <V1Round2Form />}
          {state.currentStep === 'generating' && <LogoGeneration />}
          {state.currentStep === 'completed' && <LogoSelection />}
        </div>
      </div>
    </div>
  );
}
