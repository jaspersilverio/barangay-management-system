import api from './api'

export type BarangayInfo = {
  // Government Identity
  province: string
  municipality: string
  name: string
  
  // Barangay Profile
  logo_path?: string
  address: string
  contact: string
  email?: string
  
  // Officials Reference
  captain_id?: number
  secretary_id?: number
  treasurer_id?: number
  
  // Captain Signature Configuration
  captain_signature_path?: string
  captain_signature_display_name?: string
  captain_position_label?: string
  
  // Optional System Info
  slogan?: string
  office_hours?: string
  emergency_contact?: string
}

export type OfficialOption = {
  id: number
  name: string
  position: string
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
  officials_options?: OfficialOption[] // Officials for dropdown selection
}

export async function getSettings() {
  const res = await api.get('/settings')
  return res.data as { success: boolean; data: Settings; message: string | null; errors: any }
}

export async function updatePreferences(payload: SystemPreferences) {
  const res = await api.put('/settings/preferences', payload)
  return res.data as { success: boolean; data: SystemPreferences; message: string | null; errors: any }
}

export async function updateEmergency(payload: EmergencySettings) {
  const res = await api.put('/settings/emergency', payload)
  return res.data as { success: boolean; data: EmergencySettings; message: string | null; errors: any }
}
