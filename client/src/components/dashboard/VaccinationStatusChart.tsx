import React, { useMemo, useState, useEffect } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { getVaccinationSummary } from '../../services/dashboard.service'
import { Syringe } from 'lucide-react'

const COLORS = {
  completed: 'var(--color-accent)', // green-500
  pending: 'var(--color-warning)',   // amber-500
  scheduled: 'var(--color-primary)'  // blue-500
}

const VaccinationStatusChart = React.memo(() => {
  const [data, setData] = useState<any>(null)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Manual data fetching
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      setIsError(false)
      try {
        const response = await getVaccinationSummary()
        if (response.success) {
          setData(response.data)
        } else {
          throw new Error(response.message || 'Failed to fetch vaccination data')
        }
      } catch (err) {
        setIsError(true)
        setError(err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const chartData = useMemo(() => {
    if (!data) return []
    return [
      { name: 'Completed', value: data.completed, color: COLORS.completed },
      { name: 'Pending', value: data.pending, color: COLORS.pending },
      { name: 'Scheduled', value: data.scheduled, color: COLORS.scheduled },
    ].filter(item => item.value > 0)
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = data.payload.value + 
        (payload[1]?.payload?.value || 0) + 
        (payload[2]?.payload?.value || 0)
      const percentage = total > 0 ? Math.round((data.payload.value / total) * 100) : 0
      
      return (
        <div 
          className="p-3 border rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <p className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{data.name}</p>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {data.value} residents ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }

  const CustomLegend = ({ payload }: any) => {
    if (!payload || payload.length === 0) return null
    
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Vaccination Status Breakdown</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="skeleton-card" style={{ height: '320px' }}>
            <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '20px' }}></div>
            <div className="skeleton-circle" style={{ width: '200px', height: '200px', margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Vaccination Status Breakdown</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-red-600">
            <Syringe className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Error loading vaccination data</p>
            <p className="text-xs text-gray-500 mt-1">{error?.message || 'Unknown error'}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Vaccination Status Breakdown</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Syringe className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No vaccination data available</p>
            <p className="text-xs text-gray-400 mt-1">Start adding vaccination records to see insights</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern p-4">
      <h5 className="h5 font-bold text-brand-primary mb-4">Vaccination Status Breakdown</h5>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">{data.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">{data.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{data.scheduled}</div>
            <div className="text-xs text-gray-500">Scheduled</div>
          </div>
        </div>
      </div>
    </div>
  )
})

VaccinationStatusChart.displayName = 'VaccinationStatusChart'

export default VaccinationStatusChart
