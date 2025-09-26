'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface FlowData {
  id: string;
  team_name: string;
  sport: string;
  age_group: string;
  current_step: string;
  logo_variants: Array<{
    id: string;
    variant_number: number;
    public_url: string;
    is_selected: boolean;
    generation_prompt: string;
    model_used: string;
    generation_time_ms: number;
    generation_cost_usd: number;
  }>;
  selected_logo_id: string | null;
  created_at: string;
  updated_at: string;
}

export default function ResultsPage() {
  const params = useParams();
  const flowId = params.flowId as string;
  
  const [flowData, setFlowData] = useState<FlowData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFlowData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/flows/${flowId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Flow not found. Please check the URL and try again.');
        } else {
          setError('Failed to load flow data. Please try again later.');
        }
        return;
      }

      const result = await response.json();
      setFlowData(result.data);
    } catch (err) {
      setError('Failed to load flow data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [flowId]);

  useEffect(() => {
    if (flowId) {
      loadFlowData();
    }
  }, [flowId, loadFlowData]);

  const handleDownload = async (logo: any) => {
    if (!logo.public_url) {
      console.error('No download URL available');
      return;
    }

    try {
      const response = await fetch(logo.public_url);
      if (!response.ok) {
        throw new Error('Failed to fetch image');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${flowData?.team_name}-logo-variant-${logo.variant_number}.png`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleSelectLogo = async (logoId: string) => {
    try {
      const response = await fetch('/api/logos/select', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow_id: flowId,
          logo_id: logoId
        })
      });

      if (response.ok) {
        // Reload the data to show updated selection
        await loadFlowData();
      } else {
        console.error('Failed to select logo');
      }
    } catch (error) {
      console.error('Error selecting logo:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your logo results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Start New Design
          </Button>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-gray-500 text-4xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">No Data Found</h1>
          <p className="text-gray-600 mb-6">Unable to load flow data.</p>
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md"
          >
            Start New Design
          </Button>
        </div>
      </div>
    );
  }

  const selectedLogo = flowData.logo_variants.find(logo => logo.is_selected);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Your Team Logo Results
          </h1>
          <p className="text-xl text-gray-600">
            {flowData.team_name} • {flowData.sport} • {flowData.age_group}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Generated on {new Date(flowData.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Selected Logo Preview */}
        {selectedLogo && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Selected Logo</h2>
            <div className="flex items-center justify-center space-x-8">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center p-4">
                <Image
                  src={selectedLogo.public_url}
                  alt="Selected logo"
                  width={120}
                  height={120}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {flowData.team_name} Logo
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Variant {selectedLogo.variant_number} • {selectedLogo.model_used}
                </p>
                <Button
                  onClick={() => handleDownload(selectedLogo)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
                >
                  Download Selected Logo
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* All Logo Variants */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">All Logo Variants</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flowData.logo_variants.map((logo) => (
              <div 
                key={logo.id} 
                className={`relative border-2 rounded-lg p-4 transition-all duration-200 ${
                  logo.is_selected 
                    ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Selection Badge */}
                {logo.is_selected && (
                  <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                    SELECTED
                  </div>
                )}
                
                {/* Logo Image */}
                <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center p-4 mb-4">
                  <Image
                    src={logo.public_url}
                    alt={`Logo variant ${logo.variant_number}`}
                    width={200}
                    height={200}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                {/* Logo Info */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium text-gray-900">
                      Variant {logo.variant_number}
                    </h3>
                    {logo.is_selected && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        Selected
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Model:</span>
                      <span className="font-mono">{logo.model_used}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span>{logo.generation_time_ms}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost:</span>
                      <span>${logo.generation_cost_usd?.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {!logo.is_selected && (
                      <Button
                        onClick={() => handleSelectLogo(logo.id)}
                        className="w-full py-2 px-4 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                      >
                        Select This Logo
                      </Button>
                    )}
                    
                    <Button
                      onClick={() => handleDownload(logo)}
                      className="w-full py-2 px-4 rounded-lg font-medium bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
                    >
                      Download
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="text-center mt-8">
          <Button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg mr-4"
          >
            Create Another Logo
          </Button>
          <Button
            onClick={() => window.location.href = '/admin'}
            className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-6 rounded-lg"
          >
            Admin Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
