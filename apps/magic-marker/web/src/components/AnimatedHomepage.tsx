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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const steps = [
    {
      id: 1,
      image: '/step-1-upload.png',
      title: 'Upload Your Image',
      description: 'Drag and drop or click to upload any image',
      hint: 'Scroll down to continue',
      bgGradient: 'from-slate-900 via-blue-900 to-indigo-900',
      bgColor: 'bg-blue-600'
    },
    {
      id: 2,
      image: '/step-2-questions.png',
      title: 'Answer Questions',
      description: 'AI analyzes your image and asks relevant questions',
      hint: 'Keep scrolling',
      bgGradient: 'from-slate-900 via-blue-900 to-indigo-900',
      bgColor: 'bg-blue-600'
    },
    {
      id: 3,
      image: '/step-3-result.png',
      title: 'Get Your Result',
      description: 'Receive a new AI-generated image based on your answers',
      hint: 'Tap to start',
      bgGradient: 'from-slate-900 via-blue-900 to-indigo-900',
      bgColor: 'bg-blue-600'
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
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
      
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
            className={`fixed inset-0 transition-all duration-700 ease-in-out bg-gradient-to-br ${step.bgGradient} ${
              index === currentStep 
                ? 'opacity-100 scale-100' 
                : index < currentStep 
                  ? 'opacity-0 scale-95 -translate-y-full' 
                  : 'opacity-0 scale-105 translate-y-full'
            }`}
            style={{ 
              zIndex: steps.length - index,
              width: '100vw',
              height: '100vh'
            }}
          >
            <div className="relative w-full h-full">
              <Image
                src={step.image}
                alt={step.title}
                fill
                className="object-contain"
                priority={index === 0}
                sizes="100vw"
              />
              
              {/* Overlay with content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="text-white space-y-4">
                  {/* Hint or action button */}
                  {index === steps.length - 1 ? (
                    <div className="flex justify-center">
                      <button
                        onClick={handleCameraClick}
                        className="group relative w-24 h-24 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center"
                      >
                        {/* Inner glow effect */}
                        <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                        
                        {/* Camera icon */}
                        <div className="relative z-10 text-white">
                          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5M7.43 4.69L8.5 2H15.5L16.57 4.69C16.84 5.33 17.45 5.75 18.15 5.75H20A2 2 0 0 1 22 7.75V18.25A2 2 0 0 1 20 20.25H4A2 2 0 0 1 2 18.25V7.75A2 2 0 0 1 4 5.75H5.85C6.55 5.75 7.16 5.33 7.43 4.69Z" />
                          </svg>
                        </div>
                        
                        {/* Pulse animation */}
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 animate-ping opacity-20"></div>
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      {/* Down arrow hint */}
                      <div className="w-6 h-6 border-r-2 border-b-2 border-white/80 rotate-45 animate-pulse"></div>
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="group cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 200}ms` }}
              onClick={() => handleStepClick(index)}
            >
              <div className={`relative overflow-hidden rounded-2xl shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:shadow-3xl bg-gradient-to-br ${step.bgGradient}`}>
                <div className="aspect-[4/5] relative">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-110"
                    priority={index === 0}
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                    {index === steps.length - 1 && (
                      <div className="flex justify-center">
                        <button className="group relative w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center">
                          {/* Inner glow effect */}
                          <div className="absolute inset-2 bg-gradient-to-br from-white/20 to-transparent rounded-full"></div>
                          
                          {/* Camera icon */}
                          <div className="relative z-10 text-white">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5M7.43 4.69L8.5 2H15.5L16.57 4.69C16.84 5.33 17.45 5.75 18.15 5.75H20A2 2 0 0 1 22 7.75V18.25A2 2 0 0 1 20 20.25H4A2 2 0 0 1 2 18.25V7.75A2 2 0 0 1 4 5.75H5.85C6.55 5.75 7.16 5.33 7.43 4.69Z" />
                            </svg>
                          </div>
                          
                          {/* Pulse animation */}
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 animate-ping opacity-20"></div>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Step number */}
              <div className="flex justify-center mt-4">
                <div className={`w-12 h-12 ${step.bgColor} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
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
            className="group relative bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-12 py-4 rounded-full font-bold text-xl shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 flex items-center justify-center mx-auto"
          >
            {/* Inner glow effect */}
            <div className="absolute inset-1 bg-gradient-to-r from-white/20 to-transparent rounded-full"></div>
            
            {/* Content */}
            <div className="relative z-10 flex items-center space-x-3">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5M7.43 4.69L8.5 2H15.5L16.57 4.69C16.84 5.33 17.45 5.75 18.15 5.75H20A2 2 0 0 1 22 7.75V18.25A2 2 0 0 1 20 20.25H4A2 2 0 0 1 2 18.25V7.75A2 2 0 0 1 4 5.75H5.85C6.55 5.75 7.16 5.33 7.43 4.69Z" />
              </svg>
              <span>Start Now</span>
            </div>
            
            {/* Pulse animation */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 animate-ping opacity-20"></div>
          </button>
        </div>
      </div>
    </div>
  )
}
