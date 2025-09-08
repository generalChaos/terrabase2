'use client'

interface DebugModeToggleProps {
  debugMode: boolean
  onToggle: (enabled: boolean) => void
  className?: string
}

export default function DebugModeToggle({
  debugMode,
  onToggle,
  className = ''
}: DebugModeToggleProps) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <input
        type="checkbox"
        id="debug-mode"
        checked={debugMode}
        onChange={(e) => onToggle(e.target.checked)}
        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
      />
      <label htmlFor="debug-mode" className="text-sm text-gray-600">
        Debug Mode
      </label>
      {debugMode && (
        <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
          Detailed info shown
        </span>
      )}
    </div>
  )
}
