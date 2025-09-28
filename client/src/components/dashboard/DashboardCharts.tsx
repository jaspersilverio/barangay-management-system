import { memo, useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useDashboard } from '../../context/DashboardContext'

const DashboardCharts = memo(() => {
  const { summaryData, loading, error } = useDashboard()

  const chartData = useMemo(() => {
    if (!summaryData?.households_by_purok) return []
    return summaryData.households_by_purok
  }, [summaryData?.households_by_purok])

  if (loading) {
    return (
      <div className="w-full h-full animate-pulse bg-neutral-200 rounded"></div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    )
  }

  if (!chartData.length) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500">
        No summary data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="purok" />
        <YAxis 
          domain={[0, 'dataMax + 1']}
          tickCount={6}
          allowDecimals={false}
          scale="linear"
        />
        <Tooltip />
        <Bar dataKey="count" fill="#059669" />
      </BarChart>
    </ResponsiveContainer>
  )
})

DashboardCharts.displayName = 'DashboardCharts'

export default DashboardCharts
