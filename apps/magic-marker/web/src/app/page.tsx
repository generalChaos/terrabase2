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
  const [currentStep, setCurrentStep] = useState<'homepage' | 'upload' | 'questions' | 'generating'>('homepage')
  const [currentImageAnalysis, setCurrentImageAnalysis] = useState<ImageAnalysis | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [logs, setLogs] = useState<string[]>([])
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
        setCurrentStep('questions')
        queryClient.invalidateQueries('images')
      },
      onError: (error: Error) => {
        console.error('🚨 Upload failed:', error)
        const errorObj = error as { response?: { status?: number; statusText?: string; data?: { error?: string } }; code?: string }
        console.error('🚨 Error details:', {
          status: errorObj.response?.status,
          statusText: errorObj.response?.statusText,
          data: JSON.stringify(errorObj.response?.data),
          message: error.message,
          code: errorObj.code
        })
        
        const errorMessage = errorObj.response?.data?.error || error.message || 'Unknown error occurred'
        addError(`Upload failed: ${errorMessage}`)
        
        // Error is already logged and displayed in DebugPanel
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
      onSuccess: (data) => {
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
    setCurrentStep('generating')
    generateMutation.mutate(answers)
  }

  const handleReset = () => {
    setCurrentStep('homepage')
    setCurrentImageAnalysis(null)
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

          {currentStep === 'questions' && currentImageAnalysis && (
            <QuestionFlow
              questions={currentImageAnalysis.questions}
              originalImagePath={currentImageAnalysis.originalImagePath}
              onSubmit={handleQuestionsSubmit}
              onReset={handleReset}
              isLoading={generateMutation.isLoading}
            />
          )}

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
