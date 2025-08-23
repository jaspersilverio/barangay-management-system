import React from 'react'
import DashboardSummary from '../components/dashboard/DashboardSummary'
import DashboardCharts from '../components/dashboard/DashboardCharts'
import MonthlyRegistrationsChart from '../components/dashboard/MonthlyRegistrationsChart'
import VulnerabilityTrendsChart from '../components/dashboard/VulnerabilityTrendsChart'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivities from '../components/dashboard/RecentActivities'
import UpcomingEvents from '../components/dashboard/UpcomingEvents'
import StatusCards from '../components/dashboard/StatusCards'

export default function Dashboard() {
  return (
    <main className="p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Top row: Summary cards */}
        <DashboardSummary />
        
        {/* Middle row: Basic charts */}
        <DashboardCharts />
        
        {/* Next row: Advanced charts */}
        <MonthlyRegistrationsChart />
        <VulnerabilityTrendsChart />
        
        {/* Bottom row: Quick actions, activities, and events */}
        <QuickActions />
        <RecentActivities />
        <UpcomingEvents />
        
        {/* Last row: Status cards */}
        <StatusCards />
      </div>
    </main>
  )
}


