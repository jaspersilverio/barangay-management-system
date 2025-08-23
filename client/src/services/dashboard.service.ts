import api from './api'

export type DashboardSummary = {
  total_households: number
  total_residents: number
  vulnerable_population: {
    seniors: number
    pwd: number
    pregnant: number
    infants: number
  }
  active_puroks: number
}

export async function getSummary() {
  const res = await api.get('/dashboard/summary')
  return res.data as { success: boolean; data: DashboardSummary; message: string | null; errors: any }
}

export type DashboardAnalytics = {
  households_by_purok: Array<{ purok: string; count: number }>
  residents_by_age_group: {
    children: number
    adults: number
    seniors: number
  }
  monthly_registrations: Array<{ month: string; residents: number }>
  vulnerable_trends: Array<{
    month: string
    seniors: number
    pwd: number
    infants: number
  }>
}

export async function getAnalytics() {
  const res = await api.get('/dashboard/analytics')
  return res.data as { success: boolean; data: DashboardAnalytics; message: string | null; errors: any }
}

export type MonthlyRegistrations = Array<{
  month: string
  households: number
  residents: number
}>

export type VulnerabilityTrends = Array<{
  month: string
  seniors: number
  pwd: number
  pregnant: number
  infants: number
}>

export type RecentActivity = {
  action: string
  table: string
  timestamp: string
  description: string
}

export type UpcomingEvent = {
  title: string
  date: string
  time: string
  location: string
  type: string
}

export async function getMonthlyRegistrations() {
  const res = await api.get('/dashboard/monthly-registrations')
  return res.data as { success: boolean; data: MonthlyRegistrations; message: string | null; errors: any }
}

export async function getVulnerabilityTrends() {
  const res = await api.get('/dashboard/vulnerable-trends')
  return res.data as { success: boolean; data: VulnerabilityTrends; message: string | null; errors: any }
}

export async function getRecentActivities() {
  const res = await api.get('/dashboard/recent-activities')
  return res.data as { success: boolean; data: RecentActivity[]; message: string | null; errors: any }
}

export async function getUpcomingEvents() {
  const res = await api.get('/dashboard/upcoming-events')
  return res.data as { success: boolean; data: UpcomingEvent[]; message: string | null; errors: any }
}


