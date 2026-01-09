// React import removed as it's not needed
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

export default function ResidentsByPurokChart() {
  const { summaryData, loading, error } = useDashboard()

  if (loading) {
    return (
      <div className="w-full h-80 flex items-center justify-center">
        <div className="skeleton-card" style={{ height: '320px', width: '100%' }}>
          <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '20px' }}></div>
          <div className="skeleton-line" style={{ width: '100%', height: '250px', marginBottom: '20px' }}></div>
          <div className="d-flex justify-content-between">
            <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
            <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
            <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-red-600">
        Error: {error}
      </div>
    )
  }

  if (!summaryData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-500">
        No summary data available.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={summaryData.residents_by_purok}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="purok" />
        <YAxis 
          domain={[0, 'dataMax + 1']}
          tickCount={6}
          allowDecimals={false}
          scale="linear"
        />
        <Tooltip />
        <Bar dataKey="count" fill="var(--color-primary)" />
      </BarChart>
    </ResponsiveContainer>
  )
}
