'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import LoadingSpinner from '@/components/LoadingSpinner'

interface Conversation {
  id: string
  image_id: string
  session_id: string
  conversation_state: {
    currentQuestionIndex: number
    totalQuestions: number
    questions: Array<{
      id: string
      text: string
      options: string[]
      answer?: string
      context?: {
        reasoning: string
        builds_on: string
        artistic_focus: string
      }
    }>
    contextData: {
      imageAnalysis: string
      previousAnswers: string[]
      artisticDirection: string
    }
  }
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ProcessingStep {
  id: string
  image_id: string
  step_type: string
  step_order: number
  input_data: any
  output_data: any
  response_time_ms: number
  model_used: string
  success: boolean
  error_message?: string
  created_at: string
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [isLoadingSteps, setIsLoadingSteps] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'steps'>('overview')

  useEffect(() => {
    fetchConversations()
  }, [])

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/conversations')
      if (!response.ok) {
        throw new Error('Failed to fetch conversations')
      }
      const data = await response.json()
      setConversations(data)
    } catch (err) {
      console.error('Error fetching conversations:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  const fetchProcessingSteps = async (imageId: string) => {
    try {
      setIsLoadingSteps(true)
      const response = await fetch(`/api/admin/steps?image_id=${imageId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch processing steps')
      }
      const data = await response.json()
      setProcessingSteps(data.steps || [])
    } catch (err) {
      console.error('Error fetching processing steps:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch processing steps')
    } finally {
      setIsLoadingSteps(false)
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation)
    setActiveTab('overview')
    fetchProcessingSteps(conversation.image_id)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <AdminLayout title="Conversations">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout title="Conversations">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conversations</h1>
            <p className="text-gray-600">View and manage conversational question flows</p>
          </div>
          <button
            onClick={fetchConversations}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{conversations.length}</div>
            <div className="text-sm text-gray-600">Total Conversations</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {conversations.filter(c => c.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {conversations.filter(c => !c.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {conversations.reduce((sum, c) => sum + c.conversation_state.totalQuestions, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
        </div>

        {/* Conversations List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              All Conversations
            </h3>
            
            {conversations.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">No conversations found</div>
                <p className="mt-2 text-gray-400">Start using conversational questions to see data here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleConversationSelect(conversation)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            Image: {conversation.image_id.substring(0, 8)}...
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(conversation.is_active)}`}>
                            {conversation.is_active ? 'Active' : 'Completed'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          Session: {conversation.session_id.substring(0, 16)}...
                        </div>
                        
                        <div className="text-sm text-gray-500">
                          Questions: {conversation.conversation_state.totalQuestions} • 
                          Created: {formatDate(conversation.created_at)}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {conversation.conversation_state.questions.filter(q => q.answer).length} answered
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Detail Modal */}
        {selectedConversation && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Conversation Details
                  </h3>
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 mb-6">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'overview'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('steps')}
                      className={`py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === 'steps'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      Processing Steps ({processingSteps.length})
                    </button>
                  </nav>
                </div>
                
                {/* Tab Content */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                        <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Image Analysis
                      </h4>
                      <p className="text-gray-700 leading-relaxed">
                        {selectedConversation.conversation_state.contextData.imageAnalysis}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-lg mb-4 flex items-center">
                        <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Questions & Answers
                      </h4>
                      <div className="space-y-4">
                        {selectedConversation.conversation_state.questions.map((q, index) => (
                          <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <div className="font-semibold text-gray-900 mb-2">
                              Q{index + 1}: {q.text}
                            </div>
                            <div className="text-sm text-gray-700 mb-2">
                              <span className="font-medium">Answer:</span> {q.answer || 'Not answered'}
                            </div>
                            {q.context && (
                              <div className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded border">
                                <div><span className="font-medium">Reasoning:</span> {q.context.reasoning}</div>
                                <div><span className="font-medium">Builds on:</span> {q.context.builds_on}</div>
                                <div><span className="font-medium">Focus:</span> {q.context.artistic_focus}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                      <h4 className="font-semibold text-gray-900 text-lg mb-3 flex items-center">
                        <svg className="h-5 w-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                        </svg>
                        Artistic Direction
                      </h4>
                      <p className="text-gray-700">
                        {selectedConversation.conversation_state.contextData.artisticDirection || 'Not set'}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'steps' && (
                  <div className="space-y-4">
                    {isLoadingSteps ? (
                      <div className="flex justify-center py-8">
                        <LoadingSpinner />
                      </div>
                    ) : processingSteps.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-500 text-lg">No processing steps found</div>
                        <p className="mt-2 text-gray-400">Processing steps will appear here as the AI pipeline runs</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {processingSteps
                          .sort((a, b) => a.step_order - b.step_order)
                          .map((step, index) => (
                            <div key={step.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900 text-lg">
                                    Step {step.step_order}: {step.step_type.replace(/_/g, ' ').toUpperCase()}
                                  </h4>
                                  <div className="text-sm text-gray-600 mt-1 space-y-1">
                                    <div className="flex items-center space-x-4">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {step.model_used}
                                      </span>
                                      <span className="text-gray-500">
                                        {step.response_time_ms}ms
                                      </span>
                                      <span className="text-gray-500">
                                        {formatDate(step.created_at)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className={`px-3 py-1 text-xs font-semibold rounded-full ${
                                  step.success 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {step.success ? 'Success' : 'Failed'}
                                </div>
                              </div>

                              {!step.success && step.error_message && (
                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                  <div className="flex items-start space-x-2">
                                    <div className="flex-shrink-0">
                                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                      </svg>
                                    </div>
                                    <div className="text-sm text-red-800">
                                      <strong className="font-semibold">Error:</strong> {step.error_message}
                                    </div>
                                  </div>
                                </div>
                              )}

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Input Data
                                  </h5>
                                  <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                    {JSON.stringify(step.input_data, null, 2)}
                                  </pre>
                                </div>
                                <div>
                                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                    <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Output Data
                                  </h5>
                                  <pre className="text-xs text-gray-800 bg-gray-50 p-4 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                                    {step.output_data ? JSON.stringify(step.output_data, null, 2) : 'No output data'}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
