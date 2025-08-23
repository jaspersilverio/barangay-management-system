import React, { useEffect, useState } from 'react'
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

export default function MonthlyRegistrationsChart() {
  const [data, setData] = useState<MonthlyRegistrations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await getMonthlyRegistrations()
        if (response.success) {
          setData(response.data)
        } else {
          setError(response.message || 'Failed to fetch data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Data unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Monthly Registrations</h5>
          <div className="w-full h-80 animate-pulse bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Monthly Registrations</h5>
          <div className="w-full h-80 flex items-center justify-center text-red-600">
            Error: {error}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Monthly Registrations</h5>
          <div className="w-full h-80 flex items-center justify-center text-gray-500">
            No data available
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="col-span-12 lg:col-span-6">
      <div className="bg-white shadow rounded-lg p-4 flex flex-col">
        <h5 className="mb-4 font-semibold text-gray-900">Monthly Registrations</h5>
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area
                type="monotone"
                dataKey="households"
                stackId="1"
                stroke="#8884d8"
                fill="#8884d8"
                name="Households"
              />
              <Area
                type="monotone"
                dataKey="residents"
                stackId="1"
                stroke="#82ca9d"
                fill="#82ca9d"
                name="Residents"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
