export type Role = 'admin' | 'purok_leader' | 'staff' | 'viewer'

export type Purok = {
  id: number
  code: string
  name: string
  description?: string | null
  centroid_lat?: number | null
  centroid_lng?: number | null
  boundary_geojson?: unknown
  created_at: string
  updated_at: string
}

export type Household = {
  id: number
  purok_id: number
  household_code: string
  head_name: string
  address: string
  landmark?: string | null
  photo_path?: string | null
  latitude?: number | null
  longitude?: number | null
  created_by: number
  updated_by?: number | null
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type Resident = {
  id: number
  household_id: number
  first_name: string
  middle_name?: string | null
  last_name: string
  sex: 'male' | 'female' | 'other'
  birthdate: string
  relationship_to_head: string
  occupation_status: 'employed' | 'unemployed' | 'student' | 'retired' | 'other'
  is_pwd: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type Landmark = {
  id: number
  purok_id: number
  name: string
  type: 'church' | 'school' | 'barangay_hall' | 'evacuation_center' | 'health_center' | 'other'
  description?: string | null
  latitude: number
  longitude: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
}

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string | null
  errors: Record<string, string[]> | null
}


