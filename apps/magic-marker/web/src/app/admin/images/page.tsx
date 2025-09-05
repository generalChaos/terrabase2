'use client'

import { useState } from 'react'
import { useQuery } from 'react-query'
import axios from 'axios'
import Link from 'next/link'
import { ImageAnalysis, Question, QuestionAnswer } from '@/lib/types'
import ImageGallery from '@/components/ImageGallery'
import LoadingSpinner from '@/components/LoadingSpinner'
import AdminLayout from '@/components/AdminLayout'

const API_BASE = '/api'

interface ApiImageResponse {
  id: string
  originalImagePath: string
  analysisResult: string
  questions: Question[]
  answers?: QuestionAnswer[]
  finalImagePath?: string
  createdAt: string
  updatedAt: string
  // New fields from analysis flows
  sessionId?: string
  totalQuestions?: number
  totalAnswers?: number
  currentStep?: string
  totalCostUsd?: number
  totalTokens?: number
  isActive?: boolean
}

export default function AdminImagesPage() {
  const [errors, setErrors] = useState<string[]>([])

  const addError = (error: string) => {
    setErrors(prev => [...prev, `${new Date().toLocaleTimeString()}: ${error}`])
  }

  // Fetch existing images
  const { data: images, isLoading: imagesLoading, error } = useQuery<ImageAnalysis[]>(
    'images',
    async () => {
      const response = await axios.get(`${API_BASE}/images`)
      // The API now returns the combined data structure directly
      return response.data.map((item: ApiImageResponse) => ({
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
    },
    {
      onError: (error: unknown) => {
        console.error('Failed to load images:', error)
        addError(`Failed to load images: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  )

  if (imagesLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  Failed to load images. Please try again.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout 
      title="Image Gallery" 
      description="View and manage all generated images"
    >

        {/* Stats */}
        {images && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Total Images
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {images.length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Completed
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {images.filter(img => img.finalImagePath).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        In Progress
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {images.filter(img => !img.finalImagePath).length}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {images && images.length > 0 ? (
          <ImageGallery images={images} />
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No images</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by uploading an image from the main page.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Upload Image
              </Link>
            </div>
          </div>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mt-8">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Errors</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
    </AdminLayout>
  )
}
