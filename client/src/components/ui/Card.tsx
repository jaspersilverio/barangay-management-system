import React from 'react'
import Badge from './Badge'
import { EventTypeBadge } from './Badge'

interface CardProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  className?: string
  headerActions?: React.ReactNode
  footer?: React.ReactNode
  variant?: 'default' | 'elevated' | 'outlined'
}

export default function Card({ 
  children, 
  title, 
  subtitle,
  className = '',
  headerActions,
  footer,
  variant = 'default'
}: CardProps) {
  const variantClasses = {
    default: 'card-modern',
    elevated: 'card-modern shadow-soft',
    outlined: 'bg-white border border-neutral-200 rounded-xl p-6'
  }

  return (
    <div className={`${variantClasses[variant]} ${className}`}>
      {(title || headerActions) && (
        <div className="d-flex justify-content-between align-items-start mb-4">
          <div>
            {title && <h3 className="h5 font-bold text-neutral-800 mb-1">{title}</h3>}
            {subtitle && <p className="text-sm text-neutral-600 mb-0">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="d-flex gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}
      
      <div className="card-body p-0">
        {children}
      </div>
      
      {footer && (
        <div className="card-footer bg-transparent border-top border-neutral-200 pt-4 mt-4">
          {footer}
        </div>
      )}
    </div>
  )
}

// Specialized card components
export function StatsCard({ 
  title, 
  value, 
  change, 
  icon, 
  color = 'primary',
  className = '' 
}: {
  title: string
  value: string | number
  change?: string
  icon: React.ReactNode
  color?: 'primary' | 'success' | 'warning' | 'info'
  className?: string
}) {
  const colorClasses = {
    primary: 'bg-primary-50 border-primary-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-accent-50 border-accent-200',
    info: 'bg-blue-50 border-blue-200'
  }

  return (
    <Card className={`${colorClasses[color]} ${className}`}>
      <div className="d-flex align-items-center justify-content-between">
        <div>
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-neutral-800 mb-1">{value}</p>
          {change && (
            <p className="text-xs text-neutral-500 mb-0">{change}</p>
          )}
        </div>
        <div className="text-3xl text-neutral-400">
          {icon}
        </div>
      </div>
    </Card>
  )
}

export function EventCard({ 
  title, 
  date, 
  type, 
  description, 
  status = 'upcoming',
  className = '' 
}: {
  title: string
  date: string
  type: string
  description: string
  status?: 'upcoming' | 'ongoing' | 'completed' | 'cancelled'
  className?: string
}) {
  const statusColors = {
    upcoming: 'border-blue-200 bg-blue-50',
    ongoing: 'border-green-200 bg-green-50',
    completed: 'border-neutral-200 bg-neutral-50',
    cancelled: 'border-red-200 bg-red-50'
  }

  return (
    <Card className={`${statusColors[status]} ${className}`}>
      <div className="d-flex justify-content-between align-items-start mb-2">
        <h4 className="h6 font-semibold text-neutral-800 mb-1">{title}</h4>
        <Badge variant={status === 'ongoing' ? 'success' : status === 'cancelled' ? 'danger' : 'info'}>
          {status}
        </Badge>
      </div>
      <p className="text-sm text-neutral-600 mb-2">{description}</p>
      <div className="d-flex justify-content-between align-items-center">
        <span className="text-xs text-neutral-500">{date}</span>
        <EventTypeBadge type={type} />
      </div>
    </Card>
  )
}


