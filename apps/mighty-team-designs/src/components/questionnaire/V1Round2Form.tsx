'use client';

import React, { useEffect, useState } from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';
import { Button } from '@/components/ui/Button';
import { ColorSelection } from './ColorSelection';
import { MascotSelection } from './MascotSelection';

export function V1Round2Form() {
  const { state, dispatch, generateColorsAndMascots, generateLogos } = useQuestionnaire();
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  // Auto-generate colors and mascots when component mounts
  useEffect(() => {
    console.log('🔄 V1Round2Form useEffect triggered:', {
      hasFlow: !!state.flow,
      colorsLength: state.colors.length,
      mascotsLength: state.mascots.length,
      hasGenerated,
      isLoading: state.isLoading
    });
    
    if (state.flow && state.colors.length === 0 && state.mascots.length === 0 && !hasGenerated) {
      console.log('🚀 Starting colors and mascots generation...');
      generateColorsAndMascots();
      setHasGenerated(true);
    }
  }, [state.flow, state.colors.length, state.mascots.length, hasGenerated, generateColorsAndMascots, state.isLoading]);

  const handleColorSelect = (colorId: string) => {
    dispatch({ type: 'SELECT_COLORS', payload: colorId });
  };

  const handleMascotSelect = (mascotId: string) => {
    dispatch({ type: 'SELECT_MASCOT', payload: mascotId });
  };

  const handleCustomColorChange = (value: string) => {
    dispatch({ type: 'SET_CUSTOM_COLOR_INPUT', payload: value });
  };

  const handleCustomMascotChange = (value: string) => {
    dispatch({ type: 'SET_CUSTOM_MASCOT_INPUT', payload: value });
  };

  const handleGenerateLogos = async () => {
    if (!state.selectedColors || !state.selectedMascot) {
      return;
    }

    try {
      setIsGenerating(true);
      // Navigate to generating step first
      dispatch({ type: 'SET_CURRENT_STEP', payload: 'generating' });
      // The LogoGeneration component will handle the actual logo generation
    } catch (error) {
      console.error('Error generating logos:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = state.selectedColors && state.selectedMascot;

  // Show error if there's an error and no colors/mascots loaded
  if (state.error && state.colors.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">
            Error Generating Options
          </h2>
          <p className="text-red-600 mb-4">
            {state.error}
          </p>
          <button
            onClick={() => {
              dispatch({ type: 'SET_ERROR', payload: null });
              generateColorsAndMascots();
            }}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (state.isLoading && state.colors.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Analyzing Your Team
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Our AI is creating personalized color and mascot suggestions for <strong>{state.round1Answers.team_name}</strong>
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              What we&apos;re analyzing:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Team name: &ldquo;{state.round1Answers.team_name}&rdquo;</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Sport: {state.round1Answers.sport}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Logo style: {state.round1Answers.logo_style}</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                <span>Color psychology & trends</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 mb-8">
            This usually takes 10-15 seconds...
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border-2 border-purple-200">
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                🤖 AI-Powered Suggestions
              </h3>
              <p className="text-sm text-gray-600">
                We&apos;re using advanced AI to analyze your team name and create the perfect color combinations and mascot concepts that match your team&apos;s personality and sport.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose your team&apos;s style
        </h2>
        <p className="text-lg text-gray-600">
          Select colors and a mascot that best represent your team&apos;s spirit
        </p>
      </div>

      <div className="space-y-12">
        {/* Color Selection */}
        <div>
          <ColorSelection
            colors={state.colors}
            selectedColor={state.selectedColors}
            onColorSelect={handleColorSelect}
            customColorInput={state.customColorInput}
            onCustomColorChange={handleCustomColorChange}
          />
        </div>

        {/* Mascot Selection */}
        <div>
          <MascotSelection
            mascots={state.mascots}
            selectedMascot={state.selectedMascot}
            onMascotSelect={handleMascotSelect}
            customMascotInput={state.customMascotInput}
            onCustomMascotChange={handleCustomMascotChange}
          />
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center pt-8">
        <Button
          onClick={handleGenerateLogos}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors text-lg"
          disabled={!isFormValid || isGenerating}
        >
          {isGenerating ? 'Generating Logos...' : 'Generate Logo'}
        </Button>
      </div>

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 bg-gray-100 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Debug Info:</h3>
          <p>Selected Colors: {state.selectedColors || 'None'}</p>
          <p>Selected Mascot: {state.selectedMascot || 'None'}</p>
          <p>Custom Color Input: {state.customColorInput || 'None'}</p>
          <p>Custom Mascot Input: {state.customMascotInput || 'None'}</p>
        </div>
      )}
    </div>
  );
}
