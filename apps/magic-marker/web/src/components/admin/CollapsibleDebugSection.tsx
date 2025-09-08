'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleDebugSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
  icon?: React.ReactNode
}

export default function CollapsibleDebugSection({
  title,
  children,
  defaultOpen = false,
  className = '',
  icon
}: CollapsibleDebugSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={`border border-gray-200 rounded-lg ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
      >
        <div className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          <span className="text-sm font-medium text-gray-700">{title}</span>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-200 bg-gray-50">
          {children}
        </div>
      )}
    </div>
  )
}
