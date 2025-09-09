'use client'

import { useState, useRef } from 'react'
import { useMutation } from 'react-query'
import axios from 'axios'
import Image from 'next/image'
import { Question, QuestionAnswer } from '@/lib/types'
import { ArrowRight, Upload, Brain, MessageSquare, Image as ImageIcon, CheckCircle, Clock, AlertCircle } from 'lucide-react'

const API_BASE = '/api'

interface FlowStep {
  id: string
  name: string
  status: 'pending' | 'in_progress' | 'completed' | 'error'
  data?: any
  error?: string
  timestamp?: string
}

export default function TestPage() {
  const [currentStep, setCurrentStep] = useState<number>(0)
  const [flowSteps, setFlowSteps] = useState<FlowStep[]>([
    { id: 'upload', name: 'Upload Image', status: 'pending' },
    { id: 'analyze', name: 'Analyze Image', status: 'pending' },
    { id: 'questions', name: 'Generate Questions', status: 'pending' },
    { id: 'answers', name: 'Auto-Answer Questions', status: 'pending' },
    { id: 'generate', name: 'Generate Final Image', status: 'pending' },
    { id: 'deactivate', name: 'Deactivate Flow', status: 'pending' }
  ])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [flowData, setFlowData] = useState<any>(null)
  const [prompts, setPrompts] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const updateStepStatus = (stepId: string, status: FlowStep['status'], data?: any, error?: string) => {
    setFlowSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, data, error, timestamp: new Date().toISOString() }
        : step
    ))
  }

  const fetchPrompts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/prompt-definitions`)
      setPrompts(response.data.prompts || response.data)
    } catch (error) {
      console.error('Failed to fetch prompts:', error)
    }
  }

  const completeFlowMutation = useMutation(
    async ({ file }: { file: File }) => {
      const results: any = {}
      
      try {
        // Fetch prompts first
        await fetchPrompts()
        // Step 1: Upload Image
        updateStepStatus('upload', 'in_progress')
        setCurrentStep(1)
        
        const formData = new FormData()
        formData.append('image', file)
        
        const uploadResponse = await axios.post(`${API_BASE}/flow/upload`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        results.upload = uploadResponse.data
        updateStepStatus('upload', 'completed', uploadResponse.data)
        
        const flowId = uploadResponse.data.data.flowId
        const imagePath = uploadResponse.data.data.imagePath
        
        // Step 2: Analyze Image
        updateStepStatus('analyze', 'in_progress')
        setCurrentStep(2)
        
        const analyzeResponse = await axios.post(`${API_BASE}/flow/${flowId}/analyze`)
        results.analyze = analyzeResponse.data
        updateStepStatus('analyze', 'completed', analyzeResponse.data)
        
        // Step 3: Generate Questions
        updateStepStatus('questions', 'in_progress')
        setCurrentStep(3)
        
        const questionsResponse = await axios.post(`${API_BASE}/flow/${flowId}/questions`)
        results.questions = questionsResponse.data
        updateStepStatus('questions', 'completed', questionsResponse.data)
        
        // Step 4: Auto-Answer Questions
        updateStepStatus('answers', 'in_progress')
        setCurrentStep(4)
        
        const questions: Question[] = questionsResponse.data.data.questions
        const autoAnswers: QuestionAnswer[] = questions.map(question => ({
          questionId: question.id,
          answer: question.options[0] // Select first option
        }))
        
        results.answers = { questions, autoAnswers }
        updateStepStatus('answers', 'completed', { questions, autoAnswers })
        
        // Step 5: Generate Final Image
        updateStepStatus('generate', 'in_progress')
        setCurrentStep(5)
        
        const generateResponse = await axios.post(`${API_BASE}/flow/${flowId}/generate`, {
          answers: autoAnswers
        })
        results.generate = generateResponse.data
        updateStepStatus('generate', 'completed', generateResponse.data)
        
        // Step 6: Deactivate Flow
        updateStepStatus('deactivate', 'in_progress')
        setCurrentStep(6)
        
        const deactivateResponse = await axios.post(`${API_BASE}/flow/${flowId}/deactivate`)
        results.deactivate = deactivateResponse.data
        updateStepStatus('deactivate', 'completed', deactivateResponse.data)
        
        setCurrentStep(7) // All complete
        
        return results
        
      } catch (error: any) {
        console.error('Flow error:', error)
        const errorMessage = error.response?.data?.error || error.message
        updateStepStatus(flowSteps[currentStep]?.id || 'unknown', 'error', null, errorMessage)
        throw error
      }
    }
  )

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFlowData(null)
      setCurrentStep(0)
      setFlowSteps(prev => prev.map(step => ({ ...step, status: 'pending', data: undefined, error: undefined })))
    }
  }

  const handleStartTest = () => {
    if (selectedFile) {
      completeFlowMutation.mutate({ file: selectedFile })
    }
  }

  const getStepIcon = (step: FlowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'in_progress':
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
    }
  }

  const getStepColor = (step: FlowStep) => {
    switch (step.status) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'in_progress':
        return 'bg-blue-50 border-blue-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Flow Test Page</h1>
          <p className="text-gray-600 mb-6">
            Test the complete image processing flow step by step. Upload an image and watch each step execute automatically.
          </p>

          {/* File Upload */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Image
            </label>
            <div className="flex items-center space-x-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Choose Image</span>
              </button>
              {selectedFile && (
                <span className="text-sm text-gray-600">
                  {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              )}
            </div>
          </div>

          {/* Start Test Button */}
          {selectedFile && (
            <div className="mb-8">
              <button
                onClick={handleStartTest}
                disabled={completeFlowMutation.isLoading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {completeFlowMutation.isLoading ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>
                  {completeFlowMutation.isLoading ? 'Running Test...' : 'Start Complete Flow Test'}
                </span>
              </button>
            </div>
          )}

          {/* Available Prompts */}
          {prompts && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Prompts:</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {prompts.map((prompt: any) => (
                  <div key={prompt.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">{prompt.name}</h4>
                    <div className="text-sm text-blue-700 max-h-24 overflow-y-auto">
                      <pre className="whitespace-pre-wrap">{prompt.prompt_text}</pre>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Flow Steps */}
        <div className="space-y-4">
          {flowSteps.map((step, index) => (
            <div
              key={step.id}
              className={`p-6 rounded-lg border-2 transition-all ${getStepColor(step)} ${
                currentStep === index + 1 ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center space-x-4 mb-4">
                {getStepIcon(step)}
                <h3 className="text-lg font-semibold text-gray-900">{step.name}</h3>
                {step.timestamp && (
                  <span className="text-sm text-gray-500">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                )}
              </div>

              {/* Step Data Display */}
              {step.data && (
                <div className="mt-4 space-y-4">
                  {step.id === 'upload' && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Upload Result:</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm">
                        <p className="text-gray-800"><strong>Flow ID:</strong> {step.data.data.flowId}</p>
                        <p className="text-gray-800"><strong>Image Path:</strong> {step.data.data.imagePath}</p>
                      </div>
                    </div>
                  )}

                  {step.id === 'analyze' && (
                    <div>
                      {prompts && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-600 mb-2">Used Prompt (image_analysis):</h5>
                          <div className="bg-blue-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-gray-700">{prompts.find((p: any) => p.name === 'image_analysis')?.prompt_text || 'Prompt not found'}</pre>
                          </div>
                        </div>
                      )}
                      
                      <h4 className="font-medium text-gray-700 mb-2">Analysis Result:</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm max-h-40 overflow-y-auto">
                        <pre className="whitespace-pre-wrap text-gray-800">{step.data.data.analysis}</pre>
                      </div>
                    </div>
                  )}

                  {step.id === 'questions' && (
                    <div>
                      {prompts && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-600 mb-2">Used Prompt (questions_generation):</h5>
                          <div className="bg-blue-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-gray-700">{prompts.find((p: any) => p.name === 'questions_generation')?.prompt_text || 'Prompt not found'}</pre>
                          </div>
                        </div>
                      )}
                      
                      <h4 className="font-medium text-gray-700 mb-2">Generated Questions ({step.data.data.questions.length}):</h4>
                      <div className="space-y-2">
                        {step.data.data.questions.map((q: Question, i: number) => (
                          <div key={q.id} className="bg-gray-100 p-3 rounded text-sm">
                            <p className="text-gray-800"><strong>Q{i + 1}:</strong> {q.text}</p>
                            <p className="text-gray-800"><strong>Options:</strong> {q.options.join(', ')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.id === 'answers' && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Auto-Selected Answers:</h4>
                      <div className="space-y-2">
                        {step.data.autoAnswers.map((answer: QuestionAnswer, i: number) => {
                          const question = step.data.questions.find((q: Question) => q.id === answer.questionId)
                          return (
                            <div key={answer.questionId} className="bg-gray-100 p-3 rounded text-sm">
                              <p className="text-gray-800"><strong>Q{i + 1}:</strong> {question?.text || 'Unknown question'}</p>
                              <p className="text-gray-800"><strong>Selected:</strong> {answer.answer}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {step.id === 'generate' && (
                    <div>
                      {prompts && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-600 mb-2">Used Prompt (image_generation):</h5>
                          <div className="bg-blue-50 p-3 rounded text-sm max-h-32 overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-gray-700">{prompts.find((p: any) => p.name === 'image_generation')?.prompt_text || 'Prompt not found'}</pre>
                          </div>
                        </div>
                      )}
                      
                      <h4 className="font-medium text-gray-700 mb-2">Generated Image:</h4>
                      <div className="bg-gray-100 p-3 rounded">
                        <p className="text-sm mb-2 text-gray-800"><strong>Image Path:</strong> {step.data.data.finalImagePath}</p>
                        <div className="relative w-64 h-64">
                          <Image
                            src={step.data.data.finalImagePath}
                            alt="Generated image"
                            fill
                            className="object-contain rounded"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {step.id === 'deactivate' && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Deactivation Result:</h4>
                      <div className="bg-gray-100 p-3 rounded text-sm">
                        <p className="text-gray-800"><strong>Status:</strong> {step.data.data.message}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Error Display */}
              {step.error && (
                <div className="mt-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
                  <strong>Error:</strong> {step.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary */}
        {currentStep === 7 && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">✅ Test Complete!</h3>
            <p className="text-green-700">
              All steps completed successfully. The image processing flow is working correctly.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
