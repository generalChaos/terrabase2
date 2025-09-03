import React from 'react'
import { ImageAnalysis } from '@/lib/types'

interface ImageModalProps {
  image: ImageAnalysis
  isOpen: boolean
  onClose: () => void
}

const ImageModal: React.FC<ImageModalProps> = ({ image, isOpen, onClose }) => {
  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/20">
          <h2 className="text-2xl font-bold text-white">Image Details</h2>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Images Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Original Image */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Original Image</h3>
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                <img
                  src={image.originalImagePath}
                  alt="Original"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            </div>

            {/* Generated Image */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Generated Image</h3>
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {image.finalImagePath ? (
                  <img
                    src={image.finalImagePath}
                    alt="Generated"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/60">
                    <div className="text-center">
                      <div className="text-4xl mb-2">🎨</div>
                      <p>No generated image yet</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Analysis Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">AI Analysis</h3>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <p className="text-white/90 leading-relaxed">{image.analysisResult}</p>
            </div>
          </div>

          {/* Questions and Answers Section */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Questions & Answers</h3>
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              {image.answers ? (
                <div className="space-y-4">
                  {image.questions.map((question, index) => {
                    const answer = image.answers?.find(a => a.questionId === question.id);
                    return (
                      <div key={question.id} className="border-b border-white/20 pb-4 last:border-b-0">
                        <h4 className="text-white font-medium mb-2">Q{index + 1}: {question.text}</h4>
                        <div className="ml-4">
                          <p className="text-white/80 text-sm mb-2">Options:</p>
                          <div className="grid grid-cols-1 gap-1 mb-2">
                            {question.options.map((option, optIndex) => (
                              <div 
                                key={optIndex}
                                className={`text-sm p-2 rounded ${
                                  answer?.answer === option
                                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                    : 'text-white/60'
                                }`}
                              >
                                {option}
                              </div>
                            ))}
                          </div>
                          <p className="text-white/90 text-sm">
                            <span className="font-medium">Selected:</span> {answer?.answer || 'No answer'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">❓</div>
                  <p className="text-white/60">No answers recorded yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h4 className="text-white font-medium mb-2">Created</h4>
              <p className="text-white/80 text-sm">
                {new Date(image.createdAt).toLocaleDateString()}
              </p>
              <p className="text-white/60 text-xs">
                {new Date(image.createdAt).toLocaleTimeString()}
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h4 className="text-white font-medium mb-2">Questions</h4>
              <p className="text-white/80 text-2xl font-bold">
                {image.questions.length}
              </p>
            </div>
            
            <div className="bg-white/10 rounded-lg p-4 border border-white/20">
              <h4 className="text-white font-medium mb-2">Status</h4>
              <div className="flex items-center space-x-2">
                {image.finalImagePath ? (
                  <>
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-400 text-sm">Completed</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-yellow-400 text-sm">Pending</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImageModal
