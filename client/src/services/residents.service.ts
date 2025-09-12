import api from './api'

export type ResidentPayload = {
  household_id: number
  first_name: string
  middle_name?: string | null
  last_name: string
  sex: 'male' | 'female' | 'other'
  birthdate: string
  relationship_to_head: string
  occupation_status: 'employed' | 'unemployed' | 'student' | 'retired' | 'other'
  is_pwd: boolean
  purok_id?: string | number
}

export async function listResidents(params: { search?: string; page?: number; purok_id?: string | number; per_page?: number }) {
  const res = await api.get('/residents', { params })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getResident(id: number | string) {
  const res = await api.get(`/residents/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function createResident(payload: ResidentPayload) {
  const res = await api.post('/residents', payload)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function updateResident(id: number | string, payload: Partial<ResidentPayload>) {
  const res = await api.put(`/residents/${id}`, payload)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function deleteResident(id: number | string) {
  const res = await api.delete(`/residents/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function searchResidents(query: string) {
  const res = await api.get('/residents/search', { params: { query } })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function linkResidentToHousehold(residentId: number, householdId: number) {
  const res = await api.post('/residents/link-to-household', { resident_id: residentId, household_id: householdId })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export const residentsService = {
  getResidents: listResidents,
  getResident: getResident,
  createResident: createResident,
  updateResident: updateResident,
  deleteResident: deleteResident,
  searchResidents: searchResidents,
  linkResidentToHousehold: linkResidentToHousehold
}