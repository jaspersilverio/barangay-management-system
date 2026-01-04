import api from './api'

/**
 * PDF Export Service
 * 
 * Centralized service for triggering PDF generation from the frontend.
 * All PDFs are generated on-demand by the backend and returned as downloads.
 */

export interface PdfExportOptions {
  purok_id?: number
  search?: string
  status?: string
  start_date?: string
  end_date?: string
  [key: string]: any
}

/**
 * Export residents list as PDF
 */
export async function exportResidentsToPdf(options: PdfExportOptions = {}) {
  try {
    const params = new URLSearchParams()
    
    if (options.purok_id) params.append('purok_id', options.purok_id.toString())
    if (options.search) params.append('search', options.search)
    
    const response = await api.get(`/pdf/export/residents?${params.toString()}`, {
      responseType: 'blob',
    })

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `residents-list-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error: any) {
    console.error('PDF export failed:', error)
    throw new Error(error?.response?.data?.message || 'Failed to export PDF')
  }
}

/**
 * Export households list as PDF
 */
export async function exportHouseholdsToPdf(options: PdfExportOptions = {}) {
  try {
    const params = new URLSearchParams()
    
    if (options.purok_id) params.append('purok_id', options.purok_id.toString())
    if (options.search) params.append('search', options.search)
    
    const response = await api.get(`/pdf/export/households?${params.toString()}`, {
      responseType: 'blob',
    })

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `households-list-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error: any) {
    console.error('PDF export failed:', error)
    throw new Error(error?.response?.data?.message || 'Failed to export PDF')
  }
}

/**
 * Export blotters list as PDF
 */
export async function exportBlottersToPdf(options: PdfExportOptions = {}) {
  try {
    const params = new URLSearchParams()
    
    if (options.status) params.append('status', options.status)
    if (options.start_date) params.append('start_date', options.start_date)
    if (options.end_date) params.append('end_date', options.end_date)
    
    const response = await api.get(`/pdf/export/blotters?${params.toString()}`, {
      responseType: 'blob',
    })

    // Create blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `blotter-entries-${new Date().toISOString().split('T')[0]}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    return { success: true }
  } catch (error: any) {
    console.error('PDF export failed:', error)
    throw new Error(error?.response?.data?.message || 'Failed to export PDF')
  }
}

/**
 * Preview PDF in new tab (for certificates)
 */
export async function previewCertificatePdf(certificateId: number) {
  try {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/certificates/${certificateId}/preview`
    const token = sessionStorage.getItem('token')
    
    // Open in new tab with authentication
    window.open(`${url}?token=${token}`, '_blank')
    
    return { success: true }
  } catch (error: any) {
    console.error('PDF preview failed:', error)
    throw new Error(error?.response?.data?.message || 'Failed to preview PDF')
  }
}

/**
 * Download certificate PDF
 */
export async function downloadCertificatePdf(certificateId: number) {
  try {
    const url = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/certificates/${certificateId}/download`
    const token = sessionStorage.getItem('token')
    
    // Create a temporary link to trigger download
    const link = document.createElement('a')
    link.href = `${url}?token=${token}`
    link.download = `certificate-${certificateId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    return { success: true }
  } catch (error: any) {
    console.error('PDF download failed:', error)
    throw new Error(error?.response?.data?.message || 'Failed to download PDF')
  }
}

