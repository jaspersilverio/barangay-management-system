import api from './api'

export type Purok = {
  id: number
  name: string
  captain?: string | null
  contact?: string | null
  created_at: string
  updated_at: string
}

export type PurokFilters = {
  search?: string
  per_page?: number
  page?: number
}

export type CreatePurokPayload = {
  name: string
  captain?: string
  contact?: string
}

export type UpdatePurokPayload = Partial<CreatePurokPayload>

export async function getPuroks(filters: PurokFilters = {}) {
  const res = await api.get('/puroks', { params: filters })
  return res.data as { success: boolean; data: { data: Purok[]; total: number; per_page: number; current_page: number; last_page: number }; message: string | null; errors: any }
}

export async function getPurok(id: number) {
  const res = await api.get(`/puroks/${id}`)
  return res.data as { success: boolean; data: Purok; message: string | null; errors: any }
}

export async function createPurok(payload: CreatePurokPayload) {
  const res = await api.post('/puroks', payload)
  return res.data as { success: boolean; data: Purok; message: string | null; errors: any }
}

export async function updatePurok(id: number, payload: UpdatePurokPayload) {
  const res = await api.put(`/puroks/${id}`, payload)
  return res.data as { success: boolean; data: Purok; message: string | null; errors: any }
}

export async function deletePurok(id: number) {
  const res = await api.delete(`/puroks/${id}`)
  return res.data as { success: boolean; data: null; message: string | null; errors: any }
}


