'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { ImageAnalysis, QuestionAnswer } from '@/lib/types'
import ImageUpload from '@/components/ImageUpload'
import QuestionFlow from '@/components/QuestionFlow'
import LoadingSpinner from '@/components/LoadingSpinner'
import DebugPanel from '@/components/DebugPanel'
import AnimatedHomepage from '@/components/AnimatedHomepage'

const API_BASE = '/api'

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'homepage' | 'upload' | 'questions' | 'conversational' | 'generating'>('homepage')
  const [currentImageAnalysis, setCurrentImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const queryClient = useQueryClient()

  const addError = (error: string) => {
    setErrors(prev => [...prev, `${new Date().toLocaleTimeString()}: ${error}`])
  }

  const addLog = (log: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${log}`])
  }

  const handleStartUpload = () => {
    setCurrentStep('upload')
  }

  const clearDebug = () => {
    setErrors([])
    setLogs([])
  }

  // Get current step based on dynamic flow
  const getCurrentStepInfo = () => {
    if (!promptDefinitions || currentStepIndex >= promptDefinitions.length) {
      return null
    }
    return promptDefinitions[currentStepIndex]
  }

  // Move to next step in the dynamic flow
  const moveToNextStep = () => {
    if (promptDefinitions && currentStepIndex < promptDefinitions.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
    } else {
      // All steps completed, go to generating
      setCurrentStep('generating')
    }
  }

  // Fetch prompt definitions for dynamic flow
  const { data: promptDefinitions } = useQuery(
    'prompt-definitions',
    async () => {
      const response = await axios.get(`${API_BASE}/admin/prompt-definitions`)
      return response.data.prompts
        .filter((prompt: { active: boolean }) => prompt.active)
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
    }
  )

  // Fetch existing images
  const { isLoading: imagesLoading } = useQuery<ImageAnalysis[]>(
    'images',
    async () => {
      const response = await axios.get(`${API_BASE}/images`)
      // Transform snake_case API response to camelCase frontend types
      return response.data.map((item: {
        id: string;
        original_image_path: string;
        analysis_result: string;
        questions: string;
        answers?: string;
        final_image_path?: string;
        created_at: string;
        updated_at: string;
      }) => ({
        id: item.id,
        originalImagePath: item.original_image_path,
        analysisResult: item.analysis_result,
        questions: item.questions,
        answers: item.answers,
        finalImagePath: item.final_image_path,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at)
      }))
    }
  )

  // Upload and analyze image mutation
  const uploadMutation = useMutation(
    async (file: File) => {
      addLog(`Starting upload for file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      const formData = new FormData()
      formData.append('image', file)
      
      const response = await axios.post(`${API_BASE}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      addLog('Upload successful, received response from server')
      return response.data
    },
    {
      onSuccess: (data) => {
        addLog(`Image analysis completed. Generated ${data.questions.length} questions`)
        setCurrentImageAnalysis({
          id: data.imageAnalysisId,
          originalImagePath: data.originalImagePath,
          analysisResult: data.analysis || '',
          questions: data.questions,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        setCurrentStepIndex(0) // Start with first step in dynamic flow
        queryClient.invalidateQueries('images')
      },
      onError: (error: unknown) => {
        console.error('🚨 Upload failed:', error)
        
        // Safely extract error details
        const errorObj = error as { 
          message?: string; 
          response?: { status?: number; statusText?: string; data?: { error?: string } }; 
          code?: string; 
          stack?: string 
        }
        
        const errorDetails = {
          message: errorObj?.message || 'Unknown error',
          status: errorObj?.response?.status || 'No status',
          statusText: errorObj?.response?.statusText || 'No status text',
          data: errorObj?.response?.data ? JSON.stringify(errorObj.response.data) : 'No data',
          code: errorObj?.code || 'No code',
          stack: errorObj?.stack || 'No stack trace'
        }
        
        console.error('🚨 Error details:', errorDetails)
        
        // Extract error message safely
        let errorMessage = 'Unknown error occurred'
        if (errorObj?.response?.data?.error) {
          errorMessage = errorObj.response.data.error
        } else if (errorObj?.message) {
          errorMessage = errorObj.message
        } else if (errorObj?.response?.statusText) {
          errorMessage = errorObj.response.statusText
        }
        
        addError(`Upload failed: ${errorMessage}`)
      }
    }
  )

  // Generate image mutation
  const generateMutation = useMutation(
    async (answers: QuestionAnswer[]) => {
      addLog(`Starting image generation with ${answers.length} answers`)
      const response = await axios.post(`${API_BASE}/images/generate`, {
        imageAnalysisId: currentImageAnalysis?.id,
        answers
      })
      addLog('Image generation request sent successfully')
      return response.data
    },
    {
      onSuccess: (_data) => {
        addLog('Image generated successfully!')
        setCurrentStep('upload')
        setCurrentImageAnalysis(null)
        queryClient.invalidateQueries('images')
        // Redirect to result page
        window.location.href = `/result?id=${currentImageAnalysis?.id}`
      },
      onError: (error: Error) => {
        console.error('🚨 Generation failed:', error)
        const errorObj = error as { response?: { status?: number; statusText?: string; data?: { error?: string } }; code?: string }
        console.error('🚨 Generation error details:', {
          status: errorObj.response?.status,
          statusText: errorObj.response?.statusText,
          data: JSON.stringify(errorObj.response?.data),
          message: error.message,
          code: errorObj.code
        })
        
        const errorMessage = errorObj.response?.data?.error || error.message || 'Unknown error occurred'
        addError(`Image generation failed: ${errorMessage}`)
        setCurrentStep('questions')
      }
    }
  )

  const handleImageUpload = (file: File) => {
    uploadMutation.mutate(file)
  }

  const handleQuestionsSubmit = (answers: QuestionAnswer[]) => {
    // Store the answers and move to next step in dynamic flow
    setCurrentImageAnalysis(prev => prev ? { ...prev, answers } : null)
    moveToNextStep()
  }

  const handleConversationalComplete = (conversationData: unknown) => {
    // Store conversation data and move to next step
    setCurrentImageAnalysis(prev => prev ? { ...prev, conversationData } : null)
    moveToNextStep()
  }

  const handleReset = () => {
    setCurrentStep('homepage')
    setCurrentImageAnalysis(null)
    setCurrentStepIndex(0)
    clearDebug()
  }

  if (imagesLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen">
      
      {currentStep === 'homepage' && (
        <div className="">
          <main className="max-w-4xl mx-auto">
            <AnimatedHomepage onStartUpload={handleStartUpload} />
          </main>
          
        </div>
      )}

      {currentStep === 'upload' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <ImageUpload onUpload={handleImageUpload} isLoading={uploadMutation.isLoading} />
        </div>
      )}

      {currentStep !== 'homepage' && currentStep !== 'upload' && (
        <div className="container mx-auto px-4 py-8">
          <main className="max-w-4xl mx-auto">
            
            {/* Progress Indicator */}
            {promptDefinitions && currentStep !== 'generating' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
                  <span className="text-sm text-gray-600">
                    Step {currentStepIndex + 1} of {promptDefinitions.length}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentStepIndex + 1) / promptDefinitions.length) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  {promptDefinitions.map((prompt: { id: string; name: string }, index: number) => (
                    <span 
                      key={prompt.id}
                      className={`${index <= currentStepIndex ? 'text-blue-600 font-medium' : 'text-gray-400'}`}
                    >
                      {prompt.name.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}

          {/* Dynamic Flow Steps */}
          {currentStep !== 'homepage' && currentStep !== 'upload' && currentStep !== 'generating' && currentImageAnalysis && (() => {
            const currentStepInfo = getCurrentStepInfo()
            if (!currentStepInfo) return null

            // Render based on prompt type
            switch (currentStepInfo.type) {
              case 'questions_generation':
                return (
                  <QuestionFlow
                    questions={currentImageAnalysis.questions}
                    originalImagePath={currentImageAnalysis.originalImagePath}
                    onSubmit={handleQuestionsSubmit}
                    onReset={handleReset}
                    isLoading={generateMutation.isLoading}
                  />
                )
              
              case 'conversational_question':
                return (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Step {currentStepIndex + 1}: {currentStepInfo.name.replace('_', ' ').toUpperCase()}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Let&apos;s have a conversation to understand your artistic preferences better!
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <p className="text-blue-800">
                        This is where the conversational flow would go. The AI will ask you questions one at a time 
                        to understand your artistic preferences before generating your image.
                      </p>
                    </div>
                    <button
                      onClick={() => handleConversationalComplete({})}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Complete Conversation (Demo)
                    </button>
                  </div>
                )
              
              case 'text_processing':
                return (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Step {currentStepIndex + 1}: {currentStepInfo.name.replace('_', ' ').toUpperCase()}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Processing your conversation and preparing for image generation...
                    </p>
                    <button
                      onClick={moveToNextStep}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Continue to Next Step
                    </button>
                  </div>
                )
              
              default:
                return (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Step {currentStepIndex + 1}: {currentStepInfo.name.replace('_', ' ').toUpperCase()}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Processing step: {currentStepInfo.type}
                    </p>
                    <button
                      onClick={moveToNextStep}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Continue
                    </button>
                  </div>
                )
            }
          })()}

          {currentStep === 'generating' && (
            <div className="text-center py-12">
              <LoadingSpinner />
              <h2 className="text-2xl font-semibold text-white mt-4 drop-shadow-lg">
                Generating your image...
              </h2>
              <p className="text-white/90 mt-2 drop-shadow-md">
                This may take a few moments. Please wait.
              </p>
            </div>
          )}

            {/* Debug Panel */}
            <DebugPanel 
              errors={errors} 
              logs={logs} 
              onClear={clearDebug} 
            />
          </main>
        </div>
      )}
    </div>
  )
}
