import { useEffect, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getMonthlyRegistrations, getDashboardCached, setDashboardCached } from '../../services/dashboard.service'
import type { MonthlyRegistrations } from '../../services/dashboard.service'
import { useDashboard } from '../../context/DashboardContext'

const sampleData: MonthlyRegistrations = [
  { month: 'Jan', households: 5, residents: 12 },
  { month: 'Feb', households: 3, residents: 8 },
  { month: 'Mar', households: 7, residents: 18 },
  { month: 'Apr', households: 4, residents: 10 },
  { month: 'May', households: 6, residents: 15 },
  { month: 'Jun', households: 8, residents: 22 },
  { month: 'Jul', households: 5, residents: 13 },
  { month: 'Aug', households: 9, residents: 25 },
  { month: 'Sep', households: 6, residents: 16 },
  { month: 'Oct', households: 7, residents: 19 },
  { month: 'Nov', households: 4, residents: 11 },
  { month: 'Dec', households: 8, residents: 21 },
]

const CACHE_KEY = 'monthlyRegistrations'

function getCached() {
  return getDashboardCached<MonthlyRegistrations>(CACHE_KEY) ?? null
}

export default function MonthlyRegistrationsChart() {
  const { refreshTrigger } = useDashboard()
  const [data, setData] = useState<MonthlyRegistrations>(() => getCached() ?? sampleData)
  const [loading, setLoading] = useState(() => getCached() == null)

  useEffect(() => {
    const cached = getDashboardCached<MonthlyRegistrations>(CACHE_KEY)
    if (cached != null) {
      setData(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    let cancelled = false
    const fetchData = async () => {
      try {
        const response = await getMonthlyRegistrations()
        if (cancelled) return
        if (response.success && response.data && response.data.length > 0) {
          setData(response.data)
          setDashboardCached(CACHE_KEY, response.data)
        }
      } catch {
        // Keep sample data on error
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [refreshTrigger])

  if (loading) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Monthly Registrations</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="skeleton-card" style={{ height: '320px', width: '100%' }}>
            <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '20px' }}></div>
            <div className="skeleton-line" style={{ width: '100%', height: '250px', marginBottom: '20px' }}></div>
            <div className="d-flex justify-content-between">
              <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
              <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern p-4">
      <h5 className="h5 font-bold text-brand-primary mb-4">Monthly Registrations</h5>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis 
              domain={[0, 'dataMax + 1']}
              tickCount={6}
              allowDecimals={false}
              scale="linear"
            />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="households"
              stackId="1"
              stroke="var(--color-accent)"
              fill="var(--color-accent)"
              name="Households"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="residents"
              stackId="1"
              stroke="var(--color-warning)"
              fill="var(--color-warning)"
              name="Residents"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
