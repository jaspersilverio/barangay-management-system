import api from './api'

export type PurokPayload = {
  name: string
  captain: string
  contact: string
}

export async function listPuroks(params: { search?: string; page?: number }) {
  const res = await api.get('/puroks', { params })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getPurok(id: number | string) {
  const res = await api.get(`/puroks/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function createPurok(payload: PurokPayload) {
  const res = await api.post('/puroks', payload)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function updatePurok(id: number | string, payload: PurokPayload) {
  const res = await api.put(`/puroks/${id}`, payload)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function deletePurok(id: number | string) {
  const res = await api.delete(`/puroks/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}


