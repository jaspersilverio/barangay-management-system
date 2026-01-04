import api from './api'

export type SoloParentPayload = {
  resident_id: number
  eligibility_reason: 'death_of_spouse' | 'abandonment' | 'legally_separated' | 'unmarried_parent' | 'spouse_incapacitated'
  date_declared: string
  valid_until: string
  verification_date?: string
  verified_by?: number
}

export type SoloParent = {
  id: number
  resident_id: number
  eligibility_reason: string
  eligibility_reason_label: string
  date_declared: string
  valid_until: string
  verification_date?: string | null
  computed_status: 'active' | 'expired' | 'inactive'
  has_dependent_children: boolean
  dependent_children_count: number
  dependent_children: Array<{
    id: number
    name: string
    age: number
    relationship: string
  }>
  created_at: string
  resident?: {
    id: number
    first_name: string
    middle_name?: string
    last_name: string
    full_name: string
    sex: string
    birthdate: string
    age: number
    civil_status: string
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
}

export async function listSoloParents(params: { 
  search?: string
  purok_id?: number | string
  status?: string
  page?: number
  per_page?: number
}) {
  const res = await api.get('/beneficiaries/solo-parents', { params })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getSoloParent(id: number) {
  const res = await api.get(`/beneficiaries/solo-parents/${id}`)
  return res.data as { success: boolean; data: SoloParent; message: string | null; errors: any }
}

export async function createSoloParent(payload: SoloParentPayload) {
  const res = await api.post('/beneficiaries/solo-parents', payload)
  return res.data as { success: boolean; data: SoloParent; message: string | null; errors: any }
}

export async function updateSoloParent(id: number, payload: Partial<SoloParentPayload>) {
  const res = await api.put(`/beneficiaries/solo-parents/${id}`, payload)
  return res.data as { success: boolean; data: SoloParent; message: string | null; errors: any }
}

export async function deleteSoloParent(id: number) {
  const res = await api.delete(`/beneficiaries/solo-parents/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function generateSoloParentCertificate(id: number) {
  const res = await api.post(`/beneficiaries/solo-parents/${id}/generate-certificate`, {}, {
    responseType: 'blob'
  })
  return res.data
}

