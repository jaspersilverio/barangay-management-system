import api from './api'

export interface Official {
  id: number
  user_id?: number
  name: string
  category?: string
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
  name?: string // Optional for official category (composed from first/middle/last/suffix)
  category?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  suffix?: string
  sex?: string
  birthdate?: string
  position: string
  term_start?: string
  term_end?: string
  contact?: string
  email?: string
  address?: string
  purok_id?: number
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

export const OFFICIAL_POSITION_OPTIONS = [
  'Barangay Captain (Punong Barangay)',
  'Barangay Kagawad – Committee on Peace & Order',
  'Barangay Kagawad – Committee on Health',
  'Barangay Kagawad – Committee on Education',
  'Barangay Kagawad – Committee on Environment',
  'Barangay Kagawad – Committee on Infrastructure',
  'Barangay Kagawad – Committee on Women & Family',
  'Barangay Kagawad – Committee on Youth & Sports',
  'Barangay Secretary',
  'Barangay Treasurer',
  'Barangay Administrator',
  'Barangay Clerk'
]

export const SK_POSITION_OPTIONS = [
  'SK Chairperson',
  'SK Secretary',
  'SK Treasurer',
  'SK Councilor',
  'SK Federation Representative'
]

export async function getOfficials(params?: {
  page?: number
  search?: string
  position?: string
  active?: boolean
  category?: string
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
  if (data.name) formData.append('name', data.name)
  if (data.category) formData.append('category', data.category)
  
  // Add personal information fields (for official and SK categories)
  if (data.first_name) formData.append('first_name', data.first_name)
  if (data.middle_name) formData.append('middle_name', data.middle_name)
  if (data.last_name) formData.append('last_name', data.last_name)
  if (data.suffix) formData.append('suffix', data.suffix)
  if (data.sex) formData.append('sex', data.sex)
  if (data.birthdate) formData.append('birthdate', data.birthdate)
  if (data.email) formData.append('email', data.email)
  if (data.address) formData.append('address', data.address)
  if (data.purok_id) formData.append('purok_id', data.purok_id.toString())
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
  
  // Add text fields - always send required fields
  if (data.user_id !== undefined && data.user_id !== null) {
    formData.append('user_id', data.user_id.toString())
  }
  // Always send name and position if they exist (required fields)
  if (data.name !== undefined) formData.append('name', data.name)
  if (data.category !== undefined) formData.append('category', data.category)
  if (data.position !== undefined) formData.append('position', data.position)
  if (data.term_start !== undefined) formData.append('term_start', data.term_start || '')
  if (data.term_end !== undefined) formData.append('term_end', data.term_end || '')
  if (data.contact !== undefined) formData.append('contact', data.contact || '')
  if (data.active !== undefined) formData.append('active', data.active.toString())
  
  // Add photo if provided (File object)
  if (data.photo) {
    if (data.photo instanceof File) {
      formData.append('photo', data.photo)
    } else {
      console.warn('Photo is not a File object:', typeof data.photo, data.photo)
    }
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
