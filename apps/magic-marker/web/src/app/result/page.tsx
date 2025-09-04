'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import LoadingSpinner from '@/components/LoadingSpinner'

function ResultContent() {
  const searchParams = useSearchParams()
  const [imageData, setImageData] = useState<{
    originalImagePath: string
    finalImagePath: string
    analysisResult: string
    questions: { text: string }[]
    answers: (string | { answer: string })[]
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageErrors, setImageErrors] = useState<{
    original: boolean
    final: boolean
  }>({ original: false, final: false })

  const imageId = searchParams.get('id')

  useEffect(() => {
    if (!imageId) {
      setError('No image ID provided')
      setLoading(false)
      return
    }

    // Fetch image data
    const fetchImageData = async () => {
      try {
        const response = await fetch(`/api/images/${imageId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch image data')
        }
        const data = await response.json()
        console.log('📸 Image data received:', data)
        console.log('🔗 Original image path:', data.original_image_path)
        console.log('🔗 Final image path:', data.final_image_path)
        console.log('🔗 Original image path type:', typeof data.original_image_path)
        console.log('🔗 Final image path type:', typeof data.final_image_path)
        console.log('🔗 Original image path length:', data.original_image_path?.length)
        console.log('🔗 Final image path length:', data.final_image_path?.length)
        setImageData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load image')
      } finally {
        setLoading(false)
      }
    }

    fetchImageData()
  }, [imageId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error || !imageData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-6 max-w-md">
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
              <p className="text-red-700 mb-4">{error || 'Image not found'}</p>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white drop-shadow-lg mb-4">
            Your Generated Image
          </h1>
                      <p className="text-white/90 text-lg drop-shadow-md">
              Here&apos;s your AI-generated image based on your answers
            </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Original Image */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">
              Original Image
            </h2>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md h-96">
                {!imageErrors.original && imageData.originalImagePath ? (
                  <div className="relative w-full max-w-md h-96">
                    <Image
                      src={imageData.originalImagePath}
                      alt="Original image"
                      fill
                      className="object-contain rounded-lg shadow-lg border-2 border-white/20"
                      unoptimized={imageData.originalImagePath?.includes('supabase') || false}
                      loader={({ src }) => src}
                      onError={(e) => {
                        console.error('Original image failed to load:', imageData.originalImagePath);
                        console.error('Image error:', e);
                        setImageErrors(prev => ({ ...prev, original: true }));
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg border-2 border-white/20">
                    <div className="text-center text-white/60">
                      <p className="text-lg font-medium">Image failed to load</p>
                      <p className="text-sm mt-2">URL: {imageData.originalImagePath}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Generated Image */}
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">
              Generated Image
            </h2>
            <div className="flex justify-center">
              <div className="relative w-full max-w-md h-96">
                {!imageErrors.final && imageData.finalImagePath ? (
                  <div className="relative w-full max-w-md h-96">
                    <Image
                      src={imageData.finalImagePath}
                      alt="Generated image"
                      fill
                      className="object-contain rounded-lg shadow-lg border-2 border-white/20"
                      unoptimized={imageData.finalImagePath?.includes('supabase') || false}
                      loader={({ src }) => src}
                      onError={(e) => {
                        console.error('Generated image failed to load:', imageData.finalImagePath);
                        console.error('Image error:', e);
                        setImageErrors(prev => ({ ...prev, final: true }));
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 rounded-lg border-2 border-white/20">
                    <div className="text-center text-white/60">
                      <p className="text-lg font-medium">Image failed to load</p>
                      <p className="text-sm mt-2">URL: {imageData.finalImagePath}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Analysis */}
        {imageData.analysisResult && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">
              Image Analysis
            </h2>
            <p className="text-white/90 leading-relaxed drop-shadow-md">
              {imageData.analysisResult}
            </p>
          </div>
        )}

        {/* Questions & Answers */}
        {imageData.questions && imageData.answers && (
          <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <h2 className="text-xl font-semibold text-white mb-4 drop-shadow-lg">
              Your Answers
            </h2>
            <div className="space-y-4">
              {imageData.questions.map((question: { text: string }, index: number) => {
                const answer = imageData.answers[index]
                return (
                  <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                    <h3 className="text-white font-medium mb-2 drop-shadow-md">
                      {question.text}
                    </h3>
                    <p className="text-white/80 drop-shadow-sm">
                      <span className="font-medium">Answer:</span> {typeof answer === 'object' ? answer.answer : answer}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Generate Another Image
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResultContent />
    </Suspense>
  )
}
