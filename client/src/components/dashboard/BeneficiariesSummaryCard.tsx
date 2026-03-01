import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { getBeneficiariesSummary, getDashboardCached, setDashboardCached } from '../../services/dashboard.service'
import type { BeneficiariesSummary } from '../../services/dashboard.service'
import { useDashboard } from '../../context/DashboardContext'
import SummaryCard from './SummaryCard'

const CACHE_KEY = 'beneficiariesSummary'

function getCached() {
  return getDashboardCached<BeneficiariesSummary>(CACHE_KEY) ?? null
}

export default function BeneficiariesSummaryCard() {
  const { refreshTrigger } = useDashboard()
  const [data, setData] = useState<BeneficiariesSummary | null>(() => getCached())
  const [loading, setLoading] = useState(() => getCached() == null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = getDashboardCached<BeneficiariesSummary>(CACHE_KEY)
    if (cached != null) {
      setData(cached)
      setLoading(false)
      return
    }
    setLoading(true)
    let cancelled = false
    const fetchData = async () => {
      try {
        setError(null)
        const response = await getBeneficiariesSummary()
        if (cancelled) return
        if (response.success) {
          setData(response.data)
          setDashboardCached(CACHE_KEY, response.data)
        } else {
          setError(response.message || 'Failed to fetch beneficiaries data')
        }
      } catch (err: unknown) {
        if (cancelled) return
        const message = err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null
        setError(message || 'Beneficiaries data unavailable')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [refreshTrigger])

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

  if (error) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="card-modern p-4 text-center text-danger small">{error}</div>
      </div>
    )
  }

  const categoryText = data?.categories
    ?.filter((cat: any) => cat.count > 0)
    ?.map((cat: any) => `${cat.name}: ${cat.count}`)
    ?.join(', ') || 'No beneficiaries registered'

  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <SummaryCard
        title="Total Beneficiaries"
        value={data?.total || 0}
        subtext={categoryText}
        icon={<Gift className="w-6 h-6" />}
        color="info"
      />
    </div>
  )
}

