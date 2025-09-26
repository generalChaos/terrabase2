'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface FlowDetails {
  id: string;
  team_name: string;
  sport: string;
  age_group: string;
  current_step: string;
  debug_mode: boolean;
  round1_answers: {
    team_name: string;
    sport: string;
    age_group: string;
  };
  round2_questions: any[];
  round2_answers: any[];
  logo_variants: any[];
  selected_logo_id: string | null;
  created_at: string;
  updated_at: string;
}

interface FlowDetailsModalProps {
  flowId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FlowDetailsModal({ flowId, isOpen, onClose }: FlowDetailsModalProps) {
  const [flowDetails, setFlowDetails] = useState<FlowDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              {/* Selected Logo Preview */}
              {flowDetails.logo_variants && flowDetails.logo_variants.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border-2 border-purple-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Selected Logo</h3>
                  <div className="flex items-center space-x-6">
                    {(() => {
                      const selectedLogo = flowDetails.logo_variants.find((logo: any) => logo.is_selected);
                      if (selectedLogo && selectedLogo.public_url) {
                        return (
                          <>
                            <div className="flex-shrink-0">
                              <div className="w-24 h-24 bg-white rounded-lg shadow-md flex items-center justify-center p-2">
                                <Image
                                  src={selectedLogo.public_url}
                                  alt="Selected logo"
                                  width={80}
                                  height={80}
                                  className="max-w-full max-h-full object-contain"
                                  unoptimized
                                />
                              </div>
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-gray-900">
                                {flowDetails.team_name} Logo
                              </h4>
                              <p className="text-sm text-gray-600 mb-2">
                                Variant {selectedLogo.variant_number} • {selectedLogo.model_used}
                              </p>
                              <div className="flex space-x-4 text-xs text-gray-500">
                                <span>Generated in {selectedLogo.generation_time_ms}ms</span>
                                <span>Cost: ${selectedLogo.generation_cost_usd?.toFixed(4)}</span>
                              </div>
                            </div>
                            <div className="flex-shrink-0">
                              <a
                                href={selectedLogo.public_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
                              >
                                View Full Size
                              </a>
                            </div>
                          </>
                        );
                      } else {
                        return (
                          <div className="text-center text-gray-500 py-8">
                            <div className="text-4xl mb-2">🎨</div>
                            <p>No logo selected yet</p>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Basic Information</h3>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-500">Team Name:</span>
                      <span className="ml-2 text-sm text-gray-900">{flowDetails.team_name}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Sport:</span>
                      <span className="ml-2 text-sm text-gray-900">{flowDetails.sport}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Age Group:</span>
                      <span className="ml-2 text-sm text-gray-900">{flowDetails.age_group}</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Status:</span>
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStepColor(flowDetails.current_step)}`}>
                        {flowDetails.current_step}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Debug Mode:</span>
                      <span className="ml-2 text-sm text-gray-900">
                        {flowDetails.debug_mode ? 'Yes' : 'No'}
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
                    <div>
                      <span className="text-sm font-medium text-gray-500">Flow ID:</span>
                      <span className="ml-2 text-xs text-gray-600 font-mono">
                        {flowDetails.id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Round 1 Answers */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Round 1 Answers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500">Team Name:</span>
                    <p className="text-sm text-gray-900">{flowDetails.round1_answers?.team_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Sport:</span>
                    <p className="text-sm text-gray-900">{flowDetails.round1_answers?.sport || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500">Age Group:</span>
                    <p className="text-sm text-gray-900">{flowDetails.round1_answers?.age_group || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Round 2 Questions & Answers */}
              {flowDetails.round2_questions && flowDetails.round2_questions.length > 0 && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Round 2 Questions & Answers</h3>
                  <div className="space-y-4">
                    {flowDetails.round2_questions.map((question: any, index: number) => {
                      const answer = flowDetails.round2_answers?.find((a: any) => a.question_id === question.id);
                      return (
                        <div key={question.id} className="border border-green-200 rounded-md p-3">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-900">
                              Q{index + 1}: {question.text}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {question.type}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <div className="text-sm text-gray-600">
                              Options: {question.options?.join(', ')}
                            </div>
                            {answer && (
                              <div className="text-sm text-green-700 font-medium">
                                Answer: {answer.answer || 'No answer provided'}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Logo Variants */}
              {flowDetails.logo_variants && flowDetails.logo_variants.length > 0 && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Generated Logos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flowDetails.logo_variants.map((logo: any, index: number) => (
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
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
