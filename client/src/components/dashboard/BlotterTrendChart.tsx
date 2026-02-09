import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { getBlotterSummary, getDashboardCached, setDashboardCached } from '../../services/dashboard.service'
import type { BlotterSummary } from '../../services/dashboard.service'
import { FileText } from 'lucide-react'

const COLORS = {
  open: 'var(--color-warning)',     // amber-500
  ongoing: 'var(--color-primary)',  // blue-500
  resolved: 'var(--color-accent)'  // green-500
}

const CACHE_KEY = 'blotterSummary'

export default function BlotterTrendChart() {
  const cached = getDashboardCached<BlotterSummary>(CACHE_KEY)
  const [data, setData] = useState<BlotterSummary | null>(cached ?? null)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cached != null) {
      setData(cached)
      setLoading(false)
      return
    }
    const fetchData = async () => {
      try {
        setError(null)
        const response = await getBlotterSummary()
        if (response.success) {
          setData(response.data)
          setDashboardCached(CACHE_KEY, response.data)
        } else {
          setError(response.message || 'Failed to fetch blotter data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Blotter data unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div 
          className="p-3 border rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <p className="font-medium mb-2" style={{ color: 'var(--color-text-primary)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value} cases
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Monthly Blotter Cases Trend</h5>
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Monthly Blotter Cases Trend</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-red-600">
            <FileText className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Error loading blotter data</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || !data.monthlyTrend || data.monthlyTrend.length === 0) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Monthly Blotter Cases Trend</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No blotter data available</p>
            <p className="text-xs text-gray-400 mt-1">Start adding blotter cases to see trends</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern p-4">
      <h5 className="h5 font-bold text-brand-primary mb-4">Monthly Blotter Cases Trend</h5>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.monthlyTrend} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax + 1']}
              tickCount={6}
              allowDecimals={false}
              scale="linear"
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
            <Line
              type="monotone"
              dataKey="open"
              stroke={COLORS.open}
              strokeWidth={2}
              dot={{ fill: COLORS.open, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.open, strokeWidth: 2 }}
              name="Open"
            />
            <Line
              type="monotone"
              dataKey="ongoing"
              stroke={COLORS.ongoing}
              strokeWidth={2}
              dot={{ fill: COLORS.ongoing, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.ongoing, strokeWidth: 2 }}
              name="Ongoing"
            />
            <Line
              type="monotone"
              dataKey="resolved"
              stroke={COLORS.resolved}
              strokeWidth={2}
              dot={{ fill: COLORS.resolved, strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: COLORS.resolved, strokeWidth: 2 }}
              name="Resolved"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-amber-600">{data.active}</div>
            <div className="text-xs text-gray-500">Active Cases</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{data.resolvedThisMonth}</div>
            <div className="text-xs text-gray-500">Resolved This Month</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {data.monthlyTrend.reduce((sum, month) => sum + month.open + month.ongoing + month.resolved, 0)}
            </div>
            <div className="text-xs text-gray-500">Total Cases (6 months)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
