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
  head_name: string // For backward compatibility
  head_resident_id?: number
  head_resident?: {
    id: number
    first_name: string
    middle_name?: string | null
    last_name: string
    full_name: string
  }
  contact: string
  purok_id?: number
  created_at: string
  updated_at: string
  deleted_at?: string | null
  purok?: {
    id: number
    name: string
  }
  residents_count?: number
}

export type Resident = {
  id: number
  household_id: number | null // Can be null for unassigned residents
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  full_name?: string
  sex: 'male' | 'female' | 'other'
  birthdate: string
  place_of_birth?: string | null
  nationality?: string | null
  religion?: string | null
  contact_number?: string | null
  email?: string | null
  valid_id_type?: string | null
  valid_id_number?: string | null
  civil_status?: 'single' | 'married' | 'widowed' | 'divorced' | 'separated'
  relationship_to_head: string | null // Can be null for unassigned residents
  occupation_status: 'employed' | 'unemployed' | 'student' | 'retired' | 'other'
  employer_workplace?: string | null
  educational_attainment?: string | null
  is_pwd: boolean
  is_pregnant?: boolean
  resident_status?: 'active' | 'deceased' | 'transferred' | 'inactive'
  remarks?: string | null
  photo_path?: string | null
  photo_url?: string | null
  age?: number
  is_senior?: boolean
  is_solo_parent?: boolean
  classifications?: string[]
  is_head_of_household?: boolean
  created_at: string
  updated_at: string
  deleted_at?: string | null
  household?: {
    id: number
    head_name: string
    address: string
    purok_id?: number
    purok?: {
      id: number
      name: string
    }
  } | null
  head_of_households?: Array<{
    id: number
    address: string
    purok?: {
      id: number
      name: string
    }
  }>
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

/** Time-aware status from API (computed on server). Use this for display and filtering. */
export type VaccinationComputedStatus = 'completed' | 'scheduled' | 'pending' | 'overdue'

export type VaccinationType = 'fixed_dose' | 'booster' | 'annual' | 'as_needed'

export type Vaccination = {
  id: number
  resident_id: number
  vaccination_type: VaccinationType
  required_doses: number | null
  completed_doses: number
  schedule_date: string | null
  completed_at?: string | null
  next_due_date?: string | null
  vaccine_name?: string | null
  dose_number?: string | null
  date_administered?: string | null
  status?: string
  /** Server-computed status; use this for display (completed | scheduled | pending | overdue). */
  computed_status: VaccinationComputedStatus
  /** True when user can mark this vaccination complete (pending or overdue). */
  can_complete: boolean
  administered_by?: string | null
  created_at: string
  updated_at: string
  resident?: {
    id: number
    first_name: string
    middle_name?: string | null
    last_name: string
    full_name?: string
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
  vaccination_type: VaccinationType
  required_doses?: number | null
  schedule_date?: string | null
  vaccine_name?: string | null
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
  /** Counts by computed status: completed, scheduled, pending, overdue */
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


