import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { ImageAnalysis } from '@/lib/types'

interface ProcessingStep {
  id: string
  image_id: string
  step_type: 'analysis' | 'questions' | 'conversational_question' | 'image_generation'
  step_order: number
  prompt_id?: string
  prompt_content?: string
  input_data: unknown
  output_data: unknown
  response_time_ms: number
  tokens_used?: number
  model_used: string
  success: boolean
  error_message?: string
  created_at: string
}

interface EnhancedImageModalProps {
  image: ImageAnalysis
  isOpen: boolean
  onClose: () => void
}

const EnhancedImageModal: React.FC<EnhancedImageModalProps> = ({ image, isOpen, onClose }) => {
  const [steps, setSteps] = useState<ProcessingStep[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'pipeline' | 'details'>('overview')

  useEffect(() => {
    if (isOpen && image.id) {
      loadProcessingSteps()
    }
  }, [isOpen, image.id])

  const loadProcessingSteps = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/steps?image_id=${image.id}`)
      const data = await response.json()
      
      if (response.ok) {
        setSteps(data.steps || [])
      }
    } catch (error) {
      console.error('Error loading processing steps:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const getStepIcon = (stepType: string) => {
    const icons = {
      'analysis': '🔍',
      'questions': '❓',
      'conversational_question': '💬',
      'image_generation': '🎨'
    }
    return icons[stepType as keyof typeof icons] || '⚙️'
  }

  const getStepTitle = (stepType: string) => {
    const titles = {
      'analysis': 'Image Analysis',
      'questions': 'Questions Generation',
      'conversational_question': 'Conversational Question',
      'image_generation': 'Image Generation'
    }
    return titles[stepType as keyof typeof titles] || stepType
  }

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const formatTokens = (tokens?: number) => {
    if (!tokens) return 'N/A'
    return tokens.toLocaleString()
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Pipeline Details</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'pipeline', label: 'Pipeline Steps', icon: '⚙️' },
            { id: 'details', label: 'Raw Data', icon: '🔧' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'pipeline' | 'details')}
              className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-white/70 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Images Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Original Image */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Original Image</h3>
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <Image
                      src={image.originalImagePath}
                      alt="Original"
                      width={400}
                      height={400}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  </div>
                </div>

                {/* Generated Image */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Generated Image</h3>
                  <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {image.finalImagePath ? (
                      <Image
                        src={image.finalImagePath}
                        alt="Generated"
                        width={400}
                        height={400}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🎨</div>
                          <p>No generated image yet</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Analysis Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">AI Analysis</h3>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  <p className="text-white/90 leading-relaxed">{image.analysisResult}</p>
                </div>
              </div>

              {/* Questions and Answers Section */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Questions & Answers</h3>
                <div className="bg-white/10 rounded-lg p-4 border border-white/20">
                  {image.answers ? (
                    <div className="space-y-4">
                      {image.questions.map((question, index) => {
                        const answer = image.answers?.find(a => a.questionId === question.id);
                        return (
                          <div key={question.id} className="border-b border-white/20 pb-4 last:border-b-0">
                            <h4 className="text-white font-medium mb-2">Q{index + 1}: {question.text}</h4>
                            <div className="ml-4">
                              <p className="text-white/80 text-sm mb-2">Options:</p>
                              <div className="grid grid-cols-1 gap-1 mb-2">
                                {question.options.map((option, optIndex) => (
                                  <div 
                                    key={optIndex}
                                    className={`text-sm p-2 rounded ${
                                      answer?.answer === option
                                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                        : 'text-white/60'
                                    }`}
                                  >
                                    {option}
                                  </div>
                                ))}
                              </div>
                              <p className="text-white/90 text-sm">
                                <span className="font-medium">Selected:</span> {answer?.answer || 'No answer'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">❓</div>
                      <p className="text-white/60">No answers recorded yet</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'pipeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Pipeline Execution Steps</h3>
                {loading && <div className="text-white/60 text-sm">Loading steps...</div>}
              </div>

              {steps.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⚙️</div>
                  <p className="text-white/60">No processing steps recorded</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {steps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step) => (
                      <div key={step.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                              {step.step_order}
                            </div>
                            <div>
                              <h4 className="text-white font-medium flex items-center space-x-2">
                                <span>{getStepIcon(step.step_type)}</span>
                                <span>{getStepTitle(step.step_type)}</span>
                              </h4>
                              <p className="text-white/60 text-sm">
                                {new Date(step.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 text-sm">
                            <div className={`px-2 py-1 rounded ${
                              step.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                            }`}>
                              {step.success ? '✓ Success' : '✗ Failed'}
                            </div>
                            <div className="text-white/60">
                              {formatResponseTime(step.response_time_ms)}
                            </div>
                          </div>
                        </div>

                        {/* Step Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <h5 className="text-white/80 font-medium mb-2">Input Data</h5>
                            <div className="bg-black/20 rounded p-3 text-xs font-mono text-white/70 max-h-32 overflow-y-auto">
                              <pre>{JSON.stringify(step.input_data, null, 2)}</pre>
                            </div>
                          </div>
                          <div>
                            <h5 className="text-white/80 font-medium mb-2">Output Data</h5>
                            <div className="bg-black/20 rounded p-3 text-xs font-mono text-white/70 max-h-32 overflow-y-auto">
                              <pre>{JSON.stringify(step.output_data, null, 2)}</pre>
                            </div>
                          </div>
                        </div>

                        {/* Technical Details */}
                        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-white/60">Model:</span>
                            <span className="text-white ml-1">{step.model_used}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Tokens:</span>
                            <span className="text-white ml-1">{formatTokens(step.tokens_used)}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Response Time:</span>
                            <span className="text-white ml-1">{formatResponseTime(step.response_time_ms)}</span>
                          </div>
                          <div>
                            <span className="text-white/60">Step Order:</span>
                            <span className="text-white ml-1">{step.step_order}</span>
                          </div>
                        </div>

                        {step.error_message && (
                          <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded">
                            <p className="text-red-300 text-sm">
                              <span className="font-medium">Error:</span> {step.error_message}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white">Raw Data</h3>
              
              <div>
                <h4 className="text-white/80 font-medium mb-2">Image Data</h4>
                <div className="bg-black/20 rounded p-4 text-xs font-mono text-white/70 max-h-64 overflow-y-auto">
                  <pre>{JSON.stringify(image, null, 2)}</pre>
                </div>
              </div>

              {steps.length > 0 && (
                <div>
                  <h4 className="text-white/80 font-medium mb-2">Processing Steps Data</h4>
                  <div className="bg-black/20 rounded p-4 text-xs font-mono text-white/70 max-h-64 overflow-y-auto">
                    <pre>{JSON.stringify(steps, null, 2)}</pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedImageModal
