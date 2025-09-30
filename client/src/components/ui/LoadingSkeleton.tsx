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
  const baseClasses = 'skeleton-line'
  
  const typeClasses = {
    card: 'skeleton-card',
    table: 'skeleton-line',
    text: 'skeleton-line',
    circle: 'skeleton-circle'
  }

  const style = {
    width: width,
    height: height
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
    <div className="skeleton-card" style={{ height: '200px' }}>
      <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '15px' }}></div>
      <div className="skeleton-line" style={{ width: '100%', height: '16px', marginBottom: '10px' }}></div>
      <div className="skeleton-line" style={{ width: '80%', height: '16px', marginBottom: '10px' }}></div>
      <div className="skeleton-line" style={{ width: '70%', height: '16px' }}></div>
    </div>
  )
}

export function TableSkeleton() {
  return (
    <div className="table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></th>
            <th><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></th>
            <th><div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div></th>
            <th><div className="skeleton-line" style={{ width: '90px', height: '16px' }}></div></th>
          </tr>
        </thead>
        <tbody>
          {[...Array(5)].map((_, i) => (
            <tr key={i}>
              <td><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></td>
              <td><div className="skeleton-line" style={{ width: '200px', height: '16px' }}></div></td>
              <td><div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div></td>
              <td><div className="skeleton-button" style={{ width: '60px', height: '28px' }}></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
