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

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

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
                    onClick={() => setSelectedConversation(conversation)}
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
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
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
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Image Analysis</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedConversation.conversation_state.contextData.imageAnalysis}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Questions & Answers</h4>
                    <div className="space-y-3 mt-2">
                      {selectedConversation.conversation_state.questions.map((q, index) => (
                        <div key={q.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="font-medium text-sm text-gray-900">
                            Q{index + 1}: {q.text}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Answer: {q.answer || 'Not answered'}
                          </div>
                          {q.context && (
                            <div className="text-xs text-gray-500 mt-1">
                              <div>Reasoning: {q.context.reasoning}</div>
                              <div>Builds on: {q.context.builds_on}</div>
                              <div>Focus: {q.context.artistic_focus}</div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900">Artistic Direction</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedConversation.conversation_state.contextData.artisticDirection || 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
