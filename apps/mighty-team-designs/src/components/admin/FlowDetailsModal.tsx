'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface FlowDetails {
  id: string;
  user_session_id: string;
  team_name: string;
  sport: string;
  age_group: string;
  current_step: string;
  debug_mode: boolean;
  is_active: boolean;
  round1_answers: Record<string, any>;
  round2_questions: Question[];
  round2_answers: QuestionAnswer[];
  logo_prompt?: string;
  logo_variants: LogoVariant[];
  selected_logo_id?: string;
  logo_generated_at?: string;
  contact_email?: string;
  contact_phone?: string;
  player_roster?: Array<{id: string, firstName: string, number: string}>;
  team_logos?: TeamLogo[];
  created_at: string;
  updated_at: string;
}

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'text';
  options?: string[];
  selected: number | string;
  required: boolean;
}

interface QuestionAnswer {
  question_id: string;
  answer: string;
}

interface LogoVariant {
  id: string;
  variant_number: number;
  is_selected: boolean;
  file_path: string;
  generation_prompt: string;
  model_used: string;
  generation_time_ms: number;
  generation_cost_usd: number;
  created_at: string;
  public_url?: string;
  asset_pack?: AssetPack | null;
}

interface TeamLogo {
  id: string;
  flow_id: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  storage_bucket: string;
  variant_number: number;
  is_selected: boolean;
  generation_prompt: string;
  model_used: string;
  generation_time_ms: number;
  generation_cost_usd: number;
  created_at: string;
  updated_at: string;
  public_url?: string;
  asset_pack?: AssetPack | null;
}

interface AssetPack {
  id: string;
  flow_id: string;
  logo_id: string;
  asset_pack_id: string;
  clean_logo_url: string;
  tshirt_front_url: string;
  tshirt_back_url: string;
  banner_url?: string;
  processing_time_ms: number;
  created_at: string;
  updated_at: string;
  colors?: {
    colors: string[];
    frequencies: number[];
    percentages: number[];
    total_pixels_analyzed: number;
    roles?: {
      background: { hex: string; percent: number };
      surface: { hex: string; percent: number };
      primary: { hex: string; percent: number };
      accent: { hex: string; percent: number };
    };
    confidence_scores?: {
      background: number;
      surface: number;
      primary: number;
      accent: number;
    };
    assignment_reasons?: {
      background: string;
      surface: string;
      primary: string;
      accent: string;
    };
  };
}

interface FlowDetailsModalProps {
  flowId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface UpscaleResult {
  success: boolean;
  original_url: string;
  upscaled_url: string;
  scale_factor: number;
  processing_time_ms: number;
  file_size_bytes: number;
  error?: string;
}

export function FlowDetailsModal({ flowId, isOpen, onClose }: FlowDetailsModalProps) {
  const [flowDetails, setFlowDetails] = useState<FlowDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [regeneratingAssets, setRegeneratingAssets] = useState(false);
  const [regeneratingColors, setRegeneratingColors] = useState(false);
  const [upscaling, setUpscaling] = useState<string | null>(null);
  const [upscaleResult, setUpscaleResult] = useState<UpscaleResult | null>(null);
  const [upscaleSettings, setUpscaleSettings] = useState({
    scale_factor: 4,
    output_format: 'png',
    quality: 95
  });

  const loadFlowDetails = useCallback(async () => {
    if (!flowId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/flows/${flowId}`);
      if (!response.ok) {
        throw new Error('Failed to load flow details');
      }

      const result = await response.json();
      console.log('🔍 FlowDetailsModal: Raw flow data received:', result.data);
      console.log('🔍 FlowDetailsModal: round2_questions:', result.data.round2_questions);
      console.log('🔍 FlowDetailsModal: round2_answers:', result.data.round2_answers);
      setFlowDetails(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load flow details');
    } finally {
      setLoading(false);
    }
  }, [flowId]);

  useEffect(() => {
    if (isOpen && flowId) {
      loadFlowDetails();
    }
  }, [isOpen, flowId, loadFlowDetails]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStepColor = (step: string) => {
    switch (step) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'generating':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRegenerateAssets = async () => {
    if (!flowDetails || !flowDetails.selected_logo_id) {
      setError('No selected logo found for asset generation');
      return;
    }

    try {
      setRegeneratingAssets(true);
      setError(null);

      // Find the selected logo
      const selectedLogo = (flowDetails.team_logos || flowDetails.logo_variants || []).find(
        (logo: LogoVariant | TeamLogo) => logo.is_selected
      );

      if (!selectedLogo || !selectedLogo.public_url) {
        setError('Selected logo not found or has no public URL');
        return;
      }

      // Call the asset pack generation API
      const response = await fetch('/api/asset-packs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          flow_id: flowDetails.id,
          logo_url: selectedLogo.public_url,
          team_name: flowDetails.team_name,
          players: flowDetails.player_roster || [
            { number: 1, name: "Captain" },
            { number: 2, name: "Vice Captain" },
            { number: 3, name: "Starter" },
            { number: 4, name: "Starter" },
            { number: 5, name: "Starter" }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate assets');
      }

      const result = await response.json();
      console.log('✅ Assets regenerated successfully:', result);

      // Reload flow details to get updated asset pack data
      await loadFlowDetails();

    } catch (err) {
      console.error('❌ Error regenerating assets:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate assets');
    } finally {
      setRegeneratingAssets(false);
    }
  };

  const handleRegenerateColors = async () => {
    if (!flowDetails) {
      setError('No flow details found');
      return;
    }

    try {
      setRegeneratingColors(true);
      setError(null);

      // Call the regenerate colors API
      const response = await fetch(`/api/flows/${flowDetails.id}/regenerate-colors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to regenerate colors');
      }

      const result = await response.json();
      console.log('✅ Colors regenerated successfully:', result);

      // Reload flow details to get updated color data
      await loadFlowDetails();

    } catch (err) {
      console.error('❌ Error regenerating colors:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate colors');
    } finally {
      setRegeneratingColors(false);
    }
  };

  const handleUpscale = async (logo: LogoVariant | TeamLogo) => {
    if (!logo.public_url) {
      setError('Logo has no public URL');
      return;
    }

    setUpscaling(logo.id);
    setUpscaleResult(null);

    try {
      const response = await fetch('/api/admin/upscale', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: logo.public_url,
          scale_factor: upscaleSettings.scale_factor,
          output_format: upscaleSettings.output_format,
          quality: upscaleSettings.quality
        })
      });

      const result = await response.json();

      if (result.success) {
        setUpscaleResult(result.data);
      } else {
        console.error('Upscaling failed:', result.error);
        setUpscaleResult({
          success: false,
          original_url: logo.public_url,
          upscaled_url: '',
          scale_factor: upscaleSettings.scale_factor,
          processing_time_ms: 0,
          file_size_bytes: 0,
          error: result.error
        });
      }
    } catch (error) {
      console.error('Error upscaling image:', error);
      setUpscaleResult({
        success: false,
        original_url: logo.public_url,
        upscaled_url: '',
        scale_factor: upscaleSettings.scale_factor,
        processing_time_ms: 0,
        file_size_bytes: 0,
        error: 'Network error'
      });
    } finally {
      setUpscaling(null);
    }
  };

  const downloadUpscaledImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const downloadAssetPackItem = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading asset pack item:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              Flow Details
              {flowDetails && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {flowDetails.team_name}
                </span>
              )}
            </h2>
            <Button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading flow details...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                  <div className="mt-4">
                    <Button
                      onClick={loadFlowDetails}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm py-1 px-3 rounded"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {flowDetails && (
            <div className="space-y-6">
              {/* Flow Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">Flow Overview</h3>
                  <div className="flex space-x-2">
                              <a
                                href={`/results/${flowDetails.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                              >
                                View Results Page
                              </a>
                            </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Team Name:</span>
                    <p className="text-lg font-semibold text-gray-900">{flowDetails.team_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sport:</span>
                    <p className="text-lg font-semibold text-gray-900">{flowDetails.sport}</p>
                          </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Status:</span>
                    <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStepColor(flowDetails.current_step)}`}>
                      {flowDetails.current_step}
                    </span>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Flow Details</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Flow ID:</span>
                      <span className="ml-2 text-xs text-gray-600 font-mono">{flowDetails.id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Session ID:</span>
                      <span className="ml-2 text-xs text-gray-600 font-mono">{flowDetails.user_session_id}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Debug Mode:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {flowDetails.debug_mode ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Active:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {flowDetails.is_active ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Timestamps</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Created:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {formatDate(flowDetails.created_at)}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Updated:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {formatDate(flowDetails.updated_at)}
                      </span>
                    </div>
                    {flowDetails.logo_generated_at && (
                    <div>
                        <span className="text-sm font-medium text-gray-500">Logo Generated:</span>
                        <span className="ml-2 text-sm text-gray-900">
                          {formatDate(flowDetails.logo_generated_at)}
                      </span>
                    </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Round 1 Answers */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Round 1 Answers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(flowDetails.round1_answers || {}).map(([key, value]) => (
                    <div key={key}>
                      <span className="text-sm font-medium text-gray-500 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <p className="text-sm text-gray-900">{String(value) || 'N/A'}</p>
                  </div>
                  ))}
                </div>
              </div>

              {/* Round 2 Questions & Answers */}
              {flowDetails.round2_questions && flowDetails.round2_questions.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Round 2 Questions & Answers ({flowDetails.round2_questions.length} questions)
                  </h3>
                  
                  {/* Debug info for round2_answers */}
                  <div className="mb-4 p-3 bg-yellow-100 rounded text-sm">
                    <p><strong>Debug - Round 2 Answers Structure:</strong></p>
                    <p>Questions count: {flowDetails.round2_questions?.length || 0}</p>
                    <p>Answers count: {flowDetails.round2_answers?.length || 0}</p>
                    <p>Answers type: {Array.isArray(flowDetails.round2_answers) ? 'Array' : typeof flowDetails.round2_answers}</p>
                    <p>Answers exists: {flowDetails.round2_answers ? 'Yes' : 'No'}</p>
                    <p>Answers null/undefined: {flowDetails.round2_answers === null ? 'Null' : flowDetails.round2_answers === undefined ? 'Undefined' : 'Neither'}</p>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View raw answers data</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(flowDetails.round2_answers, null, 2)}
                      </pre>
                    </details>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View raw questions data</summary>
                      <pre className="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(flowDetails.round2_questions, null, 2)}
                      </pre>
                    </details>
                  </div>
                  
                  <div className="space-y-4">
                    {flowDetails.round2_questions.map((question: Question, index: number) => {
                      // Try to find answer in different possible structures
                      let answer = null;
                      let answerText = '';
                      
                      if (Array.isArray(flowDetails.round2_answers)) {
                        // Look for QuestionAnswer structure
                        const questionAnswer = flowDetails.round2_answers.find((a: any) => a.question_id === question.id);
                        if (questionAnswer) {
                          answer = questionAnswer;
                          answerText = questionAnswer.answer;
                        } else {
                          // Check if round2_answers contains Question objects with selected field
                          const questionWithAnswer = flowDetails.round2_answers.find((q: any) => q.id === question.id);
                          if (questionWithAnswer && (questionWithAnswer as any).selected !== undefined) {
                            answer = questionWithAnswer;
                            if ((questionWithAnswer as any).type === 'text') {
                              answerText = (questionWithAnswer as any).selected as string;
                            } else if ((questionWithAnswer as any).type === 'multiple_choice' && (questionWithAnswer as any).options) {
                              const selectedIndex = (questionWithAnswer as any).selected as number;
                              answerText = (questionWithAnswer as any).options[selectedIndex] || '';
                            }
                          }
                        }
                      }
                      
                      return (
                        <div key={question.id} className="border border-green-200 rounded-md p-4 bg-white">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Q{index + 1}: {question.text}
                            </h4>
                            <div className="flex space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                question.type === 'multiple_choice' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-green-100 text-green-800'
                              }`}>
                                {question.type.replace('_', ' ')}
                              </span>
                              {question.required && (
                                <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800">
                                  Required
                            </span>
                              )}
                            </div>
                          </div>
                          
                          {question.options && question.options.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-500 mb-1">Options:</p>
                              <div className="flex flex-wrap gap-1">
                                {question.options.map((option, optIndex) => (
                                  <span 
                                    key={optIndex}
                                    className={`text-xs px-2 py-1 rounded ${
                                      question.selected === optIndex 
                                        ? 'bg-green-200 text-green-800 font-medium' 
                                        : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {option}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {answer && answerText ? (
                            <div className="bg-green-100 p-3 rounded">
                              <p className="text-xs font-medium text-gray-500 mb-1">Answer:</p>
                              <p className="text-sm text-green-800 font-medium">
                                {answerText}
                              </p>
                            </div>
                          ) : (
                            <div className="bg-gray-100 p-3 rounded">
                              <p className="text-xs font-medium text-gray-500 mb-1">Answer:</p>
                              <p className="text-sm text-gray-600 italic">
                                No answer provided
                              </p>
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {(flowDetails.contact_email || flowDetails.contact_phone) && (
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {flowDetails.contact_email && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Email:</span>
                        <p className="text-sm text-gray-900">{flowDetails.contact_email}</p>
                      </div>
                    )}
                    {flowDetails.contact_phone && (
                      <div>
                        <span className="text-sm font-medium text-gray-500">Phone:</span>
                        <p className="text-sm text-gray-900">{flowDetails.contact_phone}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Player Roster */}
              {flowDetails.player_roster && flowDetails.player_roster.length > 0 && (
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Player Roster ({flowDetails.player_roster.length} players)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {flowDetails.player_roster.map((player, index) => (
                      <div key={player.id} className="bg-white p-3 rounded border border-orange-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                            {player.number}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{player.firstName}</p>
                            <p className="text-xs text-gray-500">#{player.number}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Logo Prompt */}
              {flowDetails.logo_prompt && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Logo Generation Prompt</h3>
                  <div className="bg-white p-3 rounded border border-yellow-200">
                    <p className="text-sm text-gray-700">{flowDetails.logo_prompt}</p>
                  </div>
                </div>
              )}

              {/* Generated Logos */}
              {(flowDetails.team_logos && flowDetails.team_logos.length > 0) || (flowDetails.logo_variants && flowDetails.logo_variants.length > 0) ? (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    Generated Logos ({flowDetails.team_logos?.length || flowDetails.logo_variants?.length || 0} variants)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(flowDetails.team_logos || flowDetails.logo_variants || []).map((logo: LogoVariant | TeamLogo, index: number) => (
                      <div 
                        key={logo.id} 
                        className={`relative border-2 rounded-lg p-4 transition-all duration-200 ${
                          logo.is_selected 
                            ? 'border-purple-500 bg-purple-100 shadow-lg ring-2 ring-purple-200' 
                            : 'border-purple-200 bg-white hover:border-purple-300 hover:shadow-md'
                        }`}
                      >
                        {/* Selection Badge */}
                        {logo.is_selected && (
                          <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                            SELECTED
                          </div>
                        )}
                        
                        {/* Logo Image */}
                        <div className="relative mb-4">
                          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center p-4">
                            {logo.public_url ? (
                              <Image
                                src={logo.public_url}
                                alt={`Logo variant ${logo.variant_number}`}
                                width={200}
                                height={200}
                                className="max-w-full max-h-full object-contain"
                                unoptimized
                              />
                            ) : (
                              <div className="text-gray-400 text-center">
                                <div className="text-4xl mb-2">🖼️</div>
                                <div className="text-sm">No image available</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Logo Info */}
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-gray-900">
                              Variant {logo.variant_number}
                            </h4>
                            {logo.is_selected && (
                              <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full">
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
                            {(logo as any).file_size && (
                              <div className="flex justify-between">
                                <span>Size:</span>
                                <span>{((logo as any).file_size / 1024).toFixed(1)}KB</span>
                              </div>
                            )}
                          </div>

                          {logo.public_url && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                              <a
                                href={logo.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline text-xs"
                              >
                                View Full Size →
                              </a>
                            </div>
                          )}

                          {/* Asset Pack Info */}
                          {logo.asset_pack && (
                            <div className="mt-3 pt-2 border-t border-gray-200">
                              <p className="text-xs font-medium text-gray-500 mb-1">Asset Pack:</p>
                              <div className="space-y-1 text-xs text-gray-600">
                                <div className="flex justify-between">
                                  <span>Processing:</span>
                                  <span>{logo.asset_pack?.processing_time_ms || 0}ms</span>
                                </div>
                                {logo.asset_pack?.clean_logo_url && (
                                  <a
                                    href={logo.asset_pack?.clean_logo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline block"
                                  >
                                    Clean Logo →
                                  </a>
                                )}
                                {logo.asset_pack?.tshirt_front_url && (
                                  <a
                                    href={logo.asset_pack?.tshirt_front_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline block"
                                  >
                                    T-Shirt Front →
                                  </a>
                                )}
                                {logo.asset_pack?.banner_url && (
                                  <a
                                    href={logo.asset_pack?.banner_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:text-blue-800 underline block"
                                  >
                                    Banner →
                                  </a>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <div className="text-4xl mb-2">🎨</div>
                  <p className="text-gray-500">No logos generated yet</p>
                </div>
              )}

              {/* Asset Pack Section */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border-2 border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Asset Pack</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={handleRegenerateColors}
                      disabled={regeneratingColors}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        regeneratingColors
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {regeneratingColors ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Regenerating Colors...</span>
                        </div>
                      ) : (
                        'Regenerate Colors'
                      )}
                    </button>
                    <button
                      onClick={handleRegenerateAssets}
                      disabled={regeneratingAssets || !flowDetails.selected_logo_id}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                        regeneratingAssets || !flowDetails.selected_logo_id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                    >
                      {regeneratingAssets ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Regenerating...</span>
                        </div>
                      ) : (
                        'Regenerate Assets'
                      )}
                    </button>
                  </div>
                </div>

                {/* Check if any logos have asset packs */}
                {(() => {
                  const logosWithAssets = (flowDetails.team_logos || flowDetails.logo_variants || []).filter(
                    (logo: LogoVariant | TeamLogo) => logo.asset_pack
                  );

                  if (logosWithAssets.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="text-4xl mb-2">📦</div>
                        <p className="text-gray-500 mb-2">No asset packs generated yet</p>
                        <p className="text-sm text-gray-400">
                          {flowDetails.selected_logo_id 
                            ? 'Click "Regenerate Assets" to create asset pack' 
                            : 'Select a logo first to generate assets'
                          }
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      {logosWithAssets.map((logo: LogoVariant | TeamLogo) => (
                        <div key={logo.id} className="bg-white p-4 rounded-lg border border-orange-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-gray-900">
                              Asset Pack for Variant {logo.variant_number}
                            </h4>
                            {logo.is_selected && (
                              <span className="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">
                                Selected Logo
                              </span>
                            )}
                          </div>

                          {logo.asset_pack && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {/* Clean Logo */}
                              {logo.asset_pack?.clean_logo_url && (
                                <div className="text-center">
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center p-2">
                                    <Image
                                      src={logo.asset_pack?.clean_logo_url}
                                      alt="Clean Logo"
                                      width={100}
                                      height={100}
                                      className="max-w-full max-h-full object-contain"
                                      unoptimized
                                    />
                                  </div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">Clean Logo</p>
                                  <div className="flex space-x-2">
                                    <a
                                      href={logo.asset_pack?.clean_logo_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    >
                                      View →
                                    </a>
                                    <button
                                      onClick={() => downloadAssetPackItem(
                                        logo.asset_pack?.clean_logo_url || '',
                                        `${flowDetails.team_name}-clean-logo.png`
                                      )}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                      disabled={!logo.asset_pack?.clean_logo_url}
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* T-Shirt Front */}
                              {logo.asset_pack?.tshirt_front_url && (
                                <div className="text-center">
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center p-2">
                                    <Image
                                      src={logo.asset_pack?.tshirt_front_url}
                                      alt="T-Shirt Front"
                                      width={100}
                                      height={100}
                                      className="max-w-full max-h-full object-contain"
                                      unoptimized
                                    />
                                  </div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">T-Shirt Front</p>
                                  <div className="flex space-x-2">
                                    <a
                                      href={logo.asset_pack?.tshirt_front_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    >
                                      View →
                                    </a>
                                    <button
                                      onClick={() => downloadAssetPackItem(
                                        logo.asset_pack?.tshirt_front_url || '',
                                        `${flowDetails.team_name}-tshirt-front.png`
                                      )}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* T-Shirt Back */}
                              {logo.asset_pack?.tshirt_back_url && (
                                <div className="text-center">
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center p-2">
                                    <Image
                                      src={logo.asset_pack?.tshirt_back_url}
                                      alt="T-Shirt Back"
                                      width={100}
                                      height={100}
                                      className="max-w-full max-h-full object-contain"
                                      unoptimized
                                    />
                                  </div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">T-Shirt Back</p>
                                  <div className="flex space-x-2">
                                    <a
                                      href={logo.asset_pack?.tshirt_back_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    >
                                      View →
                                    </a>
                                    <button
                                      onClick={() => downloadAssetPackItem(
                                        logo.asset_pack?.tshirt_back_url || '',
                                        `${flowDetails.team_name}-tshirt-back.png`
                                      )}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Banner */}
                              {logo.asset_pack?.banner_url && (
                                <div className="text-center">
                                  <div className="aspect-square bg-gray-100 rounded-lg mb-2 flex items-center justify-center p-2">
                                    <Image
                                      src={logo.asset_pack?.banner_url}
                                      alt="Banner"
                                      width={100}
                                      height={100}
                                      className="max-w-full max-h-full object-contain"
                                      unoptimized
                                    />
                                  </div>
                                  <p className="text-xs font-medium text-gray-700 mb-1">Banner</p>
                                  <div className="flex space-x-2">
                                    <a
                                      href={logo.asset_pack?.banner_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:text-blue-800 underline text-xs"
                                    >
                                      View →
                                    </a>
                                    <button
                                      onClick={() => downloadAssetPackItem(
                                        logo.asset_pack?.banner_url || '',
                                        `${flowDetails.team_name}-banner.png`
                                      )}
                                      className="text-green-600 hover:text-green-800 text-xs"
                                    >
                                      Download
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Color Analysis */}
                          {logo.asset_pack?.colors && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <h5 className="text-sm font-medium text-gray-900 mb-3">Color Analysis</h5>
                              
                              {/* Role-based Colors */}
                              {logo.asset_pack?.colors?.roles && (
                                <div className="mb-4">
                                  <h6 className="text-xs font-medium text-gray-700 mb-2">Color Roles</h6>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {Object.entries(logo.asset_pack?.colors?.roles || {}).map(([role, colorData]) => (
                                      <div key={role} className="bg-gray-50 p-2 rounded border">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <div 
                                            className="w-4 h-4 rounded border border-gray-300"
                                            style={{ backgroundColor: colorData.hex }}
                                          ></div>
                                          <span className="text-xs font-medium capitalize">{role}</span>
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          <div>{colorData.hex}</div>
                                          <div>{colorData.percent.toFixed(1)}%</div>
                                        </div>
                                        {logo.asset_pack?.colors?.confidence_scores && (
                                          <div className="text-xs text-gray-500 mt-1">
                                            Confidence: {Math.round(((logo.asset_pack?.colors?.confidence_scores as any)?.[role] || 0) * 100)}%
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                  
                                  {/* Assignment Reasons */}
                                  {logo.asset_pack?.colors?.assignment_reasons && (
                                    <div className="mt-3">
                                      <h6 className="text-xs font-medium text-gray-700 mb-2">Assignment Reasons</h6>
                                      <div className="space-y-1">
                                        {Object.entries(logo.asset_pack?.colors?.assignment_reasons || {}).map(([role, reason]) => (
                                          <div key={role} className="text-xs text-gray-600">
                                            <span className="font-medium capitalize">{role}:</span> {reason}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Raw Color Data */}
                              <div className="mb-4">
                                <h6 className="text-xs font-medium text-gray-700 mb-2">Raw Color Data</h6>
                                <div className="flex flex-wrap gap-1 mb-2">
                                  {logo.asset_pack?.colors?.colors?.slice(0, 8).map((color, index) => (
                                    <div
                                      key={index}
                                      className="w-6 h-6 rounded border border-gray-300"
                                      style={{ backgroundColor: color }}
                                      title={`${color} (${logo.asset_pack?.colors?.percentages?.[index]?.toFixed(1) || 0}%)`}
                                    ></div>
                                  ))}
                                  {(logo.asset_pack?.colors?.colors?.length || 0) > 8 && (
                                    <div className="w-6 h-6 rounded border border-gray-300 bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                                      +{(logo.asset_pack?.colors?.colors?.length || 0) - 8}
                                    </div>
                                  )}
                                </div>
                                <div className="text-xs text-gray-600">
                                  Total colors: {logo.asset_pack?.colors?.colors?.length || 0} | 
                                  Pixels analyzed: {(logo.asset_pack?.colors?.total_pixels_analyzed || 0).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Asset Pack Metadata */}
                          {logo.asset_pack && (
                            <div className="mt-4 pt-3 border-t border-gray-200">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium">Processing Time:</span>
                                  <p>{logo.asset_pack?.processing_time_ms || 0}ms</p>
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span>
                                  <p>{formatDate(logo.asset_pack?.created_at || '')}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Asset Pack ID:</span>
                                  <p className="font-mono text-xs">{logo.asset_pack?.asset_pack_id || 'N/A'}</p>
                                </div>
                                <div>
                                  <span className="font-medium">Logo ID:</span>
                                  <p className="font-mono text-xs">{logo.asset_pack?.logo_id || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              {/* Upscaling Tool */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border-2 border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Logo Upscaling Tool</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setUpscaleResult(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      Clear Results
                    </button>
                  </div>
                </div>

                {/* Upscaling Settings */}
                <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Upscaling Settings</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Scale Factor
                      </label>
                      <select
                        value={upscaleSettings.scale_factor}
                        onChange={(e) => setUpscaleSettings(prev => ({ ...prev, scale_factor: Number(e.target.value) }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value={2}>2x</option>
                        <option value={4}>4x</option>
                        <option value={8}>8x</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Output Format
                      </label>
                      <select
                        value={upscaleSettings.output_format}
                        onChange={(e) => setUpscaleSettings(prev => ({ ...prev, output_format: e.target.value }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        <option value="png">PNG</option>
                        <option value="jpg">JPG</option>
                        <option value="webp">WebP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quality: {upscaleSettings.quality}%
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={upscaleSettings.quality}
                        onChange={(e) => setUpscaleSettings(prev => ({ ...prev, quality: Number(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Upscaling Results */}
                {upscaleResult && (
                  <div className="bg-white p-4 rounded-lg border border-purple-200 mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Upscaling Results</h4>
                    {upscaleResult.success ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Original</h5>
                            <div className="border rounded-lg p-2 bg-gray-50">
                              <Image
                                src={upscaleResult.original_url}
                                alt="Original logo"
                                width={150}
                                height={150}
                                className="mx-auto object-contain"
                              />
                            </div>
                          </div>
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 mb-2">Upscaled ({upscaleResult.scale_factor}x)</h5>
                            <div className="border rounded-lg p-2 bg-gray-50">
                              <Image
                                src={upscaleResult.upscaled_url}
                                alt="Upscaled logo"
                                width={150 * upscaleResult.scale_factor}
                                height={150 * upscaleResult.scale_factor}
                                className="mx-auto object-contain"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs font-medium text-green-800">Upscaling completed successfully!</p>
                              <p className="text-xs text-green-600">
                                Processing time: {upscaleResult.processing_time_ms}ms | 
                                File size: {Math.round(upscaleResult.file_size_bytes / 1024)}KB
                              </p>
                            </div>
                            <button
                              onClick={() => downloadUpscaledImage(
                                upscaleResult.upscaled_url,
                                `upscaled-logo-${upscaleResult.scale_factor}x.${upscaleSettings.output_format}`
                              )}
                              className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-xs font-medium text-red-800">Upscaling failed</p>
                        <p className="text-xs text-red-600">{upscaleResult.error}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Logo Selection for Upscaling */}
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Select Logo to Upscale</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {(flowDetails.team_logos || flowDetails.logo_variants || []).map((logo: LogoVariant | TeamLogo) => (
                      <div
                        key={logo.id}
                        className="border border-gray-200 rounded-lg p-2 hover:border-purple-300 transition-colors cursor-pointer"
                        onClick={() => handleUpscale(logo)}
                      >
                        <div className="aspect-square bg-gray-100 rounded mb-2 flex items-center justify-center p-1">
                          {logo.public_url ? (
                            <Image
                              src={logo.public_url}
                              alt={`Logo variant ${logo.variant_number}`}
                              width={80}
                              height={80}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <div className="text-gray-400 text-xs">No image</div>
                          )}
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-gray-900">Variant {logo.variant_number}</p>
                          <button
                            disabled={upscaling === logo.id}
                            className={`text-xs px-2 py-1 rounded mt-1 ${
                              upscaling === logo.id
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {upscaling === logo.id ? 'Upscaling...' : `Upscale ${upscaleSettings.scale_factor}x`}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Debug Information */}
              {flowDetails.debug_mode && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Debug Information</h3>
                  <div className="text-sm text-gray-600">
                    This flow was created in debug mode. Additional logging and monitoring
                    information may be available in the debug logs.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <Button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-md"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
