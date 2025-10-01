'use client';

import React from 'react';
import { useQuestionnaire } from '@/contexts/QuestionnaireContext';
import { Button } from '@/components/ui/Button';
import { LogoCard } from './LogoCard';

export function LogoSelection() {
  const { state, selectLogo, reset } = useQuestionnaire();

  const handleLogoSelect = async (logoId: string) => {
    try {
      await selectLogo(logoId);
    } catch (error) {
      console.error('Error selecting logo:', error);
    }
  };

  const handleStartOver = () => {
    reset();
  };

  const handleDownload = async (logoId: string) => {
    const logo = state.logoVariants.find(l => l.id === logoId);
    if (!logo?.public_url) {
      console.error('No download URL available for logo:', logoId);
      return;
    }

    try {
      // Fetch the image
      const response = await fetch(logo.public_url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${state.round1Answers.team_name}-logo-variant-${logo.variant_number}.png`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // You could add a toast notification here
    }
  };

  if (state.logoVariants.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          No Logos Generated
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          There was an issue generating your logos. Please try again.
        </p>
        <Button
          onClick={handleStartOver}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          Start Over
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Choose Your Logo
        </h2>
        <p className="text-lg text-gray-600">
          Select your favorite design for <strong>{state.round1Answers.team_name}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {state.logoVariants.map((logo, index) => (
          <LogoCard
            key={logo.id}
            logo={logo}
            isSelected={logo.id === state.selectedLogoId}
            onSelect={() => handleLogoSelect(logo.id)}
            onDownload={() => handleDownload(logo.id)}
            variantNumber={index + 1}
          />
        ))}
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          onClick={handleStartOver}
          className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        >
          Start Over
        </Button>

        {state.selectedLogoId && (
          <div className="flex space-x-4">
            <Button
              onClick={() => handleDownload(state.selectedLogoId!)}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Download Selected Logo
            </Button>
            <Button
              onClick={() => window.location.href = `/results/${state.flow?.id}`}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              View Results Page
            </Button>
            <Button
              onClick={() => console.log('Share logo:', state.selectedLogoId)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Share Logo
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
