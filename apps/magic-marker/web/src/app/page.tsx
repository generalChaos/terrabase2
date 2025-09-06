'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'
import { ImageAnalysis, QuestionAnswer, Question } from '@/lib/types'
import { AnalysisFlowService } from '@/lib/analysisFlowService'
import ImageUpload from '@/components/ImageUpload'
import QuestionFlow from '@/components/QuestionFlow'
import ConversationalQuestionFlow from '@/components/ConversationalQuestionFlow'
import LoadingSpinner from '@/components/LoadingSpinner'
import DebugPanel from '@/components/DebugPanel'
import AnimatedHomepage from '@/components/AnimatedHomepage'
import { ToastContainer, useToast } from '@/components/Toast'

const API_BASE = '/api'

export default function HomePage() {
  const [currentStep, setCurrentStep] = useState<'homepage' | 'upload' | 'questions' | 'conversational' | 'generating' | 'dynamic'>('homepage')
  const [currentImageAnalysis, setCurrentImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const hasTriggeredGeneration = useRef(false)
  const { toasts, removeToast, success, error, warning, info } = useToast()
  
  // Type assertion to help TypeScript understand the error function
  const showError = error as (title: string, message: string) => void

  // Log when currentStepIndex changes
  useEffect(() => {
    console.log('🔄 [STATE] currentStepIndex changed to:', currentStepIndex)
  }, [currentStepIndex])
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
    console.log(`🔍 [STEP] getCurrentStepInfo called - currentStepIndex: ${currentStepIndex}`)
    console.log(`🔍 [STEP] promptDefinitions length: ${promptDefinitions?.length || 0}`)
    
    if (!promptDefinitions || currentStepIndex >= promptDefinitions.length) {
      console.log('🔍 [STEP] No prompt definitions or index out of bounds - returning null')
      return null
    }
    
    const stepInfo = promptDefinitions[currentStepIndex]
    console.log(`🔍 [STEP] Current step info:`, stepInfo)
    return stepInfo
  }

  // Move to next step in the dynamic flow
  const moveToNextStep = () => {
    console.log(`🔄 [FLOW] moveToNextStep called - currentStepIndex: ${currentStepIndex}`)
    console.log(`🔄 [FLOW] promptDefinitions length: ${promptDefinitions?.length || 0}`)
    
    if (promptDefinitions && currentStepIndex < promptDefinitions.length - 1) {
      const nextStepIndex = currentStepIndex + 1
      const nextStep = promptDefinitions[nextStepIndex]
      console.log(`🔄 [FLOW] Moving from step ${currentStepIndex} to ${nextStepIndex}`)
      console.log(`🔄 [FLOW] Next step: ${nextStep?.name} (${nextStep?.type})`)
      setCurrentStepIndex(nextStepIndex)
    } else {
      console.log('🎯 [FLOW] All steps completed - moving to generating')
      setCurrentStep('generating')
    }
  }

  // Fetch prompt definitions for dynamic flow
  const { data: promptDefinitions } = useQuery(
    'prompt-definitions',
    async () => {
      console.log('📋 [PROMPTS] Fetching prompt definitions...')
      const response = await axios.get(`${API_BASE}/admin/prompt-definitions`)
      const prompts = response.data.prompts
        .filter((prompt: { active: boolean }) => prompt.active)
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
      console.log('📋 [PROMPTS] Loaded prompt definitions:', prompts.map((p: { name: string; type: string; sort_order: number }) => ({ name: p.name, type: p.type, sort_order: p.sort_order })))
      return prompts
    }
  )

  // Fetch existing images
  const { isLoading: imagesLoading } = useQuery<ImageAnalysis[]>(
    'images',
    async () => {
      const response = await axios.get(`${API_BASE}/images`)
      // The API now returns the combined data structure directly
      return response.data.map((item: { id: string; originalImagePath: string; analysisResult: string; questions: Question[]; answers?: QuestionAnswer[]; finalImagePath?: string; createdAt: string; updatedAt: string; sessionId?: string; totalQuestions?: number; totalAnswers?: number; currentStep?: string; totalCostUsd?: number; totalTokens?: number; isActive?: boolean }) => ({
        id: item.id,
        originalImagePath: item.originalImagePath,
        analysisResult: item.analysisResult,
        questions: item.questions || [],
        answers: item.answers || [],
        finalImagePath: item.finalImagePath,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        // New fields from analysis flows
        sessionId: item.sessionId,
        totalQuestions: item.totalQuestions || 0,
        totalAnswers: item.totalAnswers || 0,
        currentStep: item.currentStep,
        totalCostUsd: item.totalCostUsd || 0,
        totalTokens: item.totalTokens || 0,
        isActive: item.isActive || false
      }))
    }
  )

  // Upload and analyze image mutation
  const uploadMutation = useMutation(
    async ({ file }: { file: File }) => {
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
        console.log('📤 [UPLOAD] Upload success - data:', data)
        
        // Check if we're in debug mode
        if (data.debugMode) {
          addLog(`🐛 DEBUG MODE: ${data.debugMessage}`)
          addLog(`Image analysis completed: ${data.analysis}`)
          addLog(`Questions generated: ${data.questions.length} questions`)
          
          // Show debug toast
          warning(
            'Debug Mode Active',
            'Flow stopped after questions generation for debugging. Check console for details.'
          )
          
          setCurrentImageAnalysis({
            id: data.imageAnalysisId,
            originalImagePath: data.originalImagePath,
            analysisResult: data.analysis || '',
            questions: data.questions || [], // Show the generated questions
            createdAt: new Date(),
            updatedAt: new Date(),
            flowId: data.flowId,
            totalQuestions: data.questions?.length || 0,
            totalAnswers: 0,
            currentStep: 'debug',
            totalCostUsd: 0,
            totalTokens: 0,
            isActive: true
          })
          
          // Stay on upload step to show debug info
          setCurrentStep('upload')
          setCurrentStepIndex(0)
          queryClient.invalidateQueries('images')
          return
        }
        
        addLog(`Image analysis completed. Generated ${data.questions.length} questions`)
        
        // Show success toast
        success(
          'Image Uploaded Successfully!',
          `Analysis completed and ${data.questions.length} questions generated.`
        )
        
        setCurrentImageAnalysis({
          id: data.imageAnalysisId,
          originalImagePath: data.originalImagePath,
          analysisResult: data.analysis || '',
          questions: data.questions,
          createdAt: new Date(),
          updatedAt: new Date(),
          // New fields from analysis flows
          sessionId: data.sessionId,
          flowId: data.flowId, // Store the analysis flow ID
          totalQuestions: data.questions?.length || 0,
          totalAnswers: 0,
          currentStep: 'questions',
          totalCostUsd: 0,
          totalTokens: 0,
          isActive: true
        })
        console.log('🔄 [UPLOAD] Setting currentStep to dynamic and currentStepIndex to 1 (questions_generation step)')
        setCurrentStep('dynamic')
        setCurrentStepIndex(1) // Start at step 2 (questions_generation) to show questions to user 
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
        let debugInfo = null
        
        if (errorObj?.response?.data?.error) {
          errorMessage = errorObj.response.data.error
          // Check if there's debug info in the response
          if (errorObj.response.data && 'debug' in errorObj.response.data) {
            debugInfo = (errorObj.response.data as { debug?: unknown }).debug
          }
        } else if (errorObj?.message) {
          errorMessage = errorObj.message
        } else if (errorObj?.response?.statusText) {
          errorMessage = errorObj.response.statusText
        }
        
        // Show user-friendly error toast
        showError(
          'Upload Failed',
          errorMessage
        )
        
        // Still add to debug panel for developers
        const fullErrorMessage = debugInfo 
          ? `Upload failed: ${errorMessage}\nDebug: ${JSON.stringify(debugInfo, null, 2)}`
          : `Upload failed: ${errorMessage}`
        
        addError(fullErrorMessage)
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
      onSuccess: async (_data) => {
        addLog('Image generated successfully!')
        
        // Deactivate the analysis flow now that image generation is complete
        if (currentImageAnalysis?.flowId) {
          try {
            console.log('🔚 [GENERATION] Deactivating analysis flow:', currentImageAnalysis.flowId)
            await AnalysisFlowService.deactivateAnalysisFlow(currentImageAnalysis.flowId)
            console.log('✅ [GENERATION] Analysis flow deactivated successfully')
          } catch (error) {
            console.error('❌ [GENERATION] Failed to deactivate analysis flow:', error)
          }
        }
        
        // Show success toast
        success(
          'Image Generated!',
          'Your custom image has been created successfully.'
        )
        
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
        
        // Show user-friendly error toast
        showError(
          'Image Generation Failed',
          errorMessage
        )
        
        // Still add to debug panel for developers
        addError(`Image generation failed: ${errorMessage}`)
        setCurrentStep('questions')
      }
    }
  )

  // Trigger image generation when step becomes 'generating' or when we reach image_generation step
  useEffect(() => {
    const shouldTriggerGeneration = 
      (currentStep === 'generating' || 
       (currentStep === 'dynamic' && promptDefinitions && currentStepIndex < promptDefinitions.length && promptDefinitions[currentStepIndex]?.type === 'image_generation')) &&
      currentImageAnalysis?.answers && 
      currentImageAnalysis.answers.length > 0 &&
      !hasTriggeredGeneration.current

    if (shouldTriggerGeneration) {
      console.log('🎨 [GENERATION] Triggering image generation with answers:', currentImageAnalysis.answers)
      hasTriggeredGeneration.current = true
      generateMutation.mutate(currentImageAnalysis.answers || [])
    }
  }, [currentStep, currentImageAnalysis?.answers, generateMutation])

  // Reset generation trigger when starting new flow
  useEffect(() => {
    if (currentStep === 'homepage' || currentStep === 'upload') {
      hasTriggeredGeneration.current = false
    }
  }, [currentStep])

  const handleImageUpload = (file: File) => {
    // Show info toast when upload starts
    info(
      'Uploading Image...',
      'Please wait while we analyze your image.'
    )
    uploadMutation.mutate({ file })
  }

  const handleQuestionsSubmit = (answers: QuestionAnswer[]) => {
    console.log('📝 [QUESTIONS] handleQuestionsSubmit called with answers:', answers)
    console.log('📝 [QUESTIONS] Current step index:', currentStepIndex)
    
    // Show success toast for questions completion
    success(
      'Questions Answered!',
      `You've answered ${answers.length} questions. Moving to next step.`
    )
    
    // Store the answers and move to next step in dynamic flow
    setCurrentImageAnalysis(prev => prev ? { ...prev, answers } : null)
    console.log('📝 [QUESTIONS] Moving to next step after storing answers')
    moveToNextStep()
  }

  const handleConversationalComplete = (conversationData: unknown) => {
    console.log('💬 [CONVERSATION] handleConversationalComplete called with data:', conversationData)
    console.log('💬 [CONVERSATION] Current step index:', currentStepIndex)
    // Store conversation data and move to next step
    setCurrentImageAnalysis(prev => prev ? { ...prev, conversationData } : null)
    console.log('💬 [CONVERSATION] Moving to next step after storing conversation data')
    moveToNextStep()
  }

  const handleConversationalSkip = () => {
    console.log('⏭️ [CONVERSATION] Skipping conversational step due to error')
    console.log('⏭️ [CONVERSATION] Current step index:', currentStepIndex)
    // Move to next step without conversation data
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
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      
      {currentStep === 'homepage' && (
        <div className="">
          <main className="max-w-4xl mx-auto">
            <AnimatedHomepage onStartUpload={handleStartUpload} />
          </main>
          
        </div>
      )}

      {currentStep === 'upload' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-4xl">
            <ImageUpload onUpload={handleImageUpload} isLoading={uploadMutation.isLoading} />
            
            {/* Debug Mode Display */}
            {currentImageAnalysis && currentImageAnalysis.currentStep === 'debug' && (
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-800 mb-4">
                  🐛 Debug Mode - Steps 1 & 2 Complete
                </h3>
                
                {/* Image Analysis Result */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-yellow-700 mb-2">Step 1: Image Analysis</h4>
                  <div className="bg-white border border-yellow-200 rounded p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {currentImageAnalysis.analysisResult}
                    </p>
                  </div>
                </div>
                
                {/* Generated Questions */}
                <div className="mb-6">
                  <h4 className="text-md font-semibold text-yellow-700 mb-2">
                    Step 2: Generated Questions ({currentImageAnalysis.questions.length})
                  </h4>
                  <div className="bg-white border border-yellow-200 rounded p-4">
                    {currentImageAnalysis.questions.length > 0 ? (
                      <div className="space-y-3">
                        {currentImageAnalysis.questions.map((question, index) => (
                          <div key={question.id || index} className="border-l-4 border-yellow-300 pl-3">
                            <p className="font-medium text-gray-800">{question.text}</p>
                            <p className="text-sm text-gray-600">
                              Type: {question.type} | Required: {question.required ? 'Yes' : 'No'}
                            </p>
                            {question.options && question.options.length > 0 && (
                              <p className="text-sm text-gray-500">
                                Options: {question.options.join(', ')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No questions generated</p>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 text-sm text-yellow-700">
                  <p><strong>Image ID:</strong> {currentImageAnalysis.id}</p>
                  <p><strong>Flow ID:</strong> {currentImageAnalysis.flowId}</p>
                  <p><strong>Status:</strong> Stopped after questions generation for debugging</p>
                </div>
                <button
                  onClick={handleReset}
                  className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                >
                  Reset and Try Again
                </button>
              </div>
            )}
          </div>
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
          {currentStep === 'dynamic' && currentImageAnalysis && (() => {
            console.log('🎨 [RENDER] Rendering dynamic flow steps')
            console.log('🎨 [RENDER] currentStep:', currentStep)
            console.log('🎨 [RENDER] currentStepIndex:', currentStepIndex)
            console.log('🎨 [RENDER] currentImageAnalysis exists:', !!currentImageAnalysis)
            
            const currentStepInfo = getCurrentStepInfo()
            if (!currentStepInfo) {
              console.log('🎨 [RENDER] No current step info - checking if we have a generated image to show')
              // If we're past the last step and have a generated image, show it
              if (currentImageAnalysis?.finalImagePath) {
                return (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">
                      Your Generated Image
                    </h2>
                    <div className="flex justify-center mb-6">
                      <img
                        src={currentImageAnalysis.finalImagePath}
                        alt="Generated image"
                        className="max-w-full h-auto max-h-96 border border-gray-300 rounded-lg shadow-lg"
                      />
                    </div>
                    <div className="space-x-4">
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Start Over
                      </button>
                      <button
                        onClick={() => {
                          // Download the image
                          const link = document.createElement('a')
                          link.href = currentImageAnalysis.finalImagePath || ''
                          link.download = 'generated-image.png'
                          link.click()
                        }}
                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        Download Image
                      </button>
                    </div>
                  </div>
                )
              }
              console.log('🎨 [RENDER] No current step info and no generated image - returning null')
              return null
            }

            console.log('🎨 [RENDER] Rendering step type:', currentStepInfo.type)
            // Render based on prompt type
            switch (currentStepInfo.type) {
              case 'questions_generation':
                // Show questions if they exist, otherwise show generate button
                if (currentImageAnalysis.questions && currentImageAnalysis.questions.length > 0) {
                  return (
                    <QuestionFlow
                      questions={currentImageAnalysis.questions}
                      originalImagePath={currentImageAnalysis.originalImagePath}
                      onSubmit={handleQuestionsSubmit}
                      onReset={handleReset}
                      isLoading={generateMutation.isLoading}
                    />
                  )
                } else {
                  return (
                    <div className="text-center py-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-4">
                        Step {currentStepIndex + 1}: {currentStepInfo.name.replace('_', ' ').toUpperCase()}
                      </h2>
                      <p className="text-gray-600 mb-6">
                        Generating questions from your image analysis...
                      </p>
                      <button
                        onClick={async () => {
                          console.log('❓ [QUESTIONS] Generate questions button clicked')
                          console.log('❓ [QUESTIONS] Analysis result length:', currentImageAnalysis.analysisResult.length)
                          
                          // Generate questions using the prompt system
                          try {
                            console.log('❓ [QUESTIONS] Calling /api/test-prompt for questions_generation')
                            const response = await fetch('/api/test-prompt', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                promptName: 'questions_generation',
                                input: {
                                  analysis: currentImageAnalysis.analysisResult,
                                  prompt: 'Generate engaging questions to help create a great artistic image based on this analysis.'
                                }
                              })
                            })
                            const result = await response.json()
                            console.log('❓ [QUESTIONS] API response:', result)
                            
                            if (result.success) {
                              console.log('❓ [QUESTIONS] Questions generated successfully, count:', result.response.questions?.length || 0)
                              // Update the image analysis with generated questions
                              setCurrentImageAnalysis(prev => prev ? { 
                                ...prev, 
                                questions: result.response.questions 
                              } : null)
                              console.log('❓ [QUESTIONS] Questions stored, staying on current step to show questions')
                              // Don't call moveToNextStep() here - let the UI show the questions
                            } else {
                              console.error('❓ [QUESTIONS] Failed to generate questions:', result.error)
                            }
                          } catch (error) {
                            console.error('❓ [QUESTIONS] Error generating questions:', error)
                          }
                        }}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Generate Questions
                      </button>
                    </div>
                  )
                }
              
              case 'conversational_question':
                // Show the conversational question flow
                return (
                  <ConversationalQuestionFlow
                    imageId={currentImageAnalysis.id}
                    imageAnalysis={currentImageAnalysis.analysisResult}
                    originalImagePath={currentImageAnalysis.originalImagePath}
                    onSubmit={handleQuestionsSubmit}
                    onReset={handleReset}
                    onSkip={handleConversationalSkip}
                    isLoading={generateMutation.isLoading}
                  />
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
              
              case 'image_generation':
                // Check if we're in generating state for this step
                if (currentStep === 'dynamic' && currentStepInfo.type === 'image_generation') {
                  return (
                    <div className="text-center py-12">
                      <LoadingSpinner />
                      <h2 className="text-2xl font-semibold text-white mt-4 drop-shadow-lg">
                        Generating your image...
                      </h2>
                      <p className="text-white/90 mt-2 drop-shadow-md">
                        This may take a few moments. Please wait.
                      </p>
                    </div>
                  )
                }
                
                return (
                  <div className="text-center py-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">
                      Step {currentStepIndex + 1}: {currentStepInfo.name.replace('_', ' ').toUpperCase()}
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Ready to generate your final image!
                    </p>
                    <button
                      onClick={async () => {
                        console.log('🖼️ [IMAGE] Generate image button clicked')
                        try {
                          // Set generating state first
                          setCurrentStep('generating')
                          
                          // Generate image using the prompt system
                          const response = await fetch('/api/test-prompt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              promptName: 'image_generation',
                              input: {
                                prompt: 'Create an artistic image based on the user preferences and image analysis'
                              }
                            })
                          })
                          const result = await response.json()
                          console.log('🖼️ [IMAGE] API response:', result)
                          
                          if (result.success) {
                            console.log('🖼️ [IMAGE] Image generated successfully')
                            // Store the generated image and move to next step to show result
                            setCurrentImageAnalysis(prev => prev ? { 
                              ...prev, 
                              finalImagePath: `data:image/png;base64,${result.response.image_base64}`
                            } : null)
                            // Move to next step to show the generated image
                            moveToNextStep()
                          } else {
                            console.error('🖼️ [IMAGE] Failed to generate image:', result.error)
                            setCurrentStep('dynamic') // Go back to dynamic flow even on error
                          }
                        } catch (error) {
                          console.error('🖼️ [IMAGE] Error generating image:', error)
                          setCurrentStep('dynamic') // Go back to dynamic flow on error
                        }
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Generate Image
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
