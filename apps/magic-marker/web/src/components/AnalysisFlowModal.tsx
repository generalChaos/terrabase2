'use client'

import { useState, useEffect } from 'react'
import { AnalysisFlow, Question, QuestionAnswer } from '@/lib/analysisFlowService'
import { Image, ImageType } from '@/lib/imageService'
import { ProcessingStep } from '@/lib/newTypes'
import { X, Calendar, MessageSquare, Image as ImageIcon, CheckCircle, XCircle, Clock, FileText, Activity, AlertTriangle, Database, Zap, BarChart3, Code, Hash } from 'lucide-react'

interface AnalysisFlowModalProps {
  analysisFlow: AnalysisFlow | null
  isOpen: boolean
  onClose: () => void
}

export default function AnalysisFlowModal({ analysisFlow, isOpen, onClose }: AnalysisFlowModalProps) {
  const [originalImage, setOriginalImage] = useState<Image | null>(null)
  const [finalImage, setFinalImage] = useState<Image | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (analysisFlow && isOpen) {
      console.log('🔍 [AnalysisFlowModal] Received analysis flow data:', {
        id: analysisFlow.id,
        total_questions: analysisFlow.total_questions,
        total_answers: analysisFlow.total_answers,
        total_tokens: analysisFlow.total_tokens,
        questions_count: analysisFlow.questions?.length || 0,
        answers_count: analysisFlow.answers?.length || 0
      });
      fetchImages()
      fetchProcessingSteps()
    }
  }, [analysisFlow, isOpen])

  const fetchImages = async () => {
    if (!analysisFlow) return

    setLoading(true)
    try {
      // Set images using the paths from the enhanced API response
      if (analysisFlow.original_image_id && (analysisFlow as AnalysisFlow & { original_image_path?: string }).original_image_path) {
        setOriginalImage({
          id: analysisFlow.original_image_id,
          file_path: (analysisFlow as AnalysisFlow & { original_image_path?: string }).original_image_path!,
          image_type: 'original' as ImageType,
          analysis_result: '',
          created_at: '',
          updated_at: ''
        })
      }

      if (analysisFlow.final_image_id && (analysisFlow as AnalysisFlow & { final_image_path?: string }).final_image_path) {
        setFinalImage({
          id: analysisFlow.final_image_id,
          file_path: (analysisFlow as AnalysisFlow & { final_image_path?: string }).final_image_path!,
          image_type: 'final' as ImageType,
          analysis_result: '',
          created_at: '',
          updated_at: ''
        })
      }
    } catch (error) {
      console.error('Error setting images:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProcessingSteps = async () => {
    if (!analysisFlow) return

    try {
      const stepsResponse = await fetch(`/api/admin/steps?flowId=${analysisFlow.id}`)
      if (stepsResponse.ok) {
        const stepsData = await stepsResponse.json() as { steps: ProcessingStep[] }
        console.log('🔍 [AnalysisFlowModal] Fetched processing steps:', {
          flowId: analysisFlow.id,
          stepsCount: stepsData.steps?.length || 0,
          steps: stepsData.steps
        });
        setProcessingSteps(stepsData.steps || [])
      }
    } catch (err) {
      console.warn('Failed to fetch processing steps:', err)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleString()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
  }

  if (!isOpen || !analysisFlow) return null

  console.log('🔍 [AnalysisFlowModal] Rendering modal with data:', {
    total_questions: analysisFlow.total_questions,
    total_answers: analysisFlow.total_answers,
    total_tokens: analysisFlow.total_tokens
  });

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto h-screen">
          {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Analysis Flow Details
                </h1>
                <p className="text-sm text-gray-500">ID: {analysisFlow.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysisFlow.is_active)}`}>
                {getStatusIcon(analysisFlow.is_active)}
                <span className="ml-1">{analysisFlow.is_active ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8 min-h-full">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Basic Information */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Flow ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{analysisFlow.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Session ID</label>
                  <p className="mt-1 text-sm text-gray-900 font-mono">{analysisFlow.session_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(analysisFlow.created_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {new Date(analysisFlow.created_at).toISOString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(analysisFlow.updated_at)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    {new Date(analysisFlow.updated_at).toISOString()}
                  </p>
                </div>
            </div>
          </div>

              {/* Images */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <ImageIcon className="w-5 h-5 mr-2" />
                  Images
              </h2>
              <div className="space-y-4">
                  {/* Original Image */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Original Image</label>
                  {originalImage ? (
                      <div className="mt-2 flex items-center space-x-3">
                        <img
                        src={originalImage.file_path}
                          alt="Original"
                        className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <div>
                        <p className="text-sm text-gray-900 font-mono">{originalImage.id}</p>
                        <p className="text-xs text-gray-500">Type: {originalImage.image_type}</p>
                      </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No original image</p>
                    )}
                  </div>

                  {/* Final Image */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Final Image</label>
                  {finalImage ? (
                      <div className="mt-2 flex items-center space-x-3">
                        <img
                        src={finalImage.file_path}
                          alt="Final"
                        className="w-16 h-16 object-cover rounded-lg border"
                        />
                        <div>
                        <p className="text-sm text-gray-900 font-mono">{finalImage.id}</p>
                        <p className="text-xs text-gray-500">Type: {finalImage.image_type}</p>
                      </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No final image generated</p>
                    )}
                  </div>
                </div>
              </div>



            {/* Processing Steps Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Processing Steps Timeline
              </h2>

              <div className="space-y-6">
                {processingSteps.filter((step, index) => {
                  // Filter out duplicate conversational steps - only show the first one
                  if (step.step_type === 'conversational_question') {
                    return index === processingSteps.findIndex(s => s.step_type === 'conversational_question')
                  }
                  return true
                }).map((step, index) => {
                  const stepColors = {
                    'analysis': 'blue',
                    'questions': 'purple', 
                    'conversational_question': 'orange',
                    'image_generation': 'green'
                  }
                  const color = stepColors[step.step_type as keyof typeof stepColors] || 'gray'
                  const colorClasses: Record<string, string> = {
                    blue: 'border-blue-500 bg-blue-500',
                    purple: 'border-purple-500 bg-purple-500',
                    orange: 'border-orange-500 bg-orange-500',
                    green: 'border-green-500 bg-green-500',
                    gray: 'border-gray-500 bg-gray-500'
                  }
                  
                  return (
                    <div key={step.id} className={`border-l-4 border-${color}-500 pl-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-6 h-6 ${colorClasses[color]} text-white rounded-full flex items-center justify-center text-xs font-bold mr-3`}>
                            {index + 1}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">
                            {step.step_type.replace('_', ' ')}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          {step.response_time_ms ? (
                            <span className="text-xs text-gray-500">{step.response_time_ms}ms</span>
                          ) : null}
                          {step.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-9 space-y-3">

                        {step.prompt_content && typeof step.prompt_content === 'string' ? (
                          <div className={`bg-${color}-50 p-3 rounded-lg`}>
                            <p className={`text-sm font-medium text-${color}-900 mb-1`}>Initial Prompt:</p>
                            <div className={`text-sm text-${color}-800 bg-white p-2 rounded border`}>
                              {step.prompt_content}
                            </div>
                          </div>
                        ) : null}
                        
                        {step?.output_data ? (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-1">AI Response:</p>
                            <div className="text-sm text-green-800">
                              {(() => {
                                // Try to extract human-readable content from the response
                                if (typeof step.output_data === 'string') {
                                  return step.output_data
                                }
                                
                                // For structured responses, try to find the most relevant text
                                const data = step.output_data as Record<string, unknown>
                                if (data.analysis) return String(data.analysis)
                                if (data.description) return String(data.description)
                                if (data.response) return String(data.response)
                                if (data.questions && Array.isArray(data.questions)) {
                                  return data.questions.map((q: unknown, i: number) => 
                                    `${i + 1}. ${typeof q === 'string' ? q : (typeof q === 'object' && q !== null ? ((q as Record<string, unknown>).text || (q as Record<string, unknown>).question || String(q)) : String(q))}`
                                  ).join('\n')
                                }
                                if (data.answer) return String(data.answer)
                                if (data.prompt) return String(data.prompt)
                                
                                // Fallback to JSON for complex structures
                                return JSON.stringify(step.output_data, null, 2)
                              })()}
                            </div>
                          </div>
                        ) : null }
                        
                        {/* Questions Generated (for questions_generation step) */}
                        {step.step_type === 'questions' && analysisFlow.questions && analysisFlow.questions.length > 0 && (
                          <div className="bg-purple-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-purple-900 mb-3">Questions Generated with Answers:</p>
                            <div className="space-y-4">
                              {analysisFlow.questions.map((question: Question, qIndex: number) => {
                                const answer = analysisFlow.answers?.find((a: QuestionAnswer) => a.questionId === question.id)
                                return (
                                  <div key={question.id} className="bg-white p-3 rounded border border-purple-200">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                      Q{qIndex + 1}: {question.text}
                                    </p>
                                    {question.options && question.options.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {question.options.map((option: string, optIndex: number) => {
                                          const isSelected = answer && option === answer.answer
                                          return (
                                            <span
                                              key={optIndex}
                                              className={`px-3 py-1 text-xs rounded-full border ${
                                                isSelected
                                                  ? 'bg-green-100 text-green-800 border-green-300 font-medium'
                                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                                              }`}
                                            >
                                              {option}
                                            </span>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Conversational Questions & Answers - Show all Q&A for conversational steps (only once) */}
                        {(step.step_type === 'conversational_question') && analysisFlow.answers && analysisFlow.answers.length > 0 && index === processingSteps.findIndex(s => s.step_type === 'conversational_question') && (
                          <div className="bg-orange-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-orange-900 mb-3">All Conversational Q&A:</p>
                            <div className="space-y-4">
                              {analysisFlow.answers.map((answer: QuestionAnswer, aIndex: number) => {
                                const question = analysisFlow.questions?.find((q: Question) => q.id === answer.questionId)
                                if (!question) return null
                                
                                return (
                                  <div key={answer.questionId} className="bg-white p-3 rounded border border-orange-200">
                                    <p className="text-sm font-medium text-gray-900 mb-2">
                                      Q{aIndex + 1}: {question.text}
                                    </p>
                                    {question.options && question.options.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {question.options.map((option: string, optIndex: number) => {
                                          const isSelected = option === answer.answer
                                          return (
                                            <span
                                              key={optIndex}
                                              className={`px-3 py-1 text-xs rounded-full border ${
                                                isSelected
                                                  ? 'bg-green-100 text-green-800 border-green-300 font-medium'
                                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                                              }`}
                                            >
                                              {option}
                                            </span>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                        
                        {/* Image Generation Prompt (for image_generation step) */}
                        {step.step_type === 'image_generation' && step.prompt_content && typeof step.prompt_content === 'string' ? (
                          <div className="bg-green-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-green-900 mb-3">Image Generation Prompt:</p>
                            <div className="bg-white p-3 rounded border border-green-200">
                              <p className="text-sm text-green-800 font-mono">{step.prompt_content}</p>
                            </div>
                          </div>
                        ) : null}
                        
                        {/* Error Message */}
                        {step.error_message ? (
                          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                            <p className="text-sm text-red-700">{step.error_message}</p>
                          </div>
                        ) : null}
                        
                        {/* Collapsible Technical Details */}
                        <details className="bg-gray-50 rounded-lg">
                          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                            Technical Details (Click to expand)
                          </summary>
                          <div className="px-3 pb-3 space-y-3">
                            {/* Input Data */}
                            {step.input_data ? (
                              <div>
                                <h4 className="text-xs font-medium text-gray-600 mb-1">Input Data:</h4>
                                <pre className="text-xs text-gray-800 bg-white p-2 rounded border font-mono overflow-auto max-h-32">
                                  {JSON.stringify(step.input_data, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                            
                            {/* Full Output Data */}
                            {step.output_data ? (
                              <div>
                                <h4 className="text-xs font-medium text-gray-600 mb-1">Full AI Response (JSON):</h4>
                                <pre className="text-xs text-gray-800 bg-white p-2 rounded border font-mono overflow-auto max-h-32">
                                  {JSON.stringify(step.output_data, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                            
                            {/* Model Info */}
                            <div className="text-xs text-gray-600">
                              <span className="font-medium">Model:</span> {step.model_used || 'Unknown'} • 
                              <span className="font-medium ml-2">Response Time:</span> {step.response_time_ms || 0}ms
                            </div>
                          </div>
                        </details>
                      </div>
                    </div>
                  )
                })}
                
                {processingSteps.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No processing steps found</p>
                  </div>
                )}
              </div>
            </div>

            {/* Final Generated Image - Big Display */}
            {finalImage && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <ImageIcon className="w-5 h-5 mr-2" />
                  Final Generated Image
                </h2>
                
                {/* Image Generation Prompt */}
                {(() => {
                  const imageGenStep = processingSteps.find(step => step.step_type === 'image_generation' && step.prompt_content)
                  return imageGenStep ? (
                    <div className="mb-6">
                      <h3 className="text-md font-medium text-gray-900 mb-3">Generation Prompt:</h3>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 font-mono leading-relaxed">
                          {imageGenStep.prompt_content}
                        </p>
                      </div>
                    </div>
                  ) : null
                })()}
                
                <div className="flex justify-center">
                  <div className="max-w-2xl w-full">
                    <img
                      src={finalImage.file_path}
                      alt="Final generated image"
                      className="w-full h-auto rounded-lg shadow-lg border border-gray-200"
                    />
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600">
                        Generated from analysis flow: {analysisFlow.id}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {finalImage.file_path}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            </div>

          {/* Sidebar */}
          <div className="xl:col-span-1 space-y-6">
            {/* Token Usage */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Hash className="w-5 h-5 mr-2" />
                Token Usage
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Tokens</label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">
                    {(analysisFlow.total_tokens || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Flow Status */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Database className="w-5 h-5 mr-2" />
                Flow Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Image Analysis</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Questions Generation</span>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Conversational Flow</span>
                  {analysisFlow.total_answers > 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                    </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Image Generation</span>
                  {analysisFlow.final_image_id ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                    </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Flow Complete</span>
                  {analysisFlow.current_step === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
          </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
            <button
              onClick={() => {
                window.open(`/result?id=${analysisFlow.original_image_id}`, '_blank')
              }}
                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              View Result Page
            </button>
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Close Modal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
