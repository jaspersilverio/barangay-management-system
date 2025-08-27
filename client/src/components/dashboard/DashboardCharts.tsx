import React from 'react'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { useDashboard } from '../../context/DashboardContext'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

export default function DashboardCharts() {
  const { summaryData, loading, error } = useDashboard()

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

  if (!summaryData) {
    return <div className="col-span-12 p-6 text-gray-500">No summary data available.</div>
  }

  // Prepare data for pie chart (vulnerable population)
  const vulnerableData = [
    { name: 'Seniors', value: summaryData.vulnerable_population.seniors },
    { name: 'PWD', value: summaryData.vulnerable_population.pwd },
    { name: 'Pregnant', value: summaryData.vulnerable_population.pregnant },
    { name: 'Infants', value: summaryData.vulnerable_population.infants },
  ].filter(item => item.value > 0) // Only show categories with data

  return (
    <>
      {/* Top row charts */}
      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Households by Purok</h5>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData.households_by_purok}>
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
          <h5 className="mb-4 font-semibold text-gray-900">Residents by Purok</h5>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData.residents_by_purok}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="purok" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row charts */}
      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Vulnerable Population</h5>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={vulnerableData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {vulnerableData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="col-span-12 lg:col-span-6">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Population Overview</h5>
          <div className="grid grid-cols-2 gap-4 h-80">
            <div className="flex flex-col justify-center items-center bg-blue-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-blue-600">{summaryData.total_households}</div>
              <div className="text-sm text-gray-600">Total Households</div>
            </div>
            <div className="flex flex-col justify-center items-center bg-green-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-green-600">{summaryData.total_residents}</div>
              <div className="text-sm text-gray-600">Total Residents</div>
            </div>
            <div className="flex flex-col justify-center items-center bg-purple-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-purple-600">{summaryData.active_puroks}</div>
              <div className="text-sm text-gray-600">Active Puroks</div>
            </div>
            <div className="flex flex-col justify-center items-center bg-orange-50 rounded-lg p-4">
              <div className="text-3xl font-bold text-orange-600">
                {summaryData.vulnerable_population.seniors + 
                 summaryData.vulnerable_population.pwd + 
                 summaryData.vulnerable_population.pregnant + 
                 summaryData.vulnerable_population.infants}
              </div>
              <div className="text-sm text-gray-600">Vulnerable</div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
