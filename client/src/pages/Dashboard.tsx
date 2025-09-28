
import DashboardSummary from '../components/dashboard/DashboardSummary'
import VaccinationSummaryCard from '../components/dashboard/VaccinationSummaryCard'
import BlotterSummaryCard from '../components/dashboard/BlotterSummaryCard'
import DashboardCharts from '../components/dashboard/DashboardCharts'
import ResidentsByPurokChart from '../components/dashboard/ResidentsByPurokChart'
import VaccinationStatusChart from '../components/dashboard/VaccinationStatusChart'
import BlotterTrendChart from '../components/dashboard/BlotterTrendChart'
import MonthlyRegistrationsChart from '../components/dashboard/MonthlyRegistrationsChart'
import VulnerabilityTrendsChart from '../components/dashboard/VulnerabilityTrendsChart'
import QuickActions from '../components/dashboard/QuickActions'
import RecentActivities from '../components/dashboard/RecentActivities'
import UpcomingEvents from '../components/dashboard/UpcomingEvents'
import StatusCards from '../components/dashboard/StatusCards'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid p-6">
        <div className="mb-6">
          <h1 className="h2 text-neutral-800 font-bold mb-2">Dashboard</h1>
          <p className="text-neutral-600">Welcome to your barangay management dashboard</p>
        </div>

        {/* Summary Cards Section */}
        <div className="mb-6">
          <div className="row g-4">
            <DashboardSummary />
            <VaccinationSummaryCard />
            <BlotterSummaryCard />
          </div>
        </div>

        {/* Charts Section - Row 1 */}
        <div className="row g-6 mb-6">
          {/* Households by Purok Chart */}
          <div className="col-12 col-lg-6">
            <div className="card-modern">
              <h5 className="h5 font-bold text-neutral-800 mb-4">Households by Purok</h5>
              <div className="w-full h-80">
                <DashboardCharts />
              </div>
            </div>
          </div>
          
          {/* Residents by Purok Chart */}
          <div className="col-12 col-lg-6">
            <div className="card-modern">
              <h5 className="h5 font-bold text-neutral-800 mb-4">Residents by Purok</h5>
              <div className="w-full h-80">
                <ResidentsByPurokChart />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Row 2 */}
        <div className="row g-6 mb-6">
          {/* Monthly Registrations Chart */}
          <div className="col-12 col-lg-6">
            <MonthlyRegistrationsChart />
          </div>
          
          {/* Vulnerability Trends Chart */}
          <div className="col-12 col-lg-6">
            <VulnerabilityTrendsChart />
          </div>
        </div>

        {/* Charts Section - Row 3 */}
        <div className="row g-6 mb-6">
          {/* Vaccination Status Chart */}
          <div className="col-12 col-lg-6">
            <VaccinationStatusChart />
          </div>
          
          {/* Blotter Trend Chart */}
          <div className="col-12 col-lg-6">
            <BlotterTrendChart />
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="row g-6 mb-6">
          <div className="col-12 col-lg-4">
            <QuickActions />
          </div>
          
          <div className="col-12 col-lg-4">
            <RecentActivities />
          </div>
          
          <div className="col-12 col-lg-4">
            <UpcomingEvents />
          </div>
        </div>

        {/* Status Cards Section */}
        <div className="row g-6">
          <div className="col-12">
            <StatusCards />
          </div>
        </div>
      </div>
    </div>
  )
}


