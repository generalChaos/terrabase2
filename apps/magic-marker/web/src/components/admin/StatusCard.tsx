'use client'

import { CheckCircle, XCircle, AlertTriangle, Clock } from 'lucide-react'

interface StatusCardProps {
  title: string
  status: 'success' | 'error' | 'warning' | 'info' | 'loading'
  value: string | number
  subtitle?: string
  critical?: boolean
  className?: string
  onClick?: () => void
}

export default function StatusCard({
  title,
  status,
  value,
  subtitle,
  critical = false,
  className = '',
  onClick
}: StatusCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          iconColor: 'text-green-600',
          valueColor: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'error':
        return {
          icon: XCircle,
          iconColor: 'text-red-600',
          valueColor: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      case 'warning':
        return {
          icon: AlertTriangle,
          iconColor: 'text-yellow-600',
          valueColor: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'loading':
        return {
          icon: Clock,
          iconColor: 'text-blue-600',
          valueColor: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      default:
        return {
          icon: CheckCircle,
          iconColor: 'text-gray-600',
          valueColor: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <div 
      className={`
        ${config.bgColor} ${config.borderColor} border rounded-lg p-4
        ${critical ? 'border-l-4 border-l-blue-500' : ''}
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Icon className={`w-5 h-5 ${config.iconColor} mr-2`} />
          <div>
            <h3 className="text-sm font-medium text-gray-900">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        <div className="text-right">
          <div className={`text-lg font-bold ${config.valueColor}`}>{value}</div>
          <div className="text-xs text-gray-500 capitalize">{status}</div>
        </div>
      </div>
    </div>
  )
}
