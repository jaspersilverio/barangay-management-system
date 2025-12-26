import api from './api'

export type FourPsPayload = {
  household_id: number
  four_ps_number: string
  status: 'active' | 'suspended' | 'inactive'
  date_registered: string
}

export type FourPsBeneficiary = {
  id: number
  household_id: number
  four_ps_number: string
  status: 'active' | 'suspended' | 'inactive'
  date_registered: string
  created_at: string
  household?: {
    id: number
    head_name: string
    address: string
    contact: string
    purok?: {
      id: number
      name: string
    }
  }
}

export async function listFourPsBeneficiaries(params: { 
  search?: string
  purok_id?: number | string
  status?: string
  page?: number
  per_page?: number
}) {
  const res = await api.get('/beneficiaries/4ps', { params })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getFourPsBeneficiary(id: number | string) {
  const res = await api.get(`/beneficiaries/4ps/${id}`)
  return res.data as { success: boolean; data: FourPsBeneficiary; message: string | null; errors: any }
}

export async function createFourPsBeneficiary(payload: FourPsPayload) {
  const res = await api.post('/beneficiaries/4ps', payload)
  return res.data as { success: boolean; data: FourPsBeneficiary; message: string | null; errors: any }
}

export async function updateFourPsBeneficiary(id: number | string, payload: Partial<FourPsPayload>) {
  const res = await api.put(`/beneficiaries/4ps/${id}`, payload)
  return res.data as { success: boolean; data: FourPsBeneficiary; message: string | null; errors: any }
}

export async function deleteFourPsBeneficiary(id: number | string) {
  const res = await api.delete(`/beneficiaries/4ps/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

