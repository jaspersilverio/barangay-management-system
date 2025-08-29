import { Users, Home, MapPin, Calendar } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext'
import SummaryCard from './SummaryCard'

export default function DashboardSummary() {
  const { summaryData, loading } = useDashboard()

  if (loading) {
    return (
      <div className="row g-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-3">
            <div className="card-modern animate-pulse">
              <div className="h-8 bg-neutral-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!summaryData) {
    return (
      <div className="row g-4">
        <div className="col-12">
          <div className="card-modern text-center text-neutral-500">
            No summary data available
          </div>
        </div>
      </div>
    )
  }

  const totalVulnerable = summaryData.vulnerable_population.seniors +
    summaryData.vulnerable_population.pwd +
    summaryData.vulnerable_population.pregnant +
    summaryData.vulnerable_population.infants

  return (
    <div className="row g-4">
      <div className="col-12 col-sm-6 col-lg-3">
        <SummaryCard
          title="Total Households"
          value={summaryData.total_households}
          subtext="Registered households"
          icon={<Home className="w-6 h-6" />}
          color="primary"
        />
      </div>
      
      <div className="col-12 col-sm-6 col-lg-3">
        <SummaryCard
          title="Total Residents"
          value={summaryData.total_residents}
          subtext="Registered residents"
          icon={<Users className="w-6 h-6" />}
          color="success"
        />
      </div>
      
      <div className="col-12 col-sm-6 col-lg-3">
        <SummaryCard
          title="Active Puroks"
          value={summaryData.active_puroks}
          subtext="Operational puroks"
          icon={<MapPin className="w-6 h-6" />}
          color="info"
        />
      </div>
      
      <div className="col-12 col-sm-6 col-lg-3">
        <SummaryCard
          title="Vulnerable Population"
          value={totalVulnerable}
          subtext="Seniors, PWD, Pregnant, Infants"
          icon={<Calendar className="w-6 h-6" />}
          color="warning"
        />
      </div>
    </div>
  )
}


