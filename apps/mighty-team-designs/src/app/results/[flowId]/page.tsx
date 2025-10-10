'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import StandaloneLogoResults from '@/components/StandaloneLogoResults';

interface FlowData {
  id: string;
  team_name: string;
  sport: string;
  logo_style: string;
  current_step: string;
  player_roster?: Array<{
    id: string;
    firstName: string;
    number: string;
  }>;
  logo_variants: Array<{
    id: string;
    variant_number: number;
    public_url: string;
    is_selected: boolean;
    generation_prompt: string;
    model_used: string;
    generation_time_ms: number;
    generation_cost_usd: number;
    asset_pack?: {
      id: string;
      clean_logo_url: string;
      tshirt_front_url: string;
      tshirt_back_url: string;
      banner_url?: string;
      processing_time_ms: number;
    } | null;
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
      console.log('📊 Flow data received:', result.data);
      console.log('📊 Player roster:', result.data?.player_roster);
      console.log('📊 Logo variants:', result.data?.logo_variants);
      if (result.data?.logo_variants) {
        result.data.logo_variants.forEach((logo: any, index: number) => {
          console.log(`📊 Logo ${index + 1}:`, {
            id: logo.id,
            variant_number: logo.variant_number,
            public_url: logo.public_url,
            asset_pack: logo.asset_pack
          });
        });
      }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!flowData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Data</h1>
          <p className="text-gray-600 mb-4">No flow data found.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <StandaloneLogoResults flowData={flowData} />;
}