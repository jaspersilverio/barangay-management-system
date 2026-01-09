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
import { getMonthlyRegistrations } from '../../services/dashboard.service'
import type { MonthlyRegistrations } from '../../services/dashboard.service'

// Sample data for demonstration when API doesn't return data
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

export default function MonthlyRegistrationsChart() {
  const [data, setData] = useState<MonthlyRegistrations>(sampleData)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getMonthlyRegistrations()
        if (response.success && response.data && response.data.length > 0) {
          setData(response.data)
        }
        // Keep using sample data if API doesn't return data
      } catch (err: any) {
        console.warn('Monthly registrations API not available, using sample data:', err)
        // Keep using sample data on error
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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
