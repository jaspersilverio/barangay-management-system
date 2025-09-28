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

export type Vaccination = {
  id: number
  resident_id: number
  vaccine_name: string
  dose_number: string
  date_administered: string
  next_due_date?: string | null
  status: 'Completed' | 'Pending' | 'Scheduled'
  administered_by?: string | null
  created_at: string
  updated_at: string
  resident?: {
    id: number
    first_name: string
    last_name: string
    full_name: string
    household?: {
      id: number
      address: string
      purok?: {
        id: number
        name: string
      }
    }
  }
}

export type VaccinationPayload = {
  resident_id: number
  vaccine_name: string
  dose_number: string
  date_administered: string
  next_due_date?: string | null
  status: 'Completed' | 'Pending' | 'Scheduled'
  administered_by?: string | null
}

export type VaccinationFilters = {
  resident_id?: number
  status?: string
  vaccine_name?: string
  purok_id?: number
  date_from?: string
  date_to?: string
  age_group?: 'children' | 'adults' | 'seniors'
  search?: string
  per_page?: number
  page?: number
}

export type VaccinationStatistics = {
  total_vaccinations: number
  by_status: Record<string, number>
  by_vaccine: Record<string, number>
  by_purok: Record<string, number>
}

export type ApiEnvelope<T> = {
  success: boolean
  data: T
  message: string | null
  errors: Record<string, string[]> | null
}


