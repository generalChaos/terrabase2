'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { AnalysisFlow } from '@/lib/newTypes'
import LoadingSpinner from '@/components/LoadingSpinner'
import AdminLayout from '@/components/AdminLayout'
import AnalysisFlowModal from '@/components/AnalysisFlowModal'
import { ToggleLeft, ToggleRight, Calendar, MessageSquare, Image as ImageIcon } from 'lucide-react'

const API_BASE = '/api'

export default function AnalysisFlowsPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [selectedFlow, setSelectedFlow] = useState<AnalysisFlow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imageThumbnails, setImageThumbnails] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()
  const router = useRouter()

  const addError = (error: string) => {
    setErrors(prev => [...prev, `${new Date().toLocaleTimeString()}: ${error}`])
  }

  const fetchImageThumbnails = async (flows: AnalysisFlow[]) => {
    const thumbnails: Record<string, string> = {}
    
    for (const flow of flows) {
      try {
        if (flow.original_image_id) {
          const response = await fetch(`/api/images/${flow.original_image_id}`)
          if (response.ok) {
            const imageData = await response.json()
            thumbnails[flow.original_image_id] = imageData.originalImagePath || imageData.file_path
          }
        }
        if (flow.final_image_id) {
          const response = await fetch(`/api/images/${flow.final_image_id}`)
          if (response.ok) {
            const imageData = await response.json()
            thumbnails[flow.final_image_id] = imageData.originalImagePath || imageData.file_path
          }
        }
      } catch (error) {
        console.error('Error fetching image thumbnail:', error)
      }
    }
    
    setImageThumbnails(thumbnails)
  }

  // Fetch analysis flows
  const { data: analysisFlows, isLoading, error } = useQuery<AnalysisFlow[]>(
    'analysis-flows',
    async () => {
      const response = await axios.get(`${API_BASE}/admin/analysis-flows`)
      return response.data
    },
    {
      onError: (error: unknown) => {
        console.error('Failed to load analysis flows:', error)
        addError(`Failed to load analysis flows: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  )

  // Fetch image thumbnails when analysis flows are loaded
  useEffect(() => {
    if (analysisFlows && analysisFlows.length > 0) {
      fetchImageThumbnails(analysisFlows)
    }
  }, [analysisFlows])

  // Toggle analysis flow active status
  const toggleFlowMutation = useMutation(
    async ({ flowId, isActive }: { flowId: string; isActive: boolean }) => {
      const response = await axios.patch(`${API_BASE}/admin/analysis-flows/${flowId}`, {
        is_active: isActive
      })
      return response.data
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('analysis-flows')
      },
      onError: (error: unknown) => {
        console.error('Failed to update analysis flow:', error)
        addError(`Failed to update analysis flow: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  )

  const handleToggleFlow = (flowId: string, currentStatus: boolean) => {
    toggleFlowMutation.mutate({ flowId, isActive: !currentStatus })
  }

  const handleRowClick = (flow: AnalysisFlow) => {
    setSelectedFlow(flow)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedFlow(null)
  }

  if (isLoading) {
    return (
      <AdminLayout title="Analysis Flows">
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner />
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout title="Analysis Flows">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                Failed to load analysis flows. Please try again.
              </div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Analysis Flows">
      <div className="space-y-6">
        {/* Error Display */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-medium text-red-800">Errors</h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <button
                onClick={() => setErrors([])}
                className="text-red-400 hover:text-red-600"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Analysis Flows Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Analysis Flows ({analysisFlows?.length || 0})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage image analysis flows and conversations
            </p>
          </div>
          
          {analysisFlows && analysisFlows.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flow
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Images
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {analysisFlows.map((flow) => (
                    <tr 
                      key={flow.id} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleRowClick(flow)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {flow.id.substring(0, 8)}...
                          </div>
                          <div className="text-sm text-gray-500">
                            Session: {flow.session_id.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          {/* Original Image Thumbnail */}
                          <div className="flex flex-col items-center space-y-1">
                            {imageThumbnails[flow.original_image_id] ? (
                              <img
                                src={imageThumbnails[flow.original_image_id]}
                                alt="Original"
                                className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                                <ImageIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                            <span className="text-xs text-gray-500">Original</span>
                          </div>
                          
                          {/* Final Image Thumbnail */}
                          {flow.final_image_id && (
                            <div className="flex flex-col items-center space-y-1">
                              {imageThumbnails[flow.final_image_id] ? (
                                <img
                                  src={imageThumbnails[flow.final_image_id]}
                                  alt="Final"
                                  className="w-12 h-12 object-cover rounded-lg border border-green-200"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-green-50 rounded-lg border border-green-200 flex items-center justify-center">
                                  <ImageIcon className="w-4 h-4 text-green-500" />
                                </div>
                              )}
                              <span className="text-xs text-green-600">Final</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">
                              {flow.total_questions || 0}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500">
                            / {flow.total_answers || 0} answered
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          flow.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {flow.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(flow.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(flow.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleFlow(flow.id, flow.is_active)
                            }}
                            disabled={toggleFlowMutation.isLoading}
                            className={`inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded ${
                              flow.is_active
                                ? 'text-red-700 bg-red-100 hover:bg-red-200'
                                : 'text-green-700 bg-green-100 hover:bg-green-200'
                            } disabled:opacity-50`}
                          >
                            {toggleFlowMutation.isLoading ? (
                              'Updating...'
                            ) : flow.is_active ? (
                              <>
                                <ToggleLeft className="w-3 h-3 mr-1" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-3 h-3 mr-1" />
                                Activate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500">
                <p className="text-lg font-medium">No analysis flows found</p>
                <p className="mt-1">Upload an image to create your first analysis flow.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <AnalysisFlowModal
        analysisFlow={selectedFlow}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </AdminLayout>
  )
}
