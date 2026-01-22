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
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    },
    success: {
      icon: 'text-green-600 dark:text-green-400',
      text: 'text-green-600 dark:text-green-400'
    },
    warning: {
      icon: 'text-orange-600 dark:text-orange-400',
      text: 'text-orange-600 dark:text-orange-400'
    },
    info: {
      icon: 'text-blue-600 dark:text-blue-400',
      text: 'text-blue-600 dark:text-blue-400'
    },
    danger: {
      icon: 'text-red-600 dark:text-red-400',
      text: 'text-red-600 dark:text-red-400'
    }
  }

  const classes = colorClasses[color]

  return (
    <div className="card-modern p-4 hover:shadow-soft transition-all duration-300">
      <div className="d-flex align-items-center gap-4">
        <div 
          className={`d-flex align-items-center justify-content-center rounded-xl w-12 h-12 ${classes.icon}`}
          style={{
            backgroundColor: 'var(--color-border-light)',
          }}
        >
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


