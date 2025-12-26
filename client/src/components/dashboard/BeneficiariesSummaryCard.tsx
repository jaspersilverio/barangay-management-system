import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { getBeneficiariesSummary } from '../../services/dashboard.service'
import SummaryCard from './SummaryCard'

export default function BeneficiariesSummaryCard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await getBeneficiariesSummary()
        if (response.success) {
          setData(response.data)
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

  if (error || !data) {
    return (
      <div className="col-12 col-sm-6 col-lg-4">
        <div className="card-modern p-4 text-center text-brand-muted">
          <div className="flex items-center justify-center mb-2">
            <Gift className="w-6 h-6 text-neutral-400" />
          </div>
          <div className="text-sm">No beneficiaries data available</div>
        </div>
      </div>
    )
  }

  const categoryText = data.categories
    .filter((cat: any) => cat.count > 0)
    .map((cat: any) => `${cat.name}: ${cat.count}`)
    .join(', ')

  return (
    <div className="col-12 col-sm-6 col-lg-4">
      <SummaryCard
        title="Total Beneficiaries"
        value={data.total}
        subtext={categoryText || 'No beneficiaries registered'}
        icon={<Gift className="w-6 h-6" />}
        color="info"
      />
    </div>
  )
}

