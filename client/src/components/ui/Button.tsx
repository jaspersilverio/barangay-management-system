import React from 'react'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  className?: string
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void
  type?: 'button' | 'submit' | 'reset'
  title?: string
}

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  onClick,
  type = 'button',
  title
}: ButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    warning: 'btn-warning',
    danger: 'btn-danger',
    outline: 'bg-transparent border focus:ring-neutral-500',
    ghost: 'bg-transparent focus:ring-neutral-500'
  }

  const getVariantStyle = (variant: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {}
    
    if (variant === 'outline') {
      baseStyle.borderColor = 'var(--color-border)'
      baseStyle.color = 'var(--color-text-primary)'
    } else if (variant === 'ghost') {
      baseStyle.color = 'var(--color-text-primary)'
    }
    
    return baseStyle
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (onClick) {
      onClick(e)
    }
  }

  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      style={getVariantStyle(variant)}
      disabled={disabled || loading}
      onClick={handleClick}
      title={title}
    >
      {loading ? (
        <div className="d-flex align-items-center gap-2">
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          Loading...
        </div>
      ) : (
        children
      )}
    </button>
  )
}

// Predefined button variants for common actions
export function SaveButton({ children = 'Save', ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="success" {...props}>{children}</Button>
}

export function CancelButton({ children = 'Cancel', ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="secondary" {...props}>{children}</Button>
}

export function DeleteButton({ children = 'Delete', ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="danger" {...props}>{children}</Button>
}

export function EditButton({ children = 'Edit', ...props }: Omit<ButtonProps, 'variant'>) {
  return <Button variant="outline" {...props}>{children}</Button>
}
