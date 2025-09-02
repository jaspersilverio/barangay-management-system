import api from './api'

export interface CertificateRequest {
  id: number
  resident_id: number
  requested_by?: number
  approved_by?: number
  released_by?: number
  certificate_type: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement'
  purpose: string
  additional_requirements?: string
  status: 'pending' | 'approved' | 'released' | 'rejected'
  remarks?: string
  requested_at: string
  approved_at?: string
  released_at?: string
  rejected_at?: string
  created_at: string
  updated_at: string
  resident?: Resident
  requestedBy?: User
  approvedBy?: User
  releasedBy?: User
  issuedCertificate?: IssuedCertificate
  certificate_type_label?: string
  status_badge?: string
}

export interface IssuedCertificate {
  id: number
  certificate_request_id: number
  resident_id: number
  issued_by: number
  certificate_type: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement'
  certificate_number: string
  purpose: string
  pdf_path?: string
  qr_code?: string
  valid_from: string
  valid_until: string
  is_valid: boolean
  signed_by?: string
  signature_position?: string
  signed_at?: string
  created_at: string
  updated_at: string
  resident?: Resident
  issuedBy?: User
  certificateRequest?: CertificateRequest
  certificate_type_label?: string
  status?: string
  status_badge?: string
  days_until_expiry?: number
  pdf_url?: string
}

interface Resident {
  id: number
  first_name: string
  last_name: string
  full_name: string
  // Add other resident fields as needed
}

interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface CertificateRequestForm {
  resident_id: number
  certificate_type: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement'
  purpose: string
  additional_requirements?: string
}

export interface IssuedCertificateForm {
  certificate_request_id: number
  resident_id: number
  certificate_type: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement'
  purpose: string
  valid_from: string
  valid_until: string
  signed_by: string
  signature_position: string
}

export interface CertificateStatistics {
  total_requests: number
  pending_requests: number
  approved_requests: number
  released_requests: number
  rejected_requests: number
  by_type: {
    barangay_clearance: number
    indigency: number
    residency: number
    business_permit_endorsement: number
  }
}

export interface IssuedCertificateStatistics {
  total_certificates: number
  valid_certificates: number
  expired_certificates: number
  by_type: {
    barangay_clearance: number
    indigency: number
    residency: number
    business_permit_endorsement: number
  }
  expiring_soon: number
}

// Certificate Requests
export const getCertificateRequests = async (params?: {
  status?: string
  certificate_type?: string
  resident_id?: number
  search?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}) => {
  const response = await api.get('/certificate-requests', { params })
  return response.data
}

export const createCertificateRequest = async (data: CertificateRequestForm) => {
  const response = await api.post('/certificate-requests', data)
  return response.data
}

export const getCertificateRequest = async (id: number) => {
  const response = await api.get(`/certificate-requests/${id}`)
  return response.data
}

export const updateCertificateRequest = async (id: number, data: Partial<CertificateRequestForm>) => {
  const response = await api.put(`/certificate-requests/${id}`, data)
  return response.data
}

export const deleteCertificateRequest = async (id: number) => {
  const response = await api.delete(`/certificate-requests/${id}`)
  return response.data
}

export const approveCertificateRequest = async (id: number, remarks?: string) => {
  const response = await api.post(`/certificate-requests/${id}/approve`, { remarks })
  return response.data
}

export const rejectCertificateRequest = async (id: number, remarks: string) => {
  const response = await api.post(`/certificate-requests/${id}/reject`, { remarks })
  return response.data
}

export const releaseCertificateRequest = async (id: number, remarks?: string) => {
  const response = await api.post(`/certificate-requests/${id}/release`, { remarks })
  return response.data
}

export const getCertificateRequestStatistics = async () => {
  const response = await api.get('/certificate-requests/statistics')
  return response.data
}

// Issued Certificates
export const getIssuedCertificates = async (params?: {
  status?: string
  certificate_type?: string
  resident_id?: number
  search?: string
  date_from?: string
  date_to?: string
  per_page?: number
  page?: number
}) => {
  const response = await api.get('/issued-certificates', { params })
  return response.data
}

export const createIssuedCertificate = async (data: IssuedCertificateForm) => {
  const response = await api.post('/issued-certificates', data)
  return response.data
}

export const getIssuedCertificate = async (id: number) => {
  const response = await api.get(`/issued-certificates/${id}`)
  return response.data
}

export const updateIssuedCertificate = async (id: number, data: Partial<IssuedCertificateForm>) => {
  const response = await api.put(`/issued-certificates/${id}`, data)
  return response.data
}

export const deleteIssuedCertificate = async (id: number) => {
  const response = await api.delete(`/issued-certificates/${id}`)
  return response.data
}

export const downloadCertificatePdf = async (id: number) => {
  const response = await api.get(`/certificates/${id}/download`)
  return response.data
}

export const previewCertificatePdf = async (id: number) => {
  const response = await api.get(`/certificates/${id}/preview`)
  return response.data
}

export const regenerateCertificatePdf = async (id: number) => {
  const response = await api.post(`/issued-certificates/${id}/regenerate-pdf`)
  return response.data
}

export const invalidateCertificate = async (id: number) => {
  const response = await api.post(`/issued-certificates/${id}/invalidate`)
  return response.data
}

export const getIssuedCertificateStatistics = async () => {
  const response = await api.get('/issued-certificates/statistics')
  return response.data
}

export const verifyCertificate = async (certificateNumber: string) => {
  const response = await api.post('/issued-certificates/verify', { certificate_number: certificateNumber })
  return response.data
}
