// export type Role = 'admin' | 'purok_leader' | 'staff' | 'viewer'

export type Purok = {
  id: number
  name: string
  captain?: string | null  // This is the database field name, but UI shows "Leader"
  contact?: string | null
  created_at: string
  updated_at: string
}

export type Household = {
  id: number
  address: string
  property_type: string
  head_name: string
  contact: string
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


