import api from './api'

export type BarangayInfo = {
  id?: number
  barangay_name: string
  municipality: string
  province: string
  region: string
  address: string
  contact_number: string
  email: string
  captain_name: string
  logo_path: string | null
  captain_signature_path: string | null
  created_at?: string
  updated_at?: string
}

export async function getBarangayInfo() {
  const res = await api.get('/barangay-info')
  return res.data as { success: boolean; data: BarangayInfo | null; message: string | null }
}

export async function saveBarangayInfo(formData: FormData) {
  const res = await api.post('/barangay-info', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
  return res.data as { success: boolean; data: BarangayInfo; message: string | null }
}
