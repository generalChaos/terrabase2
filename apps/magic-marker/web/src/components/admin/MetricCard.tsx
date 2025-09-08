'use client'

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  className?: string
  onClick?: () => void
}

export default function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendValue,
  className = '',
  onClick
}: MetricCardProps) {
  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return '↗'
      case 'down':
        return '↘'
      default:
        return '→'
    }
  }

  return (
    <div 
      className={`
        bg-white border border-gray-200 rounded-lg p-4
        ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">{value}</div>
          {trend && trendValue && (
            <div className={`text-xs ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)} {trendValue}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
