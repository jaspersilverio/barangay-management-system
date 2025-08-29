import React from 'react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Badge({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}: BadgeProps) {
  const variantClasses = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    neutral: 'badge-neutral'
  }

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm',
    lg: 'px-3 py-1 text-base'
  }

  return (
    <span className={`badge ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  )
}

// Predefined status badges
export function StatusBadge({ status }: { status: string }) {
  const getVariant = (status: string) => {
    const lowerStatus = status.toLowerCase()
    if (lowerStatus.includes('active') || lowerStatus.includes('completed') || lowerStatus.includes('success')) {
      return 'success'
    }
    if (lowerStatus.includes('pending') || lowerStatus.includes('warning') || lowerStatus.includes('inactive')) {
      return 'warning'
    }
    if (lowerStatus.includes('error') || lowerStatus.includes('failed') || lowerStatus.includes('emergency')) {
      return 'danger'
    }
    if (lowerStatus.includes('info') || lowerStatus.includes('processing')) {
      return 'info'
    }
    return 'neutral'
  }

  return (
    <Badge variant={getVariant(status)}>
      {status}
    </Badge>
  )
}

// Event type badges
export function EventTypeBadge({ type }: { type: string }) {
  const getVariant = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('barangay') || lowerType.includes('community')) {
      return 'info'
    }
    if (lowerType.includes('purok') || lowerType.includes('local')) {
      return 'success'
    }
    if (lowerType.includes('emergency') || lowerType.includes('alert')) {
      return 'danger'
    }
    return 'neutral'
  }

  return (
    <Badge variant={getVariant(type)}>
      {type}
    </Badge>
  )
}
