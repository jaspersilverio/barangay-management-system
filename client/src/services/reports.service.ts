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
  captain: string  // This is the database field name, but UI shows "Leader"
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
  search?: string
}

export type ExportRequest = {
  type: 'pdf'
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

export async function exportResidentsCsv(filters: ReportFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
  if (filters.sex) params.append('sex', filters.sex)
  if (filters.vulnerabilities) params.append('vulnerabilities', filters.vulnerabilities)
  if (filters.search) params.append('search', filters.search)

  const res = await api.get(`/reports/residents/export/csv?${params.toString()}`, {
    responseType: 'blob',
  })
  
  // Handle blob response (file download)
  if (res.data instanceof Blob) {
    const blob = new Blob([res.data], { 
      type: 'text/csv; charset=UTF-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `residents_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true, message: 'CSV export downloaded successfully' }
  }
  
  throw new Error('Failed to download CSV export')
}

export async function exportPuroksCsv() {
  const res = await api.get('/reports/puroks/export/csv', {
    responseType: 'blob',
  })
  
  // Handle blob response (file download)
  if (res.data instanceof Blob) {
    const blob = new Blob([res.data], { 
      type: 'text/csv; charset=UTF-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `puroks_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true, message: 'CSV export downloaded successfully' }
  }
  
  throw new Error('Failed to download CSV export')
}

export async function exportSoloParentsCsv(filters: { search?: string; purok_id?: string; status?: string } = {}) {
  const params = new URLSearchParams()
  
  if (filters.search) params.append('search', filters.search)
  if (filters.purok_id) params.append('purok_id', filters.purok_id)
  if (filters.status) params.append('status', filters.status)

  const res = await api.get(`/reports/solo-parents/export/csv?${params.toString()}`, {
    responseType: 'blob',
  })
  
  // Handle blob response (file download)
  if (res.data instanceof Blob) {
    const blob = new Blob([res.data], { 
      type: 'text/csv; charset=UTF-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `solo_parents_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true, message: 'CSV export downloaded successfully' }
  }
  
  throw new Error('Failed to download CSV export')
}

export async function exportHouseholdsCsv(filters: ReportFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
  if (filters.search) params.append('search', filters.search)

  const res = await api.get(`/reports/households/export/csv?${params.toString()}`, {
    responseType: 'blob',
  })
  
  // Handle blob response (file download)
  if (res.data instanceof Blob) {
    const blob = new Blob([res.data], { 
      type: 'text/csv; charset=UTF-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `household_report_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true, message: 'CSV export downloaded successfully' }
  }
  
  throw new Error('Failed to download CSV export')
}

export type VaccinationReportFilters = {
  purok_id?: number | string
  status?: string
  vaccine_name?: string
  date_from?: string
  date_to?: string
  age_group?: string
  search?: string
}

export async function exportVaccinationsCsv(filters: VaccinationReportFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
  if (filters.status) params.append('status', filters.status)
  if (filters.vaccine_name) params.append('vaccine_name', filters.vaccine_name)
  if (filters.date_from) params.append('date_from', filters.date_from)
  if (filters.date_to) params.append('date_to', filters.date_to)
  if (filters.age_group) params.append('age_group', filters.age_group)
  if (filters.search) params.append('search', filters.search)

  const res = await api.get(`/reports/vaccinations/export/csv?${params.toString()}`, {
    responseType: 'blob',
  })
  
  // Handle blob response (file download)
  if (res.data instanceof Blob) {
    const blob = new Blob([res.data], { 
      type: 'text/csv; charset=UTF-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vaccination_records_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    return { success: true, message: 'CSV export downloaded successfully' }
  }
  
  throw new Error('Failed to download CSV export')
}

export async function exportBlottersCsv(filters: { status?: string; start_date?: string; end_date?: string; search?: string } = {}) {
  const params = new URLSearchParams()

  if (filters.status) params.append('status', filters.status)
  if (filters.start_date) params.append('start_date', filters.start_date)
  if (filters.end_date) params.append('end_date', filters.end_date)
  if (filters.search) params.append('search', filters.search)

  const res = await api.get(`/reports/blotters/export/csv?${params.toString()}`, {
    responseType: 'blob',
  })

  if (res.data instanceof Blob) {
    const blob = new Blob([res.data], {
      type: 'text/csv; charset=UTF-8'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blotter_records_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true, message: 'CSV export downloaded successfully' }
  }

  throw new Error('Failed to download CSV export')
}
