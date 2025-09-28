import React, { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { useQuery } from '@tanstack/react-query'
import { getVaccinationSummary } from '../../services/dashboard.service'
import { Syringe } from 'lucide-react'

const COLORS = {
  completed: '#10b981', // green-500
  pending: '#f59e0b',   // amber-500
  scheduled: '#3b82f6'  // blue-500
}

const VaccinationStatusChart = React.memo(() => {
  const { data, isError, error } = useQuery({
    queryKey: ['vaccination-summary'],
    queryFn: async () => {
      const response = await getVaccinationSummary()
      if (response.success) {
        return response.data
      } else {
        throw new Error(response.message || 'Failed to fetch vaccination data')
      }
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

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
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
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

  if (!data) {
    return (
      <div className="card-modern">
        <h5 className="h5 font-bold text-neutral-800 mb-4">Vaccination Status Breakdown</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="animate-pulse">
            <div className="w-64 h-64 bg-neutral-200 rounded-full"></div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="card-modern">
        <h5 className="h5 font-bold text-neutral-800 mb-4">Vaccination Status Breakdown</h5>
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
      <div className="card-modern">
        <h5 className="h5 font-bold text-neutral-800 mb-4">Vaccination Status Breakdown</h5>
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
    <div className="card-modern">
      <h5 className="h5 font-bold text-neutral-800 mb-4">Vaccination Status Breakdown</h5>
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
      <div className="mt-4 pt-4 border-t border-gray-200">
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
