import React, { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { getAnalytics } from '../../services/dashboard.service'
import type { DashboardAnalytics } from '../../services/dashboard.service'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardCharts() {
  const [analyticsData, setAnalyticsData] = useState<DashboardAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        const response = await getAnalytics()
        if (response.success) {
          setAnalyticsData(response.data)
        } else {
          setError(response.message || 'Failed to fetch analytics data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Analytics data unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-span-6 bg-white shadow rounded-lg p-4 animate-pulse h-80"></div>
        ))}
      </>
    )
  }

  if (error) {
    return <div className="col-span-12 p-6 text-red-600">Error: {error}</div>
  }

  if (!analyticsData) {
    return <div className="col-span-12 p-6 text-gray-500">No analytics data available.</div>
  }

  // Prepare data for pie chart
  const ageGroupData = [
    { name: 'Children', value: analyticsData.residents_by_age_group.children },
    { name: 'Adults', value: analyticsData.residents_by_age_group.adults },
    { name: 'Seniors', value: analyticsData.residents_by_age_group.seniors },
  ]

  return (
    <>
      {/* Top row charts */}
      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Households by Purok</h5>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analyticsData.households_by_purok}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="purok" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Residents by Age Group</h5>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ageGroupData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageGroupData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


    </>
  )
}
