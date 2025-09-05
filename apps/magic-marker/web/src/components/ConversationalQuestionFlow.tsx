import React, { useState, useEffect, useCallback } from 'react'
import { Question, QuestionAnswer } from '@/lib/types'
import { AnalysisFlowService } from '@/lib/analysisFlowService'
import { AnalysisFlow } from '@/lib/newTypes'
import { supabase } from '@/lib/supabase'

interface ConversationalQuestionFlowProps {
  imageId: string
  imageAnalysis: string
  originalImagePath?: string
  onSubmit: (answers: QuestionAnswer[]) => void
  onReset: () => void
  onSkip?: () => void
  isLoading: boolean
}

const ConversationalQuestionFlow: React.FC<ConversationalQuestionFlowProps> = ({
  imageId,
  imageAnalysis,
  originalImagePath,
  onSubmit,
  onReset,
  onSkip,
  isLoading
}) => {
  const [analysisFlow, setAnalysisFlow] = useState<AnalysisFlow | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false)
  const [sessionId] = useState(() => AnalysisFlowService.generateSessionId())
  const [error, setError] = useState<string | null>(null)
  const [isConversationComplete, setIsConversationComplete] = useState(false)


  const finishConversation = useCallback(async (flow: AnalysisFlow) => {
    console.log('🏁 [ConversationalQuestionFlow] Finishing analysis flow...', {
      flowId: flow.id,
      questionsCount: flow.questions.length,
      answeredQuestions: flow.answers.length
    });

    try {
      // Don't deactivate the flow yet - let image generation complete first
      console.log('🔚 [ConversationalQuestionFlow] Conversation complete, keeping flow active for image generation...');
      
      // Convert to QuestionAnswer format
      const questionAnswers: QuestionAnswer[] = flow.answers;

      console.log('📊 [ConversationalQuestionFlow] Question answers prepared:', {
        count: questionAnswers.length,
        answers: questionAnswers.map(qa => ({ questionId: qa.questionId, answer: qa.answer }))
      });

      // Call onSubmit with the answers
      console.log('🎉 [ConversationalQuestionFlow] Conversation completed successfully!');
      onSubmit(questionAnswers)
    } catch (err) {
      console.error('❌ [ConversationalQuestionFlow] Failed to finish conversation:', err)
      setError('Failed to complete conversation. Please try again.')
    }
  }, [onSubmit])

  const generateNextQuestion = useCallback(async (flow: AnalysisFlow) => {
    console.log('🔄 [ConversationalQuestionFlow] Generating next question for conversation:', {
      conversationId: flow.id,
      currentQuestionsCount: flow.questions.length,
      totalQuestions: flow.total_questions
    });

    try {
      setIsGeneratingQuestion(true)
      setError(null)
      
      const previousAnswers = flow.answers.map((a: QuestionAnswer) => a.answer)
      console.log('📝 [ConversationalQuestionFlow] Previous answers:', previousAnswers);

      console.log('🤖 [ConversationalQuestionFlow] Calling API for conversational question...');
      const response = await fetch('/api/conversational-question', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageAnalysis,
          previousAnswers,
          conversationContext: {
            questions: flow.questions as Question[],
            artisticDirection: String(flow.context_data?.artisticDirection || ''),
            previousAnswers: previousAnswers
          },
          imageId,
          flowId: flow.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to generate question')
      }

      const { question, context, questions, done, summary } = await response.json()

      console.log('✅ [ConversationalQuestionFlow] AI response received:', {
        done,
        hasQuestion: !!question,
        questionsCount: questions.length,
        hasSummary: !!summary
      });

      if (done) {
        console.log('🏁 [ConversationalQuestionFlow] AI says conversation is done, finishing...');
        // AI decided the conversation is complete
        setIsConversationComplete(true)
        await finishConversation(flow)
        return
      }

      if (!question) {
        console.error('❌ [ConversationalQuestionFlow] AI returned done=false but no question');
        setError('Failed to generate question. Please try again.')
        return
      }

      console.log('✅ [ConversationalQuestionFlow] Question generated:', {
        questionId: question.id,
        questionText: question.text.substring(0, 50) + '...',
        optionsCount: question.options.length
      });

      // Add question to conversation
      console.log('💾 [ConversationalQuestionFlow] Adding question to conversation...');
      const updatedConversation = await AnalysisFlowService.addQuestion(
        flow.id,
        question
      )

      console.log('✅ [ConversationalQuestionFlow] Question added to conversation:', {
        newQuestionsCount: updatedConversation.questions.length
      });

      setAnalysisFlow(updatedConversation)
      setCurrentQuestion(question)
      setSelectedAnswer('')
    } catch (err) {
      console.error('❌ [ConversationalQuestionFlow] Failed to generate question:', err)
      setError('Failed to generate question. Please try again.')
    } finally {
      setIsGeneratingQuestion(false)
    }
  }, [imageAnalysis, imageId, finishConversation])

  // Initialize conversation
  useEffect(() => {
    const initializeConversation = async () => {
      console.log('🚀 [ConversationalQuestionFlow] Initializing conversation...', {
        imageId: imageId.substring(0, 8) + '...',
        sessionId: sessionId.substring(0, 8) + '...',
        imageAnalysisLength: imageAnalysis.length
      });

      try {
        setIsGeneratingQuestion(true)
        
        // First, check if the image exists in the database with retry mechanism
        console.log('🔍 [ConversationalQuestionFlow] Checking if image exists in database...');
        
        let imageData = null;
        let imageError = null;
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 1000; // 1 second

        while (retryCount < maxRetries) {
          const { data, error } = await supabase
            .from('images')
            .select('id')
            .eq('id', imageId)
            .single();

          imageData = data;
          imageError = error;

          if (imageData && !imageError) {
            console.log(`✅ [ConversationalQuestionFlow] Image ${imageId} exists in database (attempt ${retryCount + 1})`);
            break;
          }

          if (imageError && imageError.code !== 'PGRST116') {
            // PGRST116 is "not found", other errors are real errors
            console.error(`❌ [ConversationalQuestionFlow] Database error (attempt ${retryCount + 1}):`, imageError);
            break;
          }

          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`⏳ [ConversationalQuestionFlow] Image not found, retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }

        if (imageError || !imageData) {
          console.error(`❌ [ConversationalQuestionFlow] Image ${imageId} not found in database after ${maxRetries} attempts:`, imageError);
          setError('Image not found in database. This might be a temporary issue. Please try refreshing the page.');
          return;
        }
        
        // Check if there's already an active conversation
        console.log('🔍 [ConversationalQuestionFlow] Checking for existing conversation...');
        let activeConversation = await AnalysisFlowService.getActiveAnalysisFlow(imageId)
        
        if (!activeConversation) {
          console.log('📝 [ConversationalQuestionFlow] No existing conversation, creating new one...');
          // Create new conversation
          activeConversation = await AnalysisFlowService.createAnalysisFlow(
            imageId,
            sessionId,
            imageAnalysis
          )
        } else {
          console.log('♻️ [ConversationalQuestionFlow] Found existing conversation, resuming...');
        }
        
        setAnalysisFlow(activeConversation)
        
        // Generate first question
        console.log('❓ [ConversationalQuestionFlow] Generating first question...');
        await generateNextQuestion(activeConversation)
      } catch (err) {
        console.error('❌ [ConversationalQuestionFlow] Failed to initialize conversation:', err)
        setError('Failed to start conversation. Please try again.')
      } finally {
        setIsGeneratingQuestion(false)
      }
    }

    initializeConversation()
  }, [imageId, imageAnalysis, sessionId, generateNextQuestion])

  const handleAnswerSelect = (answer: string) => {
    setSelectedAnswer(answer)
  }

  const handleNext = async () => {
    console.log('➡️ [ConversationalQuestionFlow] Handling next button click...', {
      hasConversation: !!analysisFlow,
      hasCurrentQuestion: !!currentQuestion,
      hasSelectedAnswer: !!selectedAnswer,
      selectedAnswer: selectedAnswer,
      isConversationComplete
    });

    if (!analysisFlow || !currentQuestion || !selectedAnswer) {
      console.log('⚠️ [ConversationalQuestionFlow] Missing required data, cannot proceed');
      return
    }

    // If conversation is already complete, just finish it
    if (isConversationComplete) {
      console.log('🏁 [ConversationalQuestionFlow] Conversation already complete, finishing...');
      await finishConversation(analysisFlow)
      return
    }

    try {
      console.log('💾 [ConversationalQuestionFlow] Adding answer to conversation...', {
        conversationId: analysisFlow.id,
        questionId: currentQuestion.id,
        answer: selectedAnswer
      });

      // Add answer to conversation
      const updatedConversation = await AnalysisFlowService.addAnswer(
        analysisFlow.id,
        currentQuestion.id,
        selectedAnswer
      )
      
      setAnalysisFlow(updatedConversation)
      
      console.log('✅ [ConversationalQuestionFlow] Answer added:', {
        questionsCount: updatedConversation.questions.length,
        totalQuestions: updatedConversation.total_questions
      });
      
      // Check if we should generate another question or finish
      const totalQuestions = updatedConversation.total_questions
      const maxQuestions = 10 // Safety limit - AI can finish earlier
      
      if (totalQuestions < maxQuestions) {
        console.log('🔄 [ConversationalQuestionFlow] Generating next question...');
        // Generate next question and check if AI says we're done
        await generateNextQuestion(updatedConversation)
      } else {
        console.log('🏁 [ConversationalQuestionFlow] Reached max questions, finishing conversation...');
        // Finish conversation and submit
        await finishConversation(updatedConversation)
      }
    } catch (err) {
      console.error('❌ [ConversationalQuestionFlow] Failed to process answer:', err)
      setError('Failed to process answer. Please try again.')
    }
  }


  const handleReset = async () => {
    if (analysisFlow) {
      try {
        await AnalysisFlowService.endAnalysisFlow(analysisFlow.id)
      } catch (err) {
        console.warn('Failed to end conversation:', err)
      }
    }
    onReset()
  }

  // Calculate progress based on conversation state
  const progress = analysisFlow 
    ? isConversationComplete 
      ? 100 
      : Math.min((analysisFlow.total_questions / 8) * 100, 90) // Cap at 90% until complete
    : 0

  if (isGeneratingQuestion && !currentQuestion) {
    return (
      <div className="card">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
          <p className="text-white text-lg">Starting conversation...</p>
        </div>
      </div>
    )
  }

  if (error) {
    const isImageNotFoundError = error.includes('Image not found in database')
    
    return (
      <div className="card">
        <div className="text-center py-8">
          <div className="text-red-400 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-white text-lg mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isImageNotFoundError && (
              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Page
              </button>
            )}
            {onSkip && (
              <button
                onClick={onSkip}
                className="btn-primary"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Skip to Next Step
              </button>
            )}
            <button
              onClick={handleReset}
              className="btn-secondary"
            >
              Start Over
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-white text-lg">No question available</p>
          <button
            onClick={handleReset}
            className="btn-primary mt-4"
          >
            Start Over
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-white drop-shadow-lg">
          Conversational Questions
        </h2>
        <button
          onClick={handleReset}
          className="btn-secondary"
          disabled={isLoading || isGeneratingQuestion}
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
          <span>
            {isConversationComplete 
              ? 'Conversation Complete' 
              : `Question ${analysisFlow?.total_questions || 0}${isConversationComplete ? '' : '+'}`
            }
          </span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-500 ease-out ${
              isConversationComplete 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Content */}
      <div className="min-h-[400px] flex flex-col">
        <div className="flex-1">
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
                  selectedAnswer === option
                    ? 'border-white bg-white/20 shadow-lg'
                    : 'border-white/30 bg-white/10 hover:border-white/50 hover:bg-white/15'
                }`}
              >
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={option}
                  checked={selectedAnswer === option}
                  onChange={(e) => handleAnswerSelect(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedAnswer === option
                    ? 'border-white bg-white'
                    : 'border-white/50'
                }`}>
                  {selectedAnswer === option && (
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
          <div className="flex space-x-2">
            {Array.from({ length: Math.min(analysisFlow?.total_questions || 0, 8) }, (_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  index < (analysisFlow?.total_questions || 0)
                    ? isConversationComplete 
                      ? 'bg-green-400' 
                      : 'bg-white/60'
                    : 'bg-white/20'
                }`}
              />
            ))}
            {!isConversationComplete && (analysisFlow?.total_questions || 0) < 8 && (
              <div className="w-3 h-3 rounded-full bg-white/10 animate-pulse" />
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={!selectedAnswer || isLoading || isGeneratingQuestion}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingQuestion ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </div>
            ) : isConversationComplete ? (
              isLoading ? 'Generating Image...' : 'Generate Image'
            ) : (
              'Next →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConversationalQuestionFlow
