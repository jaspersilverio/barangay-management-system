import api from './api'

export type HouseholdReport = {
  id: number
  address: string
  property_type: string
  head_name: string
  contact: string
  purok_id: number
  member_count: number
  created_at: string
  updated_at: string
  purok: {
    id: number
    name: string
  }
  residents: Array<{
    id: number
    first_name: string
    middle_name: string
    last_name: string
    sex: string
    birthdate: string
    relationship_to_head: string
    occupation_status: string
    is_pwd: boolean
  }>
}

export type ResidentReport = {
  id: number
  household_id: number
  first_name: string
  middle_name: string
  last_name: string
  sex: string
  birthdate: string
  relationship_to_head: string
  occupation_status: string
  is_pwd: boolean
  created_at: string
  updated_at: string
  purok_name: string
  household: {
    id: number
    address: string
    head_name: string
    purok: {
      id: number
      name: string
    }
  }
}

export type PurokReport = {
  id: number
  name: string
  captain: string
  contact: string
  household_count: number
  resident_count: number
  male_count: number
  female_count: number
  senior_count: number
  child_count: number
  pwd_count: number
}

export type ReportFilters = {
  date_from?: string
  date_to?: string
  purok_id?: number
  sex?: string
  vulnerabilities?: string
  per_page?: number
}

export type ExportRequest = {
  type: 'pdf' | 'excel'
  reportType: 'households' | 'residents' | 'puroks'
  filters?: ReportFilters
}

export async function getHouseholdsReport(filters: ReportFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
  if (filters.per_page) params.append('per_page', filters.per_page.toString())

  const res = await api.get(`/reports/households?${params.toString()}`)
  return res.data as { success: boolean; data: { data: HouseholdReport[]; current_page: number; last_page: number; per_page: number; total: number }; message: string | null; errors: any }
}

export async function getResidentsReport(filters: ReportFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
  if (filters.sex) params.append('sex', filters.sex)
  if (filters.vulnerabilities) params.append('vulnerabilities', filters.vulnerabilities)
  if (filters.per_page) params.append('per_page', filters.per_page.toString())

  const res = await api.get(`/reports/residents?${params.toString()}`)
  return res.data as { success: boolean; data: { data: ResidentReport[]; current_page: number; last_page: number; per_page: number; total: number }; message: string | null; errors: any }
}

export async function getPuroksReport() {
  const res = await api.get('/reports/puroks')
  return res.data as { success: boolean; data: PurokReport[]; message: string | null; errors: any }
}

export async function exportReport(exportRequest: ExportRequest) {
  const res = await api.post('/reports/export', exportRequest)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}
