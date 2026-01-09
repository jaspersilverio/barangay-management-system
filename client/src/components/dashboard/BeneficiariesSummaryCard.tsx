import { useEffect, useState } from 'react'
import { Gift } from 'lucide-react'
import { getBeneficiariesSummary } from '../../services/dashboard.service'
import SummaryCard from './SummaryCard'

export default function BeneficiariesSummaryCard() {
  const [data, setData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null)
        const response = await getBeneficiariesSummary()
        if (response.success) {
          setData(response.data)
        } else {
          setError(response.message || 'Failed to fetch beneficiaries data')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Beneficiaries data unavailable')
      }
    }

    fetchData()
  }, [])

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

