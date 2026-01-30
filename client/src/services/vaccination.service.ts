import api from './api'
import type { Vaccination, VaccinationPayload, VaccinationFilters, VaccinationStatistics, ApiEnvelope } from '../types'

export async function getVaccinations(filters: VaccinationFilters = {}) {
  const res = await api.get('/vaccinations', { params: filters })
  return res.data as ApiEnvelope<{
    data: Vaccination[]
    current_page: number
    last_page: number
    per_page: number
    total: number
  }>
}

export async function getVaccination(id: number) {
  const res = await api.get(`/vaccinations/${id}`)
  return res.data as ApiEnvelope<Vaccination>
}

export async function createVaccination(payload: VaccinationPayload) {
  const res = await api.post('/vaccinations', payload)
  return res.data as ApiEnvelope<Vaccination>
}

export async function updateVaccination(id: number, payload: Partial<VaccinationPayload>) {
  const res = await api.put(`/vaccinations/${id}`, payload)
  return res.data as ApiEnvelope<Vaccination>
}

export async function deleteVaccination(id: number) {
  const res = await api.delete(`/vaccinations/${id}`)
  return res.data as ApiEnvelope<null>
}

export async function completeVaccination(id: number) {
  const res = await api.post(`/vaccinations/${id}/complete`)
  return res.data as ApiEnvelope<Vaccination>
}

export async function getResidentVaccinations(residentId: number) {
  const res = await api.get(`/residents/${residentId}/vaccinations`)
  return res.data as ApiEnvelope<Vaccination[]>
}

export async function getVaccinationStatistics(filters: { purok_id?: number; date_from?: string; date_to?: string } = {}) {
  const res = await api.get('/vaccinations/statistics', { params: filters })
  return res.data as ApiEnvelope<VaccinationStatistics>
}

// Common vaccine names for dropdown/autocomplete
export const COMMON_VACCINES = [
  'COVID-19',
  'BCG',
  'Hepatitis B',
  'DPT (Diphtheria, Pertussis, Tetanus)',
  'Polio',
  'Measles',
  'Mumps',
  'Rubella (MMR)',
  'Varicella (Chickenpox)',
  'Hepatitis A',
  'Influenza',
  'Pneumococcal',
  'Meningococcal',
  'HPV (Human Papillomavirus)',
  'Rotavirus',
  'Haemophilus influenzae type b (Hib)',
  'Tetanus Toxoid',
  'Rabies',
  'Japanese Encephalitis',
  'Yellow Fever',
  'Typhoid',
  'Cholera',
  'Other'
]

// Vaccination type options (dose logic is backend-driven)
export const VACCINATION_TYPES = [
  { value: 'fixed_dose', label: 'Fixed Dose' },
  { value: 'booster', label: 'Booster' },
  { value: 'annual', label: 'Annual' },
  { value: 'as_needed', label: 'As Needed' },
] as const

// Status options for filter (values match API computed_status: completed, scheduled, pending, overdue)
export const VACCINATION_STATUSES = [
  { value: 'completed', label: 'Completed' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'pending', label: 'Pending' },
  { value: 'overdue', label: 'Overdue' },
] as const

// Age group options
export const AGE_GROUPS = [
  { value: 'children', label: 'Children (0-17)' },
  { value: 'adults', label: 'Adults (18-59)' },
  { value: 'seniors', label: 'Seniors (60+)' }
] as const

export const vaccinationService = {
  getVaccinations,
  getVaccination,
  createVaccination,
  updateVaccination,
  completeVaccination,
  deleteVaccination,
  getResidentVaccinations,
  getVaccinationStatistics,
  COMMON_VACCINES,
  VACCINATION_TYPES,
  VACCINATION_STATUSES,
  AGE_GROUPS
}
