import { FileText } from 'lucide-react'
import { useDashboard } from '../../context/DashboardContext'
import SummaryCard from './SummaryCard'

export default function BlotterSummaryCard() {
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

  if (!summaryData?.blotter_summary) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="card-modern text-center text-neutral-500">
          <div className="flex items-center justify-center mb-2">
            <FileText className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="text-sm">No blotter data available</div>
        </div>
      </div>
    )
  }

  const { active, resolvedThisMonth } = summaryData.blotter_summary

  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <SummaryCard
        title="Active Blotter Cases"
        value={active}
        subtext={`${resolvedThisMonth} resolved this month`}
        icon={<FileText className="w-6 h-6" />}
        color="warning"
      />
    </div>
  )
}
