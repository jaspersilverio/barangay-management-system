import api from './api'

export type Announcement = {
  id: number
  title: string
  content: string
  created_by: number
  created_at: string
  updated_at: string
  creator?: {
    id: number
    name: string
  }
}

export type AnnouncementPayload = {
  title: string
  content: string
}

type ApiResponse<T> = {
  success: boolean
  data: T
  message: string | null
  errors: unknown
}

export async function getAnnouncements(): Promise<ApiResponse<Announcement[]>> {
  const res = await api.get('/announcements')
  return res.data
}

export async function createAnnouncement(payload: AnnouncementPayload): Promise<ApiResponse<Announcement>> {
  const res = await api.post('/announcements', payload)
  return res.data
}

export async function updateAnnouncement(id: number, payload: AnnouncementPayload): Promise<ApiResponse<Announcement>> {
  const res = await api.put(`/announcements/${id}`, payload)
  return res.data
}

export async function deleteAnnouncement(id: number): Promise<ApiResponse<null>> {
  const res = await api.delete(`/announcements/${id}`)
  return res.data
}
