'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnalysisFlow } from '@/lib/analysisFlowService'
import { Image } from '@/lib/imageService'
import { ArrowLeft, Calendar, MessageSquare, Image as ImageIcon, FileText, Clock, CheckCircle, XCircle, Hash } from 'lucide-react'

export default function AnalysisFlowDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const [analysisFlow, setAnalysisFlow] = useState<AnalysisFlow | null>(null)
  const [originalImage, setOriginalImage] = useState<Image | null>(null)
  const [finalImage, setFinalImage] = useState<Image | null>(null)
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
        
        // Fetch original image if available
        if (data.original_image_id) {
          const imageResponse = await fetch(`/api/images/${data.original_image_id}`)
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            setOriginalImage(imageData)
          }
        }
        
        // Fetch final image if available
        if (data.final_image_id) {
          const imageResponse = await fetch(`/api/images/${data.final_image_id}`)
          if (imageResponse.ok) {
            const imageData = await imageResponse.json()
            setFinalImage(imageData)
          }
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
    return new Date(dateString).toLocaleString()
  }


  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-gray-600 bg-gray-100'
  }

  const getStatusIcon = (isActive: boolean) => {
    return isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
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
                    {formatDate(analysisFlow.createdAt)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {formatDate(analysisFlow.updatedAt)}
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

            {/* Questions & Answers */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                Questions & Answers
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Questions</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analysisFlow.totalQuestions}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Answers</label>
                    <p className="mt-1 text-2xl font-bold text-gray-900">{analysisFlow.totalAnswers}</p>
                  </div>
                </div>

                {/* Questions List */}
                {analysisFlow.questions && analysisFlow.questions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Questions</label>
                    <div className="space-y-2">
                      {analysisFlow.questions.map((question, index) => (
                        <div key={question.id} className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">Q{index + 1}:</span> {question.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Answers List */}
                {analysisFlow.answers && analysisFlow.answers.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 mb-2 block">Answers</label>
                    <div className="space-y-2">
                      {analysisFlow.answers.map((answer, index) => (
                        <div key={answer.questionId} className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">A{index + 1}:</span> {answer.answer}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Context Data */}
            {analysisFlow.contextData && Object.keys(analysisFlow.contextData).length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Context Data</h2>
                <pre className="text-xs text-gray-700 bg-gray-50 p-4 rounded-lg overflow-auto">
                  {JSON.stringify(analysisFlow.contextData, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Processing Steps */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Processing Steps
              </h3>
              <div className="space-y-2">
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
