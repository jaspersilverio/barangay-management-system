import api from './api'

export type BarangayInfo = {
  name: string
  address: string
  contact: string
  logo_path?: string
}

export type SystemPreferences = {
  theme: 'light' | 'dark'
  per_page: number
  date_format: string
}

export type EmergencyContact = {
  name: string
  number: string
}

export type EvacuationCenter = {
  name: string
  address: string
  capacity: number
}

export type EmergencySettings = {
  contact_numbers: EmergencyContact[]
  evacuation_centers: EvacuationCenter[]
}

export type Settings = {
  barangay_info: BarangayInfo
  system_preferences: SystemPreferences
  emergency: EmergencySettings
}

export async function getSettings() {
  const res = await api.get('/settings')
  return res.data as { success: boolean; data: Settings; message: string | null; errors: any }
}

export async function updateBarangayInfo(payload: BarangayInfo) {
  const res = await api.put('/settings/barangay-info', payload)
  return res.data as { success: boolean; data: BarangayInfo; message: string | null; errors: any }
}

export async function updatePreferences(payload: SystemPreferences) {
  const res = await api.put('/settings/preferences', payload)
  return res.data as { success: boolean; data: SystemPreferences; message: string | null; errors: any }
}

export async function updateEmergency(payload: EmergencySettings) {
  const res = await api.put('/settings/emergency', payload)
  return res.data as { success: boolean; data: EmergencySettings; message: string | null; errors: any }
}
