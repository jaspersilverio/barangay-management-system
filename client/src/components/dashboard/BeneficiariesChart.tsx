import { useEffect, useState, useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { getBeneficiariesSummary, getDashboardCached, setDashboardCached, type BeneficiariesSummary } from '../../services/dashboard.service'
import { Gift } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  '4Ps': 'var(--color-primary)',           // blue
  'Solo Parent': 'var(--color-accent)',    // green
  'Senior Citizens': 'var(--color-warning)', // yellow
  'PWD': '#8B5CF6',                         // purple
}
const DEFAULT_COLOR = 'var(--color-text-muted)'
const CACHE_KEY = 'beneficiariesSummary'

export default function BeneficiariesChart() {
  const cached = getDashboardCached<BeneficiariesSummary>(CACHE_KEY)
  const [data, setData] = useState<BeneficiariesSummary | null>(cached ?? null)
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
        const response = await getBeneficiariesSummary()
        if (response.success) {
          setData(response.data)
          setDashboardCached(CACHE_KEY, response.data)
        } else {
          setError(response.message || 'Failed to fetch beneficiaries data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Beneficiaries data unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const chartData = useMemo(() => {
    if (!data || !data.categories) return []
    return data.categories
      .filter(cat => cat.count > 0)
      .map(cat => ({
        name: cat.name,
        value: cat.count,
        color: CATEGORY_COLORS[cat.name] ?? DEFAULT_COLOR,
      }))
  }, [data])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      const total = data.payload.value + 
        (payload[1]?.payload?.value || 0) + 
        (payload[2]?.payload?.value || 0) +
        (payload[3]?.payload?.value || 0)
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
            {data.value} beneficiaries ({percentage}%)
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

  if (loading) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Beneficiaries by Category</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="skeleton-card" style={{ height: '320px', width: '100%' }}>
            <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '20px' }}></div>
            <div className="skeleton-circle" style={{ width: '200px', height: '200px', margin: '0 auto' }}></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Beneficiaries by Category</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-red-600">
            <Gift className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Error loading beneficiaries data</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || chartData.length === 0) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Beneficiaries by Category</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No beneficiaries data available</p>
            <p className="text-xs text-gray-400 mt-1">Start registering beneficiaries to see the breakdown</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern p-4">
      <h5 className="h5 font-bold text-brand-primary mb-4">Beneficiaries by Category</h5>
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
        <div className="grid grid-cols-4 gap-4 text-center">
          {data.categories.map((cat) => (
            <div key={cat.name}>
              <div className="text-2xl font-bold" style={{ color: CATEGORY_COLORS[cat.name] ?? DEFAULT_COLOR }}>
                {cat.count}
              </div>
              <div className="text-xs text-gray-500">{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

