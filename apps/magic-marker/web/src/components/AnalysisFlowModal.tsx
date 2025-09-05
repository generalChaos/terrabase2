'use client'

import { useState, useEffect } from 'react'
import { AnalysisFlow } from '@/lib/analysisFlowService'
import { Image } from '@/lib/imageService'
import { X, Calendar, MessageSquare, Image as ImageIcon, CheckCircle, XCircle, Clock } from 'lucide-react'

interface AnalysisFlowModalProps {
  analysisFlow: AnalysisFlow | null
  isOpen: boolean
  onClose: () => void
}

export default function AnalysisFlowModal({ analysisFlow, isOpen, onClose }: AnalysisFlowModalProps) {
  const [originalImage, setOriginalImage] = useState<Image | null>(null)
  const [finalImage, setFinalImage] = useState<Image | null>(null)
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
    }
  }, [analysisFlow, isOpen])

  const fetchImages = async () => {
    if (!analysisFlow) return

    setLoading(true)
    try {
      // Fetch original image
      if (analysisFlow.original_image_id) {
        const imageResponse = await fetch(`/api/images/${analysisFlow.original_image_id}`)
        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          setOriginalImage(imageData)
        }
      }

      // Fetch final image
      if (analysisFlow.final_image_id) {
        const imageResponse = await fetch(`/api/images/${analysisFlow.final_image_id}`)
        if (imageResponse.ok) {
          const imageData = await imageResponse.json()
          setFinalImage(imageData)
        }
      }
    } catch (error) {
      console.error('Error fetching images:', error)
    } finally {
      setLoading(false)
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
    <div className="fixed inset-0 z-50 overflow-y-auto" key={analysisFlow.id}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full h-full max-w-none max-h-none">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Analysis Flow Details
                </h3>
                <p className="text-sm text-gray-500">ID: {analysisFlow.id.substring(0, 8)}...</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Images */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images
                </h4>
                <div className="space-y-3">
                  {/* Original Image */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Original Image</label>
                    {loading ? (
                      <div className="mt-2 w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                    ) : originalImage ? (
                      <div className="mt-2 flex items-center space-x-3">
                        <img
                          src={originalImage.originalImagePath || originalImage.file_path}
                          alt="Original"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <div>
                          <p className="text-sm text-gray-900 font-mono">{originalImage.id.substring(0, 8)}...</p>
                          <p className="text-xs text-gray-500">Type: {originalImage.image_type || originalImage.type}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No original image</p>
                    )}
                  </div>

                  {/* Final Image */}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Final Image</label>
                    {loading ? (
                      <div className="mt-2 w-20 h-20 bg-gray-200 rounded-lg animate-pulse" />
                    ) : finalImage ? (
                      <div className="mt-2 flex items-center space-x-3">
                        <img
                          src={finalImage.originalImagePath || finalImage.file_path}
                          alt="Final"
                          className="w-20 h-20 object-cover rounded-lg border"
                        />
                        <div>
                          <p className="text-sm text-gray-900 font-mono">{finalImage.id.substring(0, 8)}...</p>
                          <p className="text-xs text-gray-500">Type: {finalImage.image_type || finalImage.type}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-sm text-gray-500">No final image generated</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div>
                <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Statistics
                </h4>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Questions</label>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {analysisFlow.total_questions || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Total generated</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Answered</label>
                      <p className="mt-1 text-2xl font-bold text-gray-900">
                        {analysisFlow.total_answers || 0}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Conversational</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(analysisFlow.isActive)}`}>
                        {getStatusIcon(analysisFlow.isActive)}
                        <span className="ml-1">{analysisFlow.isActive ? 'Active' : 'Inactive'}</span>
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">Tokens</label>
                    <p className="mt-1 text-lg font-semibold text-gray-900">
                      {(analysisFlow.total_tokens || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Timestamps
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Created At</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDate(analysisFlow.created_at)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Updated At</label>
                  <p className="mt-1 text-sm text-gray-900 flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatDate(analysisFlow.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Questions Preview */}
            {analysisFlow.questions && analysisFlow.questions.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-md font-semibold text-gray-900 mb-3">Questions Preview</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {analysisFlow.questions.slice(0, 3).map((question, index) => (
                    <div key={question.id} className="p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium text-gray-700">Q{index + 1}:</span> {question.text}
                    </div>
                  ))}
                  {analysisFlow.questions.length > 3 && (
                    <div className="text-sm text-gray-500 text-center py-2">
                      ... and {analysisFlow.questions.length - 3} more questions
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Close
            </button>
            <button
              onClick={() => {
                window.open(`/result?id=${analysisFlow.original_image_id}`, '_blank')
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              View Result Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
