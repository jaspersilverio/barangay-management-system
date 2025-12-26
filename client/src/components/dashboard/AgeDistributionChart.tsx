import { useEffect, useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getAgeDistribution, type AgeDistribution } from '../../services/dashboard.service'
import { Users } from 'lucide-react'

// Single color theme - using primary blue with varying opacity
const PRIMARY_COLOR = 'var(--color-primary)' // blue-500

export default function AgeDistributionChart() {
  const [data, setData] = useState<AgeDistribution | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getAgeDistribution()
        if (response.success) {
          setData(response.data)
        } else {
          setError(response.message || 'Failed to fetch age distribution data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Age distribution data unavailable')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const chartData = useMemo(() => {
    if (!data) return []
    return data.map((item) => ({
      ageGroup: item.age_group,
      label: item.label,
      count: item.count,
    }))
  }, [data])

  const totalResidents = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.count, 0)
  }, [chartData])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const count = payload[0].value
      const percentage = totalResidents > 0 ? Math.round((count / totalResidents) * 100) : 0
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900 mb-1">{data?.label || label}</p>
          <p className="text-xs text-gray-500 mb-1">{data?.ageGroup || ''}</p>
          <p className="text-sm text-gray-600">
            <span className="font-semibold">{count}</span> residents ({percentage}%)
          </p>
        </div>
      )
    }
    return null
  }


  if (loading) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Age Distribution</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="skeleton-card" style={{ height: '320px', width: '100%' }}>
            <div className="skeleton-line" style={{ width: '60%', height: '20px', marginBottom: '20px' }}></div>
            <div className="skeleton-line" style={{ width: '100%', height: '250px', marginBottom: '20px' }}></div>
            <div className="d-flex justify-content-between">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="skeleton-badge" style={{ width: '60px', height: '20px' }}></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Age Distribution</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-red-600">
            <Users className="w-12 h-12 mx-auto mb-2 text-red-400" />
            <p className="text-sm">Error loading age distribution data</p>
            <p className="text-xs text-gray-500 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!data || chartData.length === 0 || totalResidents === 0) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Age Distribution</h5>
        <div className="w-full h-80 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p className="text-sm">No data available</p>
            <p className="text-xs text-gray-400 mt-1">Resident data with birthdates is required to display age distribution</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card-modern p-4">
      <h5 className="h5 font-bold text-brand-primary mb-4">Age Distribution</h5>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="label"
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke="#666"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              domain={[0, 'dataMax + 1']}
              tickCount={6}
              allowDecimals={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[8, 8, 0, 0]} label={{ position: 'top', fill: '#374151', fontSize: 12, fontWeight: 600 }} fill={PRIMARY_COLOR}>
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">{totalResidents}</div>
            <div className="text-xs text-gray-500">Total Residents</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {chartData.filter(item => ['0-1', '1-3', '4-5', '6-11', '12-17'].includes(item.ageGroup))
                .reduce((sum, item) => sum + item.count, 0)}
            </div>
            <div className="text-xs text-gray-500">Under 18</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-600">
              {chartData.find(item => item.ageGroup === '60+')?.count || 0}
            </div>
            <div className="text-xs text-gray-500">Senior Citizens (60+)</div>
          </div>
        </div>
      </div>
    </div>
  )
}

