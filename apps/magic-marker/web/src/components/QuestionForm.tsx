import React, { useState } from 'react'
import { Question, QuestionAnswer } from '@/lib/types'

interface QuestionFormProps {
  questions: Question[]
  onSubmit: (answers: QuestionAnswer[]) => void
  onReset: () => void
  isLoading: boolean
}

const QuestionForm: React.FC<QuestionFormProps> = ({
  questions,
  onSubmit,
  onReset,
  isLoading
}) => {
  const [answers, setAnswers] = useState<{ [key: string]: string }>({})
  const [error, setError] = useState<string | null>(null)

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
    setError(null) // Clear error when user starts answering
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that all required questions are answered
    const requiredQuestions = questions.filter(q => q.required)
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id]?.trim())
    
    if (missingAnswers.length > 0) {
      setError(`Please answer all required questions: ${missingAnswers.map(q => q.text).join(', ')}`)
      return
    }

    const questionAnswers: QuestionAnswer[] = questions.map(q => ({
      questionId: q.id,
      answer: answers[q.id] || ''
    }))

    onSubmit(questionAnswers)
  }

  const handleReset = () => {
    setAnswers({})
    onReset()
  }

  const isFormValid = () => {
    const requiredQuestions = questions.filter(q => q.required)
    return requiredQuestions.every(q => answers[q.id]?.trim())
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">
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

      <p className="text-gray-600 mb-6">
        AI has analyzed your image and generated {questions.length} questions. 
        Please answer them to help create your new image.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2 text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Question {index + 1}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <p className="text-gray-900 font-medium">{question.text}</p>
            
            {question.type === 'multiple_choice' && question.options && (
              <div className="space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={question.id}
                      value={option}
                      checked={answers[question.id] === option}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      required={question.required}
                      disabled={isLoading}
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        <div className="flex justify-end space-x-4 pt-6 border-t">
          <button
            type="button"
            onClick={handleReset}
            className="btn-secondary"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!isFormValid() || isLoading}
          >
            {isLoading ? 'Generating...' : 'Generate New Image'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default QuestionForm
