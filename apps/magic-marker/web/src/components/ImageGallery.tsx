import React, { useState } from 'react'
import { ImageAnalysis } from '@/lib/types'
import EnhancedImageModal from './EnhancedImageModal'

interface ImageGalleryProps {
  images: ImageAnalysis[]
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [selectedImage, setSelectedImage] = useState<ImageAnalysis | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (images.length === 0) {
    return null
  }

  const handleImageClick = (image: ImageAnalysis) => {
    setSelectedImage(image)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
  }

  return (
    <>
      <div className="card">
        <h2 className="text-2xl font-semibold text-white mb-4 drop-shadow-lg">
          Generated Images
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image) => (
            <div 
              key={image.id} 
              className="bg-white/10 backdrop-blur-sm rounded-lg p-4 space-y-3 cursor-pointer hover:bg-white/15 transition-all duration-200 border border-white/20 hover:border-white/30"
              onClick={() => handleImageClick(image)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleImageClick(image)
                }
              }}
            >
              {/* Show the final generated image prominently, or original if no final image */}
              <div className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                {image.finalImagePath ? (
                  <img
                    src={image.finalImagePath}
                    alt="Generated image - click to view details"
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => handleImageClick(image)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                ) : (
                  <img
                    src={image.originalImagePath}
                    alt="Original image - click to view details"
                    className="w-full h-full object-cover opacity-60 cursor-pointer"
                    onClick={() => handleImageClick(image)}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-white text-sm">
                    {image.finalImagePath ? 'Generated Image' : 'Original Image'}
                  </h3>
                  {image.finalImagePath && (
                    <span className="text-green-400 text-xs font-medium">✓ Complete</span>
                  )}
                </div>
                
                <div className="text-xs text-white/70 space-y-1">
                  <p>Questions: {image.questions.length}</p>
                  <p>Created: {new Date(image.createdAt).toLocaleDateString()}</p>
                </div>

                <div className="text-xs text-white/50 italic">
                  Click to view details
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enhanced Modal */}
      {selectedImage && (
        <EnhancedImageModal
          image={selectedImage}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  )
}

export default ImageGallery
