'use client'

import { Info } from 'lucide-react'

interface SchemaPreviewProps {
  schema: Record<string, unknown>
  type: 'input' | 'output'
  promptType?: string
  className?: string
}

export default function SchemaPreview({
  schema,
  type,
  promptType,
  className = ''
}: SchemaPreviewProps) {
  const getSchemaExplanation = (type: string, promptType?: string) => {
    if (type === 'input') {
      return {
        title: 'Input Schema (System Managed)',
        explanation: 'Defines what data the AI expects to receive. This ensures consistent input validation.',
        technical: 'Used by the frontend to validate user inputs before sending to the AI.'
      }
    } else {
      return {
        title: 'Output Schema (System Managed)',
        explanation: 'Defines the exact structure the AI must return. Enforced by OpenAI Function Calling.',
        technical: 'Guarantees 100% schema compliance - AI cannot return invalid JSON or wrong structure.'
      }
    }
  }

  const explanation = getSchemaExplanation(type, promptType)

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center">
          <Info className="w-4 h-4 text-blue-600 mr-2" />
          <h4 className="font-medium text-blue-900">{explanation.title}</h4>
        </div>
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          {type.toUpperCase()}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="text-sm text-blue-800">
          <strong>Why this exists:</strong> {explanation.explanation}
        </div>
        
        <div className="text-sm text-blue-700">
          <strong>How it works:</strong> {explanation.technical}
        </div>
        
        <div className="bg-white border border-blue-200 rounded p-3">
          <div className="text-xs text-blue-600 font-medium mb-2">Schema Definition:</div>
          <pre className="text-xs text-gray-800 overflow-x-auto">
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
