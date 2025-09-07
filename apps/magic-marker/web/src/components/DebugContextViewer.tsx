'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Copy, Play, Eye, EyeOff } from 'lucide-react'

interface DebugContextViewerProps {
  contextData: Record<string, unknown>
  stepName: string
  onContinue?: () => void
  canContinue?: boolean
}

export default function DebugContextViewer({ 
  contextData, 
  stepName, 
  onContinue, 
  canContinue = false 
}: DebugContextViewerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showFullContext, setShowFullContext] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatContextForDisplay = (context: Record<string, unknown>) => {
    if (!context) return 'No context data available'
    
    // Show a summary of the context structure
    const contextData = context.contextData as Record<string, unknown> || {}
    const summary = {
      flowId: context.flowId,
      sessionId: context.sessionId,
      currentStep: context.currentStep,
      stepOrder: context.stepOrder,
      contextDataKeys: Object.keys(contextData),
      stepResults: Object.keys((contextData.stepResults as Record<string, unknown>) || {}),
      conversationHistory: Array.isArray(contextData.conversationHistory) ? contextData.conversationHistory.length : 0,
      metadata: contextData.metadata
    }
    
    return showFullContext ? context : summary
  }

  const contextDisplay = formatContextForDisplay(contextData)
  const contextString = JSON.stringify(contextDisplay, null, 2)

  return (
    <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-blue-800 hover:text-blue-900"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <h3 className="text-lg font-semibold">
              🐛 Debug Mode - {stepName}
            </h3>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFullContext(!showFullContext)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            {showFullContext ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showFullContext ? 'Summary' : 'Full Context'}</span>
          </button>
          
          <button
            onClick={() => copyToClipboard(contextString)}
            className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            <Copy className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          
          {canContinue && onContinue && (
            <button
              onClick={onContinue}
              className="flex items-center space-x-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              <span>Continue Flow</span>
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4">
          <div className="bg-white border border-blue-200 rounded p-4">
            <div className="text-sm text-blue-600 font-medium mb-2">
              Context Data Being Sent to AI:
            </div>
            <pre className="text-xs text-gray-800 overflow-x-auto max-h-96">
              {contextString}
            </pre>
          </div>
          
          <div className="text-sm text-blue-700">
            <p><strong>Step:</strong> {stepName}</p>
            <p><strong>Context Size:</strong> {contextString.length} characters</p>
            <p><strong>Flow ID:</strong> {String(contextData?.flowId || 'N/A')}</p>
            <p><strong>Session ID:</strong> {String(contextData?.sessionId || 'N/A')}</p>
          </div>
        </div>
      )}
    </div>
  )
}
