'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import LoadingSpinner from '@/components/LoadingSpinner'

// Collapsible component for schemas and constraints
const CollapsibleSection = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-gray-900">{title}</span>
        <svg
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  )
}

import { AnalysisFlow } from '@/lib/analysisFlowService'

interface ProcessingStep {
  id: string
  image_id: string
  step_type: string
  step_order: number
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  input_schema?: Record<string, unknown>
  output_schema?: Record<string, unknown>
  response_time_ms: number
  model_used: string
  success: boolean
  error_message?: string
  created_at: string
}

export default function AnalysisFlowsPage() {
  const [analysisFlows, setAnalysisFlows] = useState<AnalysisFlow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAnalysisFlow, setSelectedAnalysisFlow] = useState<AnalysisFlow | null>(null)
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([])
  const [isLoadingSteps, setIsLoadingSteps] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'steps'>('overview')

  useEffect(() => {
    fetchAnalysisFlows()
  }, [])

  const fetchAnalysisFlows = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/analysisFlows')
      if (!response.ok) {
        throw new Error('Failed to fetch analysisFlows')
      }
      const data = await response.json()
      setAnalysisFlows(data)
    } catch (err) {
      console.error('Error fetching analysisFlows:', err)
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

  const handleAnalysisFlowSelect = (conversation: AnalysisFlow) => {
    setSelectedAnalysisFlow(conversation)
    setActiveTab('overview')
    fetchProcessingSteps(conversation.image_id)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <AdminLayout title="Image Analysis Flows">
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
    <AdminLayout title="Image Analysis Flows">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Image Analysis Flows</h1>
            <p className="text-gray-600">View and manage conversational question flows</p>
          </div>
          <button
            onClick={fetchAnalysisFlows}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{analysisFlows.length}</div>
            <div className="text-sm text-gray-600">Total AnalysisFlows</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {analysisFlows.filter(c => c.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {analysisFlows.filter(c => !c.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">
              {analysisFlows.reduce((sum, c) => sum + c.conversation_state.totalQuestions, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Questions</div>
          </div>
        </div>

        {/* AnalysisFlows List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              All AnalysisFlows
            </h3>
            
            {analysisFlows.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-lg">No analysisFlows found</div>
                <p className="mt-2 text-gray-400">Start using conversational questions to see data here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analysisFlows.map((conversation) => (
                  <div
                    key={conversation.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleAnalysisFlowSelect(conversation)}
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
                          {conversation.conversation_state.questions.filter((q: any) => q.answer).length} answered
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* AnalysisFlow Detail Modal */}
        {selectedAnalysisFlow && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 xl:w-2/3 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    AnalysisFlow Details
                  </h3>
                  <button
                    onClick={() => setSelectedAnalysisFlow(null)}
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
                    {/* AnalysisFlow Metadata */}
                    <CollapsibleSection title="AnalysisFlow Metadata" defaultOpen={true}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">AnalysisFlow ID:</span>
                            <p className="text-sm text-gray-900 font-mono">{selectedAnalysisFlow.id}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Image ID:</span>
                            <p className="text-sm text-gray-900 font-mono">{selectedAnalysisFlow.image_id}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Session ID:</span>
                            <p className="text-sm text-gray-900 font-mono">{selectedAnalysisFlow.session_id}</p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium text-gray-600">Status:</span>
                            <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedAnalysisFlow.is_active)}`}>
                              {selectedAnalysisFlow.is_active ? 'Active' : 'Completed'}
                            </span>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Created:</span>
                            <p className="text-sm text-gray-900">{formatDate(selectedAnalysisFlow.created_at)}</p>
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-600">Updated:</span>
                            <p className="text-sm text-gray-900">{formatDate(selectedAnalysisFlow.updated_at)}</p>
                          </div>
                        </div>
                      </div>
                    </CollapsibleSection>

                    {/* Image Analysis */}
                    <CollapsibleSection title="Image Analysis" defaultOpen={true}>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700 leading-relaxed">
                          {selectedAnalysisFlow.conversation_state.contextData.imageAnalysis}
                        </p>
                      </div>
                    </CollapsibleSection>
                    
                    {/* Questions & Answers */}
                    <CollapsibleSection title="Questions & Answers" defaultOpen={true}>
                      <div className="space-y-4">
                        {selectedAnalysisFlow.conversation_state.questions.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            No questions generated yet
                          </div>
                        ) : (
                          selectedAnalysisFlow.conversation_state.questions.map((q: any, index: number) => (
                            <div key={q.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                              <div className="font-semibold text-gray-900 mb-2">
                                Q{index + 1}: {q.text}
                              </div>
                              <div className="text-sm text-gray-700 mb-2">
                                <span className="font-medium">Answer:</span> {q.answer || 'Not answered'}
                              </div>
                              {q.context && (
                                <CollapsibleSection title="Question Context" defaultOpen={false}>
                                  <div className="text-xs text-gray-600 space-y-1 bg-white p-3 rounded border">
                                    <div><span className="font-medium">Reasoning:</span> {q.context.reasoning}</div>
                                    <div><span className="font-medium">Builds on:</span> {q.context.builds_on}</div>
                                    <div><span className="font-medium">Focus:</span> {q.context.artistic_focus}</div>
                                  </div>
                                </CollapsibleSection>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </CollapsibleSection>
                    
                    {/* Artistic Direction */}
                    <CollapsibleSection title="Artistic Direction">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="text-gray-700">
                          {selectedAnalysisFlow.conversation_state.contextData.artisticDirection || 'Not set'}
                        </p>
                      </div>
                    </CollapsibleSection>

                    {/* Previous Answers Summary */}
                    <CollapsibleSection title="Previous Answers Summary">
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        {selectedAnalysisFlow.conversation_state.contextData.previousAnswers.length === 0 ? (
                          <p className="text-gray-500">No previous answers</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedAnalysisFlow.conversation_state.contextData.previousAnswers.map((answer: any, index: number) => (
                              <div key={index} className="text-sm text-gray-700">
                                <span className="font-medium">Answer {index + 1}:</span> {answer}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CollapsibleSection>
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
                          .map((step) => (
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

                              <div className="space-y-4">
                                {/* Input Schema and Data */}
                                <CollapsibleSection title="Input Schema & Data" defaultOpen={true}>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        Expected Schema
                                      </h6>
                                      <pre className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64">
                                        {step.input_schema ? JSON.stringify(step.input_schema, null, 2) : 'No schema available'}
                                      </pre>
                                    </div>
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Actual Input
                                      </h6>
                                      <pre className="text-xs text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64">
                                        {JSON.stringify(step.input_data, null, 2)}
                                      </pre>
                                    </div>
                                  </div>
                                </CollapsibleSection>

                                {/* Output Schema and Data */}
                                <CollapsibleSection title="Output Schema & Data" defaultOpen={true}>
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <svg className="h-4 w-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Expected Schema
                                      </h6>
                                      <pre className="text-xs text-gray-600 bg-green-50 p-3 rounded-lg border border-green-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64">
                                        {step.output_schema ? JSON.stringify(step.output_schema, null, 2) : 'No schema available'}
                                      </pre>
                                    </div>
                                    <div>
                                      <h6 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                                        <svg className="h-4 w-4 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Actual Output
                                      </h6>
                                      <pre className="text-xs text-gray-800 bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-64">
                                        {step.output_data ? JSON.stringify(step.output_data, null, 2) : 'No output data'}
                                      </pre>
                                    </div>
                                  </div>
                                </CollapsibleSection>

                                {/* Additional Constraints and Validation Info */}
                                <CollapsibleSection title="Validation & Constraints">
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <h6 className="text-sm font-medium text-yellow-800 mb-2 flex items-center">
                                          <svg className="h-4 w-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                                          </svg>
                                          Response Time
                                        </h6>
                                        <p className="text-sm text-yellow-700">
                                          {step.response_time_ms}ms
                                        </p>
                                      </div>
                                      
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <h6 className="text-sm font-medium text-blue-800 mb-2 flex items-center">
                                          <svg className="h-4 w-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                                          </svg>
                                          Model Used
                                        </h6>
                                        <p className="text-sm text-blue-700">
                                          {step.model_used}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Schema Validation Status */}
                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                      <h6 className="text-sm font-medium text-gray-800 mb-2 flex items-center">
                                        <svg className="h-4 w-4 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Schema Validation
                                      </h6>
                                      <div className="flex items-center space-x-2">
                                        <div className={`w-3 h-3 rounded-full ${step.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className="text-sm text-gray-700">
                                          {step.success ? 'Schema validation passed' : 'Schema validation failed'}
                                        </span>
                                      </div>
                                      {!step.success && step.error_message && (
                                        <p className="text-xs text-red-600 mt-2">
                                          {step.error_message}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </CollapsibleSection>
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
