'use client'

import { AlertTriangle, AlertCircle } from 'lucide-react'
import { useState } from 'react'

interface ErrorExplanationProps {
  error: string
  className?: string
}

export default function ErrorExplanation({
  error,
  className = ''
}: ErrorExplanationProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getErrorInfo = (error: string) => {
    if (error.includes('schema') || error.includes('validation')) {
      return {
        title: 'Schema Validation Failed',
        icon: AlertCircle,
        explanation: 'The AI response didn\'t match the expected structure. This is automatically fixed by our retry system.',
        action: 'The system will retry with improved instructions automatically.',
        technical: 'Function calling ensures exact schema compliance on retry.',
        severity: 'warning'
      }
    }
    if (error.includes('timeout')) {
      return {
        title: 'Request Timeout',
        icon: AlertTriangle,
        explanation: 'The AI took too long to respond. This can happen with complex prompts.',
        action: 'Try reducing the prompt complexity or increasing max_tokens.',
        technical: 'Timeout occurred after 30 seconds.',
        severity: 'error'
      }
    }
    if (error.includes('rate limit') || error.includes('quota')) {
      return {
        title: 'Rate Limit Exceeded',
        icon: AlertTriangle,
        explanation: 'Too many requests to OpenAI API. This is temporary.',
        action: 'The system will retry automatically after a delay.',
        technical: 'Rate limit reset occurs every minute.',
        severity: 'warning'
      }
    }
    return {
      title: 'Unknown Error',
      icon: AlertTriangle,
      explanation: 'An unexpected error occurred during processing.',
      action: 'Check the system logs for more details.',
      technical: error,
      severity: 'error'
    }
  }

  const errorInfo = getErrorInfo(error)
  const Icon = errorInfo.icon

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-900'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-900'
    }
  }

  return (
    <div className={`border rounded-lg p-4 ${getSeverityStyles(errorInfo.severity)} ${className}`}>
      <div className="flex items-start">
        <Icon className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h4 className="font-medium">{errorInfo.title}</h4>
          <p className="text-sm mt-1">{errorInfo.explanation}</p>
          <p className="text-sm mt-2">
            <strong>What happens next:</strong> {errorInfo.action}
          </p>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-sm mt-2 text-blue-600 hover:text-blue-800 underline"
          >
            {showDetails ? 'Hide' : 'Show'} Technical Details
          </button>
          
          {showDetails && (
            <div className="mt-3 p-3 bg-white rounded border">
              <div className="text-xs font-mono text-gray-800">
                {errorInfo.technical}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
