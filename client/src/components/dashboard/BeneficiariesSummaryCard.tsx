import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { getBeneficiariesSummary, getDashboardCached, setDashboardCached } from '../../services/dashboard.service'
import type { BeneficiariesSummary } from '../../services/dashboard.service'
import SummaryCard from './SummaryCard'

const CACHE_KEY = 'beneficiariesSummary'

export default function BeneficiariesSummaryCard() {
  const [data, setData] = useState<BeneficiariesSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = getDashboardCached<BeneficiariesSummary>(CACHE_KEY)
    if (cached != null) {
      setData(cached)
      setLoading(false)
      // Still refetch in background to ensure data is fresh
      const fetchData = async () => {
        try {
          const response = await getBeneficiariesSummary()
          if (response.success) {
            setData(response.data)
            setDashboardCached(CACHE_KEY, response.data)
          }
        } catch (err) {
          // Silent fail - keep showing cached data
        }
      }
      fetchData()
      return
    }
    const fetchData = async () => {
      try {
        setError(null)
        const response = await getBeneficiariesSummary()
        if (response.success) {
          setData(response.data)
          setDashboardCached(CACHE_KEY, response.data)
        } else {
          setError(response.message || 'Failed to fetch beneficiaries data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Beneficiaries data unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

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

