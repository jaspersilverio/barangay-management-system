import React, { useEffect, useState } from 'react'
import SummaryCard from './SummaryCard'
import { Home, Users, Heart, MapPin } from 'lucide-react'
import { getSummary } from '../../services/dashboard.service'
import type { DashboardSummary as DashboardSummaryType } from '../../services/dashboard.service'

export default function DashboardSummary() {
  const [data, setData] = useState<DashboardSummaryType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getSummary()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const totalVulnerable = data
    ? data.vulnerable_population.seniors +
      data.vulnerable_population.pwd +
      data.vulnerable_population.pregnant +
      data.vulnerable_population.infants
    : 0

  return (
    <div className="col-span-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        title="Total Households"
        value={loading ? '—' : (data ? data.total_households : 'Data unavailable')}
        subtext={"+5 this month"}
        icon={<Home className="h-6 w-6" aria-hidden="true" />}
      />
      <SummaryCard
        title="Total Residents"
        value={loading ? '—' : (data ? data.total_residents : 'Data unavailable')}
        subtext={loading ? '' : (data ? `Across ${data.active_puroks} puroks` : 'Data unavailable')}
        icon={<Users className="h-6 w-6" aria-hidden="true" />}
      />
      <SummaryCard
        title="Vulnerable Population"
        value={loading ? '—' : (data ? totalVulnerable : 'Data unavailable')}
        subtext={loading ? '' : (data ? `Seniors: ${data.vulnerable_population.seniors}, PWD: ${data.vulnerable_population.pwd}, Pregnant: ${data.vulnerable_population.pregnant}, Infants: ${data.vulnerable_population.infants}` : 'Data unavailable')}
        icon={<Heart className="h-6 w-6" aria-hidden="true" />}
      />
      <SummaryCard
        title="Active Puroks"
        value={loading ? '—' : (data ? `${data.active_puroks}/${data.active_puroks}` : 'Data unavailable')}
        subtext={data ? "All puroks operational" : 'Data unavailable'}
        icon={<MapPin className="h-6 w-6" aria-hidden="true" />}
      />
    </div>
  )
}


