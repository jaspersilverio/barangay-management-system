import React from 'react'
import Card from './Card'
import { TableSkeleton } from './LoadingSkeleton'

interface TableProps {
  children: React.ReactNode
  className?: string
  striped?: boolean
  hover?: boolean
  bordered?: boolean
  responsive?: boolean
}

interface TableHeaderProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  style?: React.CSSProperties
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right'
  colSpan?: number
}

export default function Table({ 
  children, 
  className = '',
  striped = true,
  hover = true,
  bordered = false,
  responsive = true
}: TableProps) {
  const tableClasses = [
    'table-modern',
    striped && 'table-striped',
    hover && 'table-hover',
    bordered && 'table-bordered',
    className
  ].filter(Boolean).join(' ')

  const tableElement = (
    <table className={tableClasses}>
      {children}
    </table>
  )

  return responsive ? (
    <div className="table-responsive">
      {tableElement}
    </div>
  ) : tableElement
}

export function TableHeader({ children, className = '', align = 'left', style }: TableHeaderProps) {
  const alignClasses = {
    left: 'text-start',
    center: 'text-center',
    right: 'text-end'
  }

  return (
    <th className={`${alignClasses[align]} ${className}`} style={style}>
      {children}
    </th>
  )
}

export function TableRow({ children, className = '', onClick }: TableRowProps) {
  return (
    <tr 
      className={`${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </tr>
  )
}

export function TableCell({ children, className = '', align = 'left', colSpan }: TableCellProps) {
  const alignClasses = {
    left: 'text-start',
    center: 'text-center',
    right: 'text-end'
  }

  return (
    <td 
      className={`${alignClasses[align]} ${className}`}
      colSpan={colSpan}
    >
      {children}
    </td>
  )
}

// Predefined table components for common use cases
export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowClick,
  loading = false,
  emptyMessage = 'No data available',
  className = ''
}: {
  data: T[]
  columns: {
    key: keyof T
    header: string
    render?: (value: any, row: T) => React.ReactNode
    align?: 'left' | 'center' | 'right'
    width?: string
  }[]
  onRowClick?: (row: T) => void
  loading?: boolean
  emptyMessage?: string
  className?: string
}) {
  if (loading) {
    return <TableSkeleton />
  }

  if (data.length === 0) {
    return (
      <Card className={className}>
        <div className="text-center py-8">
          <div className="text-neutral-400 text-4xl mb-4">📭</div>
          <p className="text-neutral-600">{emptyMessage}</p>
        </div>
      </Card>
    )
  }

  return (
    <Table className={className}>
      <thead>
        <TableRow>
          {columns.map((column) => (
            <TableHeader 
              key={String(column.key)} 
              align={column.align}
              style={{ width: column.width }}
            >
              {column.header}
            </TableHeader>
          ))}
        </TableRow>
      </thead>
      <tbody>
        {data.map((row, index) => (
          <TableRow 
            key={index} 
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((column) => (
              <TableCell key={String(column.key)} align={column.align}>
                {column.render 
                  ? column.render(row[column.key], row)
                  : row[column.key]
                }
              </TableCell>
            ))}
          </TableRow>
        ))}
      </tbody>
    </Table>
  )
}
