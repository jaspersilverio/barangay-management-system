import { Syringe } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext'
import SummaryCard from './SummaryCard'

export default function VaccinationSummaryCard() {
  const { summaryData, loading } = useDashboard()

  if (loading) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="card-modern animate-pulse">
          <div className="h-8 bg-neutral-200 rounded w-1/2 mb-2"></div>
          <div className="h-6 bg-neutral-200 rounded w-1/3"></div>
        </div>
      </div>
    )
  }

  if (!summaryData?.vaccination_summary) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="card-modern text-center text-neutral-500">
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
