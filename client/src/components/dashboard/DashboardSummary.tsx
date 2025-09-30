import { Users, Home, Calendar } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext'
import SummaryCard from './SummaryCard'

export default function DashboardSummary() {
  const { summaryData, loading } = useDashboard()

  if (loading) {
    return (
      <>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="col-12 col-sm-6 col-lg-4">
            <div className="skeleton-card" style={{ height: '120px' }}>
              <div className="d-flex align-items-center mb-3">
                <div className="skeleton-circle" style={{ width: '40px', height: '40px', marginRight: '12px' }}></div>
                <div className="skeleton-line" style={{ width: '60%', height: '18px' }}></div>
              </div>
              <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '8px' }}></div>
              <div className="skeleton-line" style={{ width: '30%', height: '14px' }}></div>
            </div>
          </div>
        ))}
      </>
    )
  }

  if (!summaryData) {
    return (
      <div className="col-12">
        <div className="card-modern text-center text-neutral-500">
          No summary data available
        </div>
      </div>
    )
  }

  const totalVulnerable = summaryData.vulnerable_population.seniors +
    summaryData.vulnerable_population.pwd +
    summaryData.vulnerable_population.pregnant +
    summaryData.vulnerable_population.infants

  return (
    <>
      <div className="col-12 col-sm-6 col-lg-4">
        <SummaryCard
          title="Total Households"
          value={summaryData.total_households}
          subtext="Registered households"
          icon={<Home className="w-6 h-6" />}
          color="primary"
        />
      </div>
      
      <div className="col-12 col-sm-6 col-lg-4">
        <SummaryCard
          title="Total Residents"
          value={summaryData.total_residents}
          subtext="Registered residents"
          icon={<Users className="w-6 h-6" />}
          color="success"
        />
      </div>
      
      <div className="col-12 col-sm-6 col-lg-4">
        <SummaryCard
          title="Vulnerable Population"
          value={totalVulnerable}
          subtext="Seniors, PWD, Pregnant, Infants"
          icon={<Calendar className="w-6 h-6" />}
          color="warning"
        />
      </div>
    </>
  )
}


