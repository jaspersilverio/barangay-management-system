import api from './api'

/** Session cache so purok list shows immediately when navigating back (no loading) */
const puroksListCache: Record<string, unknown> = {}

export function getPuroksListCached<T = unknown>(key: string): T | undefined {
  return puroksListCache[key] as T | undefined
}

export function setPuroksListCached(key: string, value: unknown): void {
  puroksListCache[key] = value
}

export function clearPuroksListCache(): void {
  Object.keys(puroksListCache).forEach((k) => delete puroksListCache[k])
}

export type Purok = {
  id: number
  name: string
  captain?: string | null  // This is the database field name, but UI shows "Leader"
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
  captain?: string  // This is the database field name, but UI shows "Leader"
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


