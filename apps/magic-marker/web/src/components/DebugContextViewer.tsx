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
    <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <h3 className="text-sm font-medium">
              Debug: {stepName}
            </h3>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          {canContinue && onContinue && (
            <button
              onClick={onContinue}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
            >
              <Play className="w-4 h-4" />
              <span>Continue</span>
            </button>
          )}
          
          <button
            onClick={() => copyToClipboard(contextString)}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            <Copy className="w-3 h-3" />
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-3">
          <div className="bg-white border border-gray-200 rounded p-3">
            <div className="text-xs text-gray-600 font-medium mb-2">
              Context Data:
            </div>
            <pre className="text-xs text-gray-800 overflow-x-auto max-h-64">
              {contextString}
            </pre>
          </div>
          
          <div className="text-xs text-gray-600">
            <p><strong>Size:</strong> {contextString.length} chars</p>
            <p><strong>Flow:</strong> {String(contextData?.flowId || 'N/A').substring(0, 8)}...</p>
          </div>
        </div>
      )}
    </div>
  )
}
