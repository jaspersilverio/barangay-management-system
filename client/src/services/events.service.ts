import api from './api'

export type Event = {
  id: number
  title: string
  date: string
  location: string
  description?: string
  created_by?: number
  purok_id?: number | null
  purok?: {
    id: number
    name: string
  } | null
  created_at: string
  updated_at: string
}

export type CreateEventPayload = {
  title: string
  date: string
  location: string
  description?: string
  purok_id?: number | null
}

export type UpdateEventPayload = CreateEventPayload

export async function getEvents(upcoming: boolean = true) {
  const res = await api.get(`/events?upcoming=${upcoming}`)
  return res.data as { success: boolean; data: Event[]; message: string | null; errors: any }
}

export async function getEvent(id: number) {
  const res = await api.get(`/events/${id}`)
  return res.data as { success: boolean; data: Event; message: string | null; errors: any }
}

export async function createEvent(payload: CreateEventPayload) {
  const res = await api.post('/events', payload)
  return res.data as { success: boolean; data: Event; message: string | null; errors: any }
}

export async function updateEvent(id: number, payload: UpdateEventPayload) {
  const res = await api.put(`/events/${id}`, payload)
  return res.data as { success: boolean; data: Event; message: string | null; errors: any }
}

export async function deleteEvent(id: number) {
  const res = await api.delete(`/events/${id}`)
  return res.data as { success: boolean; data: null; message: string | null; errors: any }
}
