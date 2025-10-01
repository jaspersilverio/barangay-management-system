import { Syringe } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext'
import SummaryCard from './SummaryCard'

export default function VaccinationSummaryCard() {
  const { summaryData, loading } = useDashboard()

  if (loading) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="skeleton-card" style={{ height: '120px' }}>
          <div className="d-flex align-items-center mb-3">
            <div className="skeleton-circle" style={{ width: '40px', height: '40px', marginRight: '12px' }}></div>
            <div className="skeleton-line" style={{ width: '60%', height: '18px' }}></div>
          </div>
          <div className="skeleton-line" style={{ width: '40%', height: '24px', marginBottom: '8px' }}></div>
          <div className="skeleton-line" style={{ width: '30%', height: '14px' }}></div>
        </div>
      </div>
    )
  }

  if (!summaryData?.vaccination_summary) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="card-modern p-4 text-center text-brand-muted">
          <div className="flex items-center justify-center mb-2">
            <Syringe className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="text-sm">No vaccination data available</div>
        </div>
      </div>
    )
  }

  const { completed, total } = summaryData.vaccination_summary
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <SummaryCard
        title="Vaccinations Completed"
        value={completed}
        subtext={`${percentage}% of residents fully vaccinated`}
        icon={<Syringe className="w-6 h-6" />}
        color="success"
      />
    </div>
  )
}
