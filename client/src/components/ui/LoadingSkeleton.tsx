import { cn } from '../../utils/cn'

export type LoadingSkeletonProps = {
  type?: 'card' | 'table' | 'text' | 'circle'
  className?: string
  width?: string | number
  height?: string | number
}

export default function LoadingSkeleton({ 
  type = 'card', 
  className, 
  width, 
  height 
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-neutral-200 rounded'
  
  const typeClasses = {
    card: 'h-32',
    table: 'h-4',
    text: 'h-4',
    circle: 'rounded-full'
  }

  const style = {
    width: width,
    height: height || typeClasses[type]
  }

  return (
    <div 
      className={cn(baseClasses, typeClasses[type], className)}
      style={style}
    />
  )
}

// Predefined skeleton layouts
export function CardSkeleton() {
  return (
    <div className="card-modern">
      <div className="animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-neutral-200 rounded"></div>
          <div className="h-4 bg-neutral-200 rounded w-5/6"></div>
          <div className="h-4 bg-neutral-200 rounded w-4/6"></div>
        </div>
      </div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="table-modern">
      <div className="animate-pulse">
        <div className="px-6 py-3 bg-neutral-200 h-12"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-neutral-100">
            <div className="h-4 bg-neutral-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  )
}
