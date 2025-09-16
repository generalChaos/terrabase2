'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { AnalysisFlow, Question, QuestionAnswer } from '@/lib/types'
import { Image, ImageType, ImageService } from '@/lib/imageService'
import { ProcessingStep } from '@/lib/newTypes'
import { PromptDefinition } from '@/lib/promptTypes'
import { ArrowLeft, Calendar, MessageSquare, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle, Hash, Activity, AlertTriangle, Database, Zap, BarChart3, Code } from 'lucide-react'

// Simple type assertion - we control the data so we can safely assert the type
function assertProcessingStep(step: unknown): ProcessingStep {
  if (!step || typeof step !== 'object') {
    throw new Error('Invalid processing step data')
  }
  return step as ProcessingStep
}

export default function AnalysisFlowDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [analysisFlow, setAnalysisFlow] = useState<AnalysisFlow | null>(null)
  const [originalImage, setOriginalImage] = useState<Image | null>(null)
  const [finalImage, setFinalImage] = useState<Image | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [promptDefinitions, setPromptDefinitions] = useState<Record<string, PromptDefinition>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const flowId = params.id as string

  const fetchPromptDefinitions = async () => {
    try {
      const response = await fetch('/api/admin/prompt-definitions')
      if (response.ok) {
        const data = await response.json()
        const promptsMap: Record<string, PromptDefinition> = {}
        data.prompts.forEach((prompt: PromptDefinition) => {
          promptsMap[prompt.name] = prompt
        })
        setPromptDefinitions(promptsMap)
      }
    } catch (error) {
      console.warn('Failed to fetch prompt definitions:', error)
    }
  }

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
        if (data.original_image_id && (data as AnalysisFlow & { original_image_path?: string }).original_image_path) {
          setOriginalImage({
            id: data.original_image_id,
            file_path: (data as AnalysisFlow & { original_image_path?: string }).original_image_path!,
            image_type: 'original' as ImageType,
            analysis_result: '',
            created_at: '',
            updated_at: ''
          })
        }
        
        if (data.final_image_id && (data as AnalysisFlow & { final_image_path?: string }).final_image_path) {
          setFinalImage({
            id: data.final_image_id,
            file_path: (data as AnalysisFlow & { final_image_path?: string }).final_image_path!,
            image_type: 'final' as ImageType,
            analysis_result: '',
            created_at: '',
            updated_at: ''
          })
        }
        
        // Fetch processing steps
        try {
          const stepsResponse = await fetch(`/api/admin/steps?flowId=${flowId}`)
          if (stepsResponse.ok) {
            const stepsData = await stepsResponse.json() as { steps: ProcessingStep[] }
            console.log('🔍 [AnalysisFlowDetail] Fetched processing steps:', {
              flowId,
              stepsCount: stepsData.steps?.length || 0,
              steps: stepsData.steps
            });
            // Ensure we have properly typed steps - we control the data so we can safely assert
            const steps: ProcessingStep[] = (stepsData.steps || [])
              .map(step => assertProcessingStep(step))
            setProcessingSteps(steps)
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
      fetchPromptDefinitions()
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
                      <NextImage
                        src={originalImage.file_path.startsWith('http') ? originalImage.file_path : ImageService.getImageUrl(originalImage.file_path)}
                        alt="Original"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg border"
                        unoptimized
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
                      <NextImage
                        src={finalImage.file_path.startsWith('http') ? finalImage.file_path : ImageService.getImageUrl(finalImage.file_path)}
                        alt="Final"
                        width={64}
                        height={64}
                        className="w-16 h-16 object-cover rounded-lg border"
                        unoptimized
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
                {processingSteps
                  .sort((a, b) => (a.step_order || 0) - (b.step_order || 0))
                  .map((step, index) => {
                  const stepColors = {
                    'analysis': 'blue',
                    'questions': 'purple', 
                    'image_generation': 'green'
                  }
                  const color = stepColors[step.step_type as keyof typeof stepColors] || 'gray'
                  const colorClasses: Record<string, string> = {
                    blue: 'border-blue-500 bg-blue-500',
                    purple: 'border-purple-500 bg-purple-500',
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
                          {step.response_time_ms && (
                            <span className="text-xs text-gray-500">{step.response_time_ms}ms</span>
                          )}
                          {step.success ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                      
                      <div className="ml-9 space-y-3">
                        {/* For analysis step, show database prompt */}
                        {step.step_type === 'analysis' ? (
                          <>
                            {/* Database Prompt for Analysis */}
                            <div className="bg-blue-50 p-3 rounded-lg mb-3">
                              <p className="text-sm font-medium text-blue-900 mb-1">Database Prompt:</p>
                              <div className="text-sm text-blue-800 bg-white p-2 rounded border">
                                {promptDefinitions['image_analysis']?.prompt_text || step.prompt_content || 'Loading prompt from database...'}
                              </div>
                            </div>
                            
                            {/* AI Response for Analysis */}
                            {step.output_data && (
                              <div className="bg-green-50 p-3 rounded-lg">
                                <p className="text-sm font-medium text-green-900 mb-1">AI Response:</p>
                                <div className="text-sm text-green-800">
                                  {(() => {
                                    if (typeof step.output_data === 'string') {
                                      return step.output_data
                                    }
                                    const data = step.output_data as Record<string, unknown>
                                    if (data.analysis) return String(data.analysis)
                                    return JSON.stringify(step.output_data, null, 2)
                                  })()}
                                </div>
                              </div>
                            )}
                          </>
                        ) : step.step_type === 'image_generation' ? (
                          <>
                            {/* 1. Context Used (Image Analysis + Artistic Direction) */}
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                              <p className="text-sm font-medium text-purple-900 mb-2">Context Used:</p>
                              <div className="bg-white p-3 rounded border border-purple-200">
                                <div className="text-sm text-purple-800 space-y-3">
                                  <div>
                                    <p className="font-medium mb-1">Image Analysis:</p>
                                    <p className="text-xs text-gray-600 font-mono leading-relaxed">
                                      {String(analysisFlow.context_data?.imageAnalysis || 'No analysis available')}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium mb-1">Artistic Direction:</p>
                                    <p className="text-xs text-gray-600 font-mono leading-relaxed">
                                      {String(analysisFlow.context_data?.artisticDirection || 'No artistic direction available')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Database Prompt (Comprehensive) */}
                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-900 mb-2">Database Prompt (Comprehensive):</p>
                              <div className="bg-white p-3 rounded border border-blue-200">
                                <p className="text-sm text-blue-800 font-mono leading-relaxed">
                                  {promptDefinitions['image_generation']?.prompt_text || 'Loading prompt from database...'}
                                </p>
                              </div>
                            </div>

                            {/* 3. Generated DALL-E Prompt */}
                            {step.output_data && typeof step.output_data === 'object' && 'dall_e_prompt' in step.output_data ? (
                              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                <p className="text-sm font-medium text-orange-900 mb-2">Generated DALL-E Prompt:</p>
                                <div className="bg-white p-3 rounded border border-orange-200">
                                  <p className="text-sm text-orange-800 font-mono leading-relaxed">
                                    {String((step.output_data as Record<string, unknown>).dall_e_prompt)}
                                  </p>
                                </div>
                              </div>
                            ) : null}
                          </>
                        ) : (
                          /* For other steps, show the original logic */
                          <>
                            {(step.prompt_content && typeof step.prompt_content === 'string' && (step.step_type as string) !== 'image_generation' && (step.step_type as string) !== 'questions') ? (
                              <div className={`bg-${color}-50 p-3 rounded-lg`}>
                                <p className={`text-sm font-medium text-${color}-900 mb-1`}>Initial Prompt:</p>
                                <div className={`text-sm text-${color}-800 bg-white p-2 rounded border`}>
                                  {step.prompt_content as string}
                                </div>
                              </div>
                            ) : null}
                            
                            {step.output_data && (step.step_type as string) !== 'image_generation' && (step.step_type as string) !== 'questions' ? (
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
                                      return data.questions.map((q: unknown, i: number) => {
                                        if (typeof q === 'string') return `${i + 1}. ${q}`
                                        if (typeof q === 'object' && q && 'text' in q) return `${i + 1}. ${(q as { text: string }).text}`
                                        if (typeof q === 'object' && q && 'question' in q) return `${i + 1}. ${(q as { question: string }).question}`
                                        return `${i + 1}. ${String(q)}`
                                      }).join('\n')
                                    }
                                    if (data.answer) return String(data.answer)
                                    if (data.prompt) return String(data.prompt)
                                    
                                    // Fallback to JSON for complex structures
                                    return JSON.stringify(step.output_data, null, 2)
                                  })()}
                                </div>
                              </div>
                            ) : null}
                          </>
                        )}

                        {/* Questions Generated (for questions_generation step) - only show once */}
                        {step.step_type === 'questions' && analysisFlow.questions && analysisFlow.questions.length > 0 && index === processingSteps.findIndex(s => s.step_type === 'questions') && (
                          <>
                            {/* Show the prompt for questions step */}
                            <div className="bg-purple-50 p-3 rounded-lg mb-3">
                              <p className="text-sm font-medium text-purple-900 mb-1">Database Prompt:</p>
                              <div className="text-sm text-purple-800 bg-white p-2 rounded border">
                                {promptDefinitions['questions_generation']?.prompt_text || step.prompt_content || 'Loading prompt from database...'}
                              </div>
                            </div>
                            
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
                          </>
                        )}
                        
                        {/* Error Message */}
                        {step.error_message && (
                          <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-800 mb-1">Error:</p>
                            <p className="text-sm text-red-700">{step.error_message}</p>
                          </div>
                        )}
                        
                        {/* Collapsible Technical Details */}
                        <details className="bg-gray-50 rounded-lg">
                          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                            Technical Details (Click to expand)
                          </summary>
                          <div className="px-3 pb-3 space-y-3">
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
                
                <div className="flex justify-center">
                  <div className="max-w-2xl w-full">
                    <NextImage
                      src={finalImage.file_path}
                      alt="Final generated image"
                      width={800}
                      height={600}
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

            {/* Context Data */}
            {analysisFlow.context_data && Object.keys(analysisFlow.context_data).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Context Data</h2>
                <pre className="text-xs text-gray-800 bg-gray-100 p-4 rounded-lg overflow-auto border font-mono">
                  {JSON.stringify(analysisFlow.context_data, null, 2)}
                </pre>
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
                  <span className="text-sm text-gray-600">Questions Flow</span>
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
