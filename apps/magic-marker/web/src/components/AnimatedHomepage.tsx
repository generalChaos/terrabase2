'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'

interface AnimatedHomepageProps {
  onStartUpload: () => void
}

export default function AnimatedHomepage({ onStartUpload }: AnimatedHomepageProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  const steps = [
    {
      id: 1,
      image: '/ChatGPT Image Sep 3, 2025, 02_28_03 PM.png',
      title: 'Upload Your Image',
      description: 'Drag and drop or click to upload any image',
      hint: 'Scroll down to continue'
    },
    {
      id: 2,
      image: '/ChatGPT Image Sep 3, 2025, 02_28_11 PM.png',
      title: 'Answer Questions',
      description: 'AI analyzes your image and asks relevant questions',
      hint: 'Keep scrolling'
    },
    {
      id: 3,
      image: '/ChatGPT Image Sep 3, 2025, 02_28_16 PM.png',
      title: 'Get Your Result',
      description: 'Receive a new AI-generated image based on your answers',
      hint: 'Tap to start'
    }
  ]

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (isScrolling) return
      
      setIsScrolling(true)
      clearTimeout(scrollTimeoutRef.current)
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false)
      }, 150)

      if (isMobile) {
        const scrollY = window.scrollY
        const windowHeight = window.innerHeight
        const threshold = windowHeight * 0.3 // 30% threshold for smoother transitions
        const step = Math.floor((scrollY + threshold) / windowHeight)
        const newStep = Math.min(Math.max(step, 0), steps.length - 1)
        
        if (newStep !== currentStep) {
          setCurrentStep(newStep)
          // Add haptic feedback on mobile devices
          if ('vibrate' in navigator) {
            navigator.vibrate(50)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [currentStep, isMobile, isScrolling])

  const handleStepClick = (stepIndex: number) => {
    if (stepIndex === steps.length - 1) {
      // Last step - trigger camera/upload
      onStartUpload()
    } else if (isMobile) {
      // Scroll to next step
      const nextStep = stepIndex + 1
      const targetY = nextStep * window.innerHeight
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }
  }

  const handleCameraClick = () => {
    onStartUpload()
  }

  if (isMobile) {
    return (
      <div className="relative">
        {/* Mobile: Full-screen steps with scroll animation */}
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`fixed inset-0 transition-all duration-700 ease-in-out ${
              index === currentStep 
                ? 'opacity-100 scale-100' 
                : index < currentStep 
                  ? 'opacity-0 scale-95 -translate-y-full' 
                  : 'opacity-0 scale-105 translate-y-full'
            }`}
            style={{ zIndex: steps.length - index }}
          >
            <div className="relative w-full h-full">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              
              {/* Overlay with content */}
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-6">
                <div className="text-white space-y-4">
                  <h2 className="text-3xl font-bold drop-shadow-lg">
                    {step.title}
                  </h2>
                  <p className="text-lg drop-shadow-md">
                    {step.description}
                  </p>
                  
                  {/* Progress indicator */}
                  <div className="flex space-x-2">
                    {steps.map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          i <= currentStep ? 'bg-white' : 'bg-white/30'
                        }`}
                        style={{ width: `${100 / steps.length}%` }}
                      />
                    ))}
                  </div>
                  
                  {/* Hint or action button */}
                  {index === steps.length - 1 ? (
                    <button
                      onClick={handleCameraClick}
                      className="mt-6 bg-white text-black px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      📸 Start Creating
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm opacity-80 animate-bounce">
                        {step.hint}
                      </p>
                      {/* Subtle arrow hint */}
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-r-2 border-b-2 border-white/60 rotate-45 animate-pulse"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Spacer to enable scrolling */}
        <div style={{ height: `${steps.length * 100}vh` }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Desktop: Horizontal flow */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">
            Magic Marker
          </h1>
          <p className="text-xl text-white/90 drop-shadow-md">
            Transform your images with AI-powered creativity
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 200}ms` }}
              onClick={() => handleStepClick(index)}
            >
              <div className="relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl">
                <div className="aspect-[4/5] relative">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    priority={index === 0}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-2xl font-bold mb-2 drop-shadow-lg">
                      {step.title}
                    </h3>
                    <p className="text-white/90 drop-shadow-md">
                      {step.description}
                    </p>
                    
                    {index === steps.length - 1 && (
                      <button className="mt-4 bg-white text-black px-6 py-3 rounded-full font-semibold shadow-lg hover:bg-gray-100 transition-colors duration-200">
                        Start Creating
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Step number */}
              <div className="flex justify-center mt-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {step.id}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="text-center mt-16">
          <button
            onClick={onStartUpload}
            className="bg-white text-black px-12 py-4 rounded-full font-bold text-xl shadow-2xl hover:bg-gray-100 transition-all duration-300 hover:scale-105"
          >
            🎨 Start Your Journey
          </button>
        </div>
      </div>
    </div>
  )
}
