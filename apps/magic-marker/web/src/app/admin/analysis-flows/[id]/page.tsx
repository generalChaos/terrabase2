'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnalysisFlow } from '@/lib/analysisFlowService'
import { Image } from '@/lib/imageService'
import { ArrowLeft, Calendar, MessageSquare, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle, Hash, Activity, AlertTriangle, Database, Zap, BarChart3, Code } from 'lucide-react'

export default function AnalysisFlowDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [analysisFlow, setAnalysisFlow] = useState<AnalysisFlow | null>(null)
  const [originalImage, setOriginalImage] = useState<Image | null>(null)
  const [finalImage, setFinalImage] = useState<Image | null>(null)
  const [processingSteps, setProcessingSteps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const flowId = params.id as string

  useEffect(() => {
    const fetchAnalysisFlow = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/analysis-flows/${flowId}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch analysis flow')
        }
        
        const data = await response.json()
        setAnalysisFlow(data)
        
        // Set images using the paths from the enhanced API response
        if (data.original_image_id && (data as any).original_image_path) {
          setOriginalImage({
            id: data.original_image_id,
            originalPath: (data as any).original_image_path,
            type: 'original'
          })
        }
        
        if (data.final_image_id && (data as any).final_image_path) {
          setFinalImage({
            id: data.final_image_id,
            originalPath: (data as any).final_image_path,
            type: 'final'
          })
        }
        
        // Fetch processing steps
        try {
          const stepsResponse = await fetch(`/api/admin/steps?flowId=${flowId}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json()
            setProcessingSteps(stepsData.steps || [])
          }
        } catch (err) {
          console.warn('Failed to fetch processing steps:', err)
        }
      } catch (err) {
        console.error('Error fetching analysis flow:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    if (flowId) {
      fetchAnalysisFlow()
    }
  }, [flowId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analysis flow details...</p>
        </div>
      </div>
    )
  }

  if (error || !analysisFlow) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error || 'Analysis flow not found'}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    )
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

  return (
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Analysis Flow Details
                </h1>
                <p className="text-sm text-gray-500">ID: {analysisFlow.id}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysisFlow.isActive)}`}>
                {getStatusIcon(analysisFlow.isActive)}
                <span className="ml-1">{analysisFlow.isActive ? 'Active' : 'Inactive'}</span>
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
                  <p className="mt-1 text-sm text-gray-900 font-mono">{analysisFlow.sessionId}</p>
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
                        src={originalImage.originalPath}
                        alt="Original"
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div>
                        <p className="text-sm text-gray-900 font-mono">{originalImage.id}</p>
                        <p className="text-xs text-gray-500">Type: {originalImage.type}</p>
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
                        src={finalImage.originalPath}
                        alt="Final"
                        className="w-16 h-16 object-cover rounded-lg border"
                      />
                      <div>
                        <p className="text-sm text-gray-900 font-mono">{finalImage.id}</p>
                        <p className="text-xs text-gray-500">Type: {finalImage.type}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No final image generated</p>
                  )}
                </div>
              </div>
            </div>

            {/* Complete Conversation Flow */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Complete Conversation Flow
              </h2>
              
              {/* Summary Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Total Questions</label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{analysisFlow.totalQuestions}</p>
                  <p className="text-xs text-gray-500 mt-1">Initial + Conversational</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Answered</label>
                  <p className="mt-1 text-2xl font-bold text-gray-900">{analysisFlow.totalAnswers}</p>
                  <p className="text-xs text-gray-500 mt-1">Conversational answers</p>
                </div>
              </div>

              {/* Conversation Timeline */}
              <div className="space-y-6">
                {/* Step 1: Image Analysis */}
                <div className="border-l-4 border-blue-500 pl-4">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">1</div>
                    <h3 className="text-lg font-semibold text-gray-900">Image Analysis</h3>
                  </div>
                  <div className="ml-9 space-y-3">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-900 mb-1">Prompt Sent:</p>
                      <p className="text-sm text-blue-800">"Analyze this image and describe what you see, focusing on artistic elements, composition, colors, and mood."</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-900 mb-1">AI Response:</p>
                      <p className="text-sm text-green-800">{analysisFlow.contextData?.imageAnalysis || 'No analysis available'}</p>
                    </div>
                  </div>
                </div>

                {/* Step 2: Questions Generation */}
                <div className="border-l-4 border-purple-500 pl-4">
                  <div className="flex items-center mb-2">
                    <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">2</div>
                    <h3 className="text-lg font-semibold text-gray-900">Questions Generation</h3>
                  </div>
                  <div className="ml-9 space-y-3">
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-purple-900 mb-1">Prompt Sent:</p>
                      <p className="text-sm text-purple-800">"Generate engaging questions to help create a great artistic image based on this analysis."</p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-green-900 mb-1">Questions Generated:</p>
                      <div className="space-y-2">
                        {analysisFlow.questions && analysisFlow.questions.length > 0 ? (
                          analysisFlow.questions.map((question, index) => (
                            <div key={question.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                              <p className="text-sm text-gray-900 font-medium">
                                <span className="font-bold">Q{index + 1}:</span> {question.text}
                              </p>
                              {question.options && question.options.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-700 mb-1">Options:</p>
                                  <ul className="text-xs text-gray-800 space-y-1">
                                    {question.options.map((option, optIndex) => (
                                      <li key={optIndex} className="flex items-start">
                                        <span className="mr-2 text-gray-600">•</span>
                                        <span>{option}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">No questions generated</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 3: Conversational Flow */}
                {analysisFlow.answers && analysisFlow.answers.length > 0 && (
                  <div className="border-l-4 border-orange-500 pl-4">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">3</div>
                      <h3 className="text-lg font-semibold text-gray-900">Conversational Flow</h3>
                    </div>
                    <div className="ml-9 space-y-4">
                      {analysisFlow.answers.map((answer, index) => {
                        const question = analysisFlow.questions?.find(q => q.id === answer.questionId)
                        return (
                          <div key={answer.questionId} className="space-y-2">
                            <div className="bg-orange-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-orange-900 mb-1">Question {index + 1}:</p>
                              <p className="text-sm text-orange-800">{question?.text || 'Question not found'}</p>
                            </div>
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-sm font-medium text-green-900 mb-1">User Answer:</p>
                              <p className="text-sm text-green-800">{answer.answer}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 4: Image Generation */}
                {analysisFlow.final_image_id && (
                  <div className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center mb-2">
                      <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">4</div>
                      <h3 className="text-lg font-semibold text-gray-900">Image Generation</h3>
                    </div>
                    <div className="ml-9 space-y-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-green-900 mb-1">Generation Prompt:</p>
                        <p className="text-sm text-green-800">"Generate an artistic image based on the original image analysis and user preferences from the conversation."</p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm font-medium text-blue-900 mb-1">Final Image Generated:</p>
                        <p className="text-sm text-blue-800">Image ID: {analysisFlow.final_image_id}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Processing Steps Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Processing Steps Timeline
              </h2>
              <div className="space-y-4">
                {processingSteps.length > 0 ? (
                  processingSteps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {step.step_order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 capitalize">
                              {step.step_type.replace('_', ' ')}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {step.response_time_ms && (
                                <span className="text-xs text-gray-500">
                                  {step.response_time_ms}ms
                                </span>
                              )}
                              {step.success ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          {step.model_used && (
                            <p className="text-xs text-gray-500 mt-1">Model: {step.model_used}</p>
                          )}
                          {step.error_message && (
                            <p className="text-xs text-red-600 mt-1">Error: {step.error_message}</p>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No processing steps found</p>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Cost</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(analysisFlow.totalCostUsd || 0).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Hash className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Total Tokens</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(analysisFlow.totalTokens || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Processing Time</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {processingSteps.reduce((total, step) => total + (step.response_time_ms || 0), 0)}ms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Context Data */}
            {analysisFlow.contextData && Object.keys(analysisFlow.contextData).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Context Data</h2>
                <pre className="text-xs text-gray-800 bg-gray-100 p-4 rounded-lg overflow-auto border font-mono">
                  {JSON.stringify(analysisFlow.contextData, null, 2)}
                </pre>
              </div>
            )}

            {/* Processing Steps Timeline */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Processing Steps Timeline
              </h2>
              <div className="space-y-4">
                {processingSteps.length > 0 ? (
                  processingSteps
                    .sort((a, b) => a.step_order - b.step_order)
                    .map((step, index) => (
                      <div key={step.id} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          step.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {step.step_order}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 capitalize">
                              {step.step_type.replace('_', ' ')}
                            </h3>
                            <div className="flex items-center space-x-2">
                              {step.response_time_ms && (
                                <span className="text-xs text-gray-500">
                                  {step.response_time_ms}ms
                                </span>
                              )}
                              {step.success ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </div>
                          {step.model_used && (
                            <p className="text-xs text-gray-500 mt-1">Model: {step.model_used}</p>
                          )}
                          {step.error_message && (
                            <p className="text-xs text-red-600 mt-1">Error: {step.error_message}</p>
                          )}
                          {step.prompt_content && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-gray-700 mb-1">Prompt Content:</p>
                              <div className="text-xs text-gray-800 bg-blue-50 p-2 rounded border">
                                {step.prompt_content}
                              </div>
                            </div>
                          )}
                          {step.input_data && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">Input Data</summary>
                              <pre className="text-xs text-gray-800 bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32 border font-mono">
                                {JSON.stringify(step.input_data, null, 2)}
                              </pre>
                            </details>
                          )}
                          {step.output_data && (
                            <details className="mt-2">
                              <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">Output Data</summary>
                              <pre className="text-xs text-gray-800 bg-gray-100 p-2 rounded mt-1 overflow-auto max-h-32 border font-mono">
                                {JSON.stringify(step.output_data, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <p className="text-gray-500 text-sm">No processing steps found</p>
                )}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="w-5 h-5 mr-2" />
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-900">Total Cost</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${(analysisFlow.totalCostUsd || 0).toFixed(4)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Hash className="w-5 h-5 text-green-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-green-900">Total Tokens</p>
                      <p className="text-2xl font-bold text-green-600">
                        {(analysisFlow.totalTokens || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-purple-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-purple-900">Processing Time</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {processingSteps.reduce((total, step) => total + (step.response_time_ms || 0), 0)}ms
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Summary */}
            {processingSteps.some(step => !step.success) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Error Summary
                </h2>
                <div className="space-y-2">
                  {processingSteps
                    .filter(step => !step.success)
                    .map((step, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-800 capitalize">
                          {step.step_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-red-600 mt-1">{step.error_message}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Raw Flow Data */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Raw Flow Data
              </h2>
              <pre className="text-xs text-gray-800 bg-gray-100 p-4 rounded-lg overflow-auto max-h-96 border font-mono">
                {JSON.stringify(analysisFlow, null, 2)}
              </pre>
            </div>
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
                    {(analysisFlow.totalTokens || 0).toLocaleString()}
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
                  {analysisFlow.totalAnswers > 0 ? (
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
                  {analysisFlow.currentStep === 'completed' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>

            {/* Error Summary */}
            {processingSteps.some(step => !step.success) && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-red-500" />
                  Error Summary
                </h3>
                <div className="space-y-2">
                  {processingSteps
                    .filter(step => !step.success)
                    .map((step, index) => (
                      <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-sm font-medium text-red-800 capitalize">
                          {step.step_type.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-red-600 mt-1">{step.error_message}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/result?id=${analysisFlow.original_image_id}`)}
                  className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  View Result Page
                </button>
                <button
                  onClick={() => router.push('/admin/analysis-flows')}
                  className="w-full px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Back to List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
