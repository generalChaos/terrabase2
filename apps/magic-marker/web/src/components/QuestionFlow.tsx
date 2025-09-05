import React, { useState } from 'react'
import { Question, QuestionAnswer } from '@/lib/types'

interface QuestionFlowProps {
  questions: Question[]
  originalImagePath?: string
  onSubmit: (answers: QuestionAnswer[]) => void
  onReset: () => void
  isLoading: boolean
}

const QuestionFlow: React.FC<QuestionFlowProps> = ({
  questions,
  originalImagePath,
  onSubmit,
  onReset,
  isLoading
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  const handleAnswerSelect = (answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }))
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev + 1)
        setIsTransitioning(false)
      }, 300)
    } else {
      // Submit all answers
      const questionAnswers: QuestionAnswer[] = questions.map(q => ({
        questionId: q.id,
        answer: answers[q.id] || ''
      }))
      onSubmit(questionAnswers)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setIsTransitioning(true)
      setTimeout(() => {
        setCurrentQuestionIndex(prev => prev - 1)
        setIsTransitioning(false)
      }, 300)
    }
  }

  const handleReset = () => {
    setCurrentQuestionIndex(0)
    setAnswers({})
    onReset()
  }

  const canProceed = answers[currentQuestion.id]?.trim()
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white drop-shadow-lg">
          Answer Questions
        </h2>
        <button
          onClick={handleReset}
          className="btn-secondary"
          disabled={isLoading}
        >
          Start Over
        </button>
      </div>

      {/* Original Image */}
      {originalImagePath && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-white mb-3 drop-shadow-lg">
            Original Image
          </h3>
          <div className="flex justify-center">
            <img
              src={originalImagePath}
              alt="Original image for analysis"
              className="max-w-full max-h-64 rounded-lg shadow-lg border-2 border-white/20"
            />
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-white/80 mb-2">
          <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="min-h-[400px] flex flex-col">
        <div 
          className={`flex-1 transition-all duration-300 ease-in-out ${
            isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
          }`}
        >
          <div className="mb-6">
            <h3 className="text-xl font-medium text-white mb-4 drop-shadow-lg">
              {currentQuestion.text}
            </h3>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => (
              <label 
                key={index} 
                className={`flex items-center space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  answers[currentQuestion.id] === option
                    ? 'border-white bg-white/20 shadow-lg'
                    : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/15'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={answers[currentQuestion.id] === option}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  answers[currentQuestion.id] === option
                    ? 'border-white bg-white'
                    : 'border-white/50'
                }`}>
                  {answers[currentQuestion.id] === option && (
                    <div className="w-2 h-2 bg-purple-600 rounded-full" />
                  )}
                </div>
                <span className="text-white font-medium">{option}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-white/20">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0 || isLoading}
            className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          <div className="flex space-x-2">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index === currentQuestionIndex
                    ? 'bg-white'
                    : index < currentQuestionIndex
                    ? 'bg-white/60'
                    : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            disabled={!canProceed || isLoading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLastQuestion ? (isLoading ? 'Generating...' : 'Generate Image') : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionFlow
