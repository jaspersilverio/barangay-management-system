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
}

export async function listResidents(params: { search?: string; page?: number }) {
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
