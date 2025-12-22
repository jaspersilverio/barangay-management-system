import api from './api'

export interface Official {
  id: number
  user_id?: number
  name: string
  position: string
  term_start?: string
  term_end?: string
  contact?: string
  photo_path?: string
  active: boolean
  created_at: string
  updated_at: string
  user?: {
    id: number
    name: string
    email: string
  }
  photo_url?: string
  term_period?: string
  is_in_term?: boolean
}

export interface CreateOfficialData {
  user_id?: number
  name: string
  position: string
  term_start?: string
  term_end?: string
  contact?: string
  photo?: File
  active?: boolean
}

export interface UpdateOfficialData extends Partial<CreateOfficialData> {
  id: number
}

export const POSITION_OPTIONS = [
  'Barangay Captain',
  'Barangay Kagawad',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay SK Chairman',
  'Barangay SK Kagawad',
  'Barangay Health Worker',
  'Barangay Tanod',
  'Barangay Day Care Worker',
  'Other'
]

export async function getOfficials(params?: {
  page?: number
  search?: string
  position?: string
  active?: boolean
}) {
  const res = await api.get('/officials', { params })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getActiveOfficials() {
  const res = await api.get('/officials/active')
  return res.data as { success: boolean; data: Official[]; message: string | null; errors: any }
}

export async function getOfficial(id: number) {
  const res = await api.get(`/officials/${id}`)
  return res.data as { success: boolean; data: Official; message: string | null; errors: any }
}

export async function createOfficial(data: CreateOfficialData) {
  const formData = new FormData()
  
  // Add text fields
  if (data.user_id) formData.append('user_id', data.user_id.toString())
  formData.append('name', data.name)
  formData.append('position', data.position)
  if (data.term_start) formData.append('term_start', data.term_start)
  if (data.term_end) formData.append('term_end', data.term_end)
  if (data.contact) formData.append('contact', data.contact)
  
  // Handle active field properly
  const activeValue = data.active !== undefined ? data.active : true
  formData.append('active', activeValue.toString())
  
  // Add photo if provided
  if (data.photo) {
    formData.append('photo', data.photo)
  }


  const res = await api.post('/officials', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data as { success: boolean; data: Official; message: string | null; errors: any }
}

export async function updateOfficial(id: number, data: Partial<CreateOfficialData>) {
  const formData = new FormData()
  
  // Add text fields
  if (data.user_id !== undefined) formData.append('user_id', data.user_id.toString())
  if (data.name) formData.append('name', data.name)
  if (data.position) formData.append('position', data.position)
  if (data.term_start) formData.append('term_start', data.term_start)
  if (data.term_end) formData.append('term_end', data.term_end)
  if (data.contact) formData.append('contact', data.contact)
  if (data.active !== undefined) formData.append('active', data.active.toString())
  
  // Add photo if provided
  if (data.photo) {
    formData.append('photo', data.photo)
  }

  const res = await api.put(`/officials/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return res.data as { success: boolean; data: Official; message: string | null; errors: any }
}

export async function deleteOfficial(id: number) {
  const res = await api.delete(`/officials/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function toggleOfficialActive(id: number) {
  const res = await api.patch(`/officials/${id}/toggle-active`)
  return res.data as { success: boolean; data: Official; message: string | null; errors: any }
}

export const officialsService = {
  getOfficials: getOfficials,
  getOfficial: getOfficial,
  createOfficial: createOfficial,
  updateOfficial: updateOfficial,
  deleteOfficial: deleteOfficial,
  toggleOfficialActive: toggleOfficialActive
}
