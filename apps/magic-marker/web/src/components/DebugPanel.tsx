import React, { useState } from 'react'

interface DebugPanelProps {
  errors: string[]
  logs: string[]
  onClear: () => void
}

const DebugPanel: React.FC<DebugPanelProps> = ({ errors, logs, onClear }) => {
  const [isExpanded, setIsExpanded] = useState(false)

  if (errors.length === 0 && logs.length === 0) {
    return null
  }

  return (
    <div className="card mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-lg">
          🐛 Debug Panel
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={onClear}
            className="btn-secondary text-sm"
          >
            Clear
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn-secondary text-sm"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4">
          <h4 className="text-red-300 font-medium mb-2">❌ Errors ({errors.length})</h4>
          <div className="space-y-2">
            {errors.slice(0, isExpanded ? errors.length : 3).map((error, index) => (
              <div key={index} className="bg-red-500/20 border border-red-500/30 rounded p-3">
                <p className="text-red-200 text-sm font-mono">{error}</p>
              </div>
            ))}
            {!isExpanded && errors.length > 3 && (
              <p className="text-red-300 text-sm">... and {errors.length - 3} more errors</p>
            )}
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div>
          <h4 className="text-blue-300 font-medium mb-2">📝 Logs ({logs.length})</h4>
          <div className="space-y-1">
            {logs.slice(0, isExpanded ? logs.length : 5).map((log, index) => (
              <div key={index} className="bg-blue-500/20 border border-blue-500/30 rounded p-2">
                <p className="text-blue-200 text-sm font-mono">{log}</p>
              </div>
            ))}
            {!isExpanded && logs.length > 5 && (
              <p className="text-blue-300 text-sm">... and {logs.length - 5} more logs</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DebugPanel

