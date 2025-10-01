import React from 'react'

export type SummaryCardProps = {
  title: string
  value: string | number
  subtext?: string
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'info' | 'danger'
}

export default function SummaryCard({ title, value, subtext, icon, color = 'primary' }: SummaryCardProps) {
  const colorClasses = {
    primary: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-600'
    },
    success: {
      bg: 'bg-green-50',
      icon: 'bg-green-100 text-green-600',
      text: 'text-green-600'
    },
    warning: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-100 text-orange-600',
      text: 'text-orange-600'
    },
    info: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-100 text-blue-600',
      text: 'text-blue-600'
    },
    danger: {
      bg: 'bg-red-50',
      icon: 'bg-red-100 text-red-600',
      text: 'text-red-600'
    }
  }

  const classes = colorClasses[color]

  return (
    <div className={`card-modern p-4 ${classes.bg} hover:shadow-soft transition-all duration-300`}>
      <div className="d-flex align-items-center gap-4">
        <div className={`d-flex align-items-center justify-content-center rounded-xl ${classes.icon} w-12 h-12`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-brand-muted mb-1">
            {title}
          </div>
          <div className="text-3xl font-bold text-brand-primary mb-1">
            {value}
          </div>
          {subtext && (
            <div className="text-xs text-brand-muted">
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


