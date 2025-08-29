import React from 'react'
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
        <YAxis />
        <Tooltip />
        <Bar dataKey="count" fill="#3B82F6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
