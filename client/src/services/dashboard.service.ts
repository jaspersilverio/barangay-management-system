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
  residents_by_purok: Array<{ purok: string; count: number }>
  households_by_purok: Array<{ purok: string; count: number }>
  vaccination_summary: {
    completed: number
    scheduled: number
    pending: number
    overdue: number
    total: number
  }
  blotter_summary: {
    active: number
    resolvedThisMonth: number
  }
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

export type VaccinationSummary = {
  completed: number
  pending: number
  scheduled: number
  total: number
}

export async function getVaccinationSummary() {
  const res = await api.get('/dashboard/vaccinations/summary')
  return res.data as { success: boolean; data: VaccinationSummary; message: string | null; errors: any }
}

export type BlotterSummary = {
  active: number
  resolvedThisMonth: number
  monthlyTrend: Array<{
    month: string
    open: number
    ongoing: number
    resolved: number
  }>
}

export async function getBlotterSummary() {
  const res = await api.get('/dashboard/blotters/summary')
  return res.data as { success: boolean; data: BlotterSummary; message: string | null; errors: any }
}

export type AgeDistribution = Array<{
  age_group: string
  label: string
  count: number
}>

export async function getAgeDistribution() {
  const res = await api.get('/dashboard/age-distribution')
  return res.data as { success: boolean; data: AgeDistribution; message: string | null; errors: any }
}

export type BeneficiariesSummary = {
  total: number
  categories: Array<{
    name: string
    count: number
  }>
}

export async function getBeneficiariesSummary() {
  const res = await api.get('/dashboard/beneficiaries')
  return res.data as { success: boolean; data: BeneficiariesSummary; message: string | null; errors: any }
}


