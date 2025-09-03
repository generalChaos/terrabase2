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

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate that all required questions are answered
    const requiredQuestions = questions.filter(q => q.required)
    const missingAnswers = requiredQuestions.filter(q => !answers[q.id]?.trim())
    
    if (missingAnswers.length > 0) {
      alert(`Please answer all required questions: ${missingAnswers.map(q => q.text).join(', ')}`)
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
