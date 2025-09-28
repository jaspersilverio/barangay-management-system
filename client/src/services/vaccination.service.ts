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

// Common dose numbers
export const COMMON_DOSE_NUMBERS = [
  '1st Dose',
  '2nd Dose',
  '3rd Dose',
  '4th Dose',
  '5th Dose',
  'Booster',
  'Annual',
  'As Needed'
]

// Status options
export const VACCINATION_STATUSES = [
  { value: 'Completed', label: 'Completed' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Scheduled', label: 'Scheduled' }
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
  deleteVaccination,
  getResidentVaccinations,
  getVaccinationStatistics,
  COMMON_VACCINES,
  COMMON_DOSE_NUMBERS,
  VACCINATION_STATUSES,
  AGE_GROUPS
}
