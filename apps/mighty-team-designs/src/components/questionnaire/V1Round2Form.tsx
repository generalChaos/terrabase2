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
    if (state.flow && state.colors.length === 0 && state.mascots.length === 0 && !hasGenerated) {
      generateColorsAndMascots();
      setHasGenerated(true);
    }
  }, [state.flow, state.colors.length, state.mascots.length, hasGenerated, generateColorsAndMascots]);

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
      await generateLogos();
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
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Analyzing mascot and colors...
          </h2>
          <p className="text-gray-600">
            Creating personalized suggestions for your {state.round1Answers.sport} team
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose your team's style
        </h2>
        <p className="text-lg text-gray-600">
          Select colors and a mascot that best represent your team's spirit
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
