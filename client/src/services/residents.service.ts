import api from './api'

/** Session cache so list shows immediately when navigating back (no loading) */
const residentsListCache: Record<string, any> = {}

export function getResidentsListCached(key: string): any | undefined {
  return residentsListCache[key]
}

export function setResidentsListCached(key: string, data: any): void {
  residentsListCache[key] = data
}

export function clearResidentsListCache(): void {
  Object.keys(residentsListCache).forEach((k) => delete residentsListCache[k])
}

export type ResidentPayload = {
  household_id?: number | null // Optional - can create unassigned residents
  first_name: string
  middle_name?: string | null
  last_name: string
  suffix?: string | null
  sex: 'male' | 'female' | 'other'
  birthdate: string
  place_of_birth?: string | null
  nationality?: string | null
  religion?: string | null
  contact_number?: string | null
  email?: string | null
  valid_id_type?: string | null
  valid_id_number?: string | null
  civil_status: 'single' | 'married' | 'widowed' | 'divorced' | 'separated'
  relationship_to_head?: string | null // Optional if household_id is null
  occupation_status: 'employed' | 'unemployed' | 'student' | 'retired' | 'other'
  employer_workplace?: string | null
  educational_attainment?: string | null
  is_pwd: boolean
  is_pregnant?: boolean
  is_solo_parent?: boolean
  resident_status?: 'active' | 'deceased' | 'transferred' | 'inactive'
  remarks?: string | null
  photo?: File
  purok_id?: number | null // Required for unassigned residents (no household)
}

export async function listResidents(params: { 
  search?: string
  page?: number
  purok_id?: string | number
  per_page?: number
  seniors?: boolean
  pwds?: boolean
  children?: boolean
  unassigned?: boolean
  household_id?: number | string
}) {
  const res = await api.get('/residents', { params })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getResident(id: number | string) {
  const res = await api.get(`/residents/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

// Helper function to check if a value is truly empty (null, undefined, or empty string)
const isEmpty = (value: any): boolean => {
  return value === null || value === undefined || value === ''
}

export async function createResident(payload: ResidentPayload) {
  const formData = new FormData()
  
  // Add all fields to FormData - only append non-empty values for optional fields
  // For household_id, explicitly send null if it's null (don't skip it)
  if (payload.household_id !== null && payload.household_id !== undefined) {
    formData.append('household_id', payload.household_id.toString())
  } else {
    // Explicitly send null for household_id when it's null (for unassigned residents)
    formData.append('household_id', '')
  }
  formData.append('first_name', payload.first_name)
  if (!isEmpty(payload.middle_name)) formData.append('middle_name', payload.middle_name!)
  formData.append('last_name', payload.last_name)
  if (!isEmpty(payload.suffix)) formData.append('suffix', payload.suffix!)
  formData.append('sex', payload.sex)
  formData.append('birthdate', payload.birthdate)
  if (!isEmpty(payload.place_of_birth)) formData.append('place_of_birth', payload.place_of_birth!)
  if (!isEmpty(payload.nationality)) formData.append('nationality', payload.nationality!)
  if (!isEmpty(payload.religion)) formData.append('religion', payload.religion!)
  if (!isEmpty(payload.contact_number)) formData.append('contact_number', payload.contact_number!)
  // Email, valid_id_type, and valid_id_number are optional - only append if not empty
  if (!isEmpty(payload.email)) formData.append('email', payload.email!)
  if (!isEmpty(payload.valid_id_type)) formData.append('valid_id_type', payload.valid_id_type!)
  if (!isEmpty(payload.valid_id_number)) formData.append('valid_id_number', payload.valid_id_number!)
  formData.append('civil_status', payload.civil_status)
  // Only send relationship_to_head if household_id is set
  if (payload.household_id !== null && payload.household_id !== undefined && !isEmpty(payload.relationship_to_head)) {
    formData.append('relationship_to_head', payload.relationship_to_head!)
  } else {
    // Explicitly send empty string for relationship_to_head when household_id is null
    formData.append('relationship_to_head', '')
  }
  formData.append('occupation_status', payload.occupation_status)
  if (!isEmpty(payload.employer_workplace)) formData.append('employer_workplace', payload.employer_workplace!)
  if (!isEmpty(payload.educational_attainment)) formData.append('educational_attainment', payload.educational_attainment!)
  // Always send boolean fields - convert to string '1' or '0'
  formData.append('is_pwd', payload.is_pwd ? '1' : '0')
  formData.append('is_pregnant', (payload.is_pregnant === true) ? '1' : '0')
  if (!isEmpty(payload.resident_status)) formData.append('resident_status', payload.resident_status!)
  if (!isEmpty(payload.remarks)) formData.append('remarks', payload.remarks!)
  
  // Add purok_id for unassigned residents (required by backend when no household)
  if (payload.purok_id !== null && payload.purok_id !== undefined) {
    formData.append('purok_id', payload.purok_id.toString())
  }
  
  // Add is_solo_parent if provided
  if (payload.is_solo_parent !== undefined) {
    formData.append('is_solo_parent', payload.is_solo_parent ? '1' : '0')
  }
  
  // Add photo if provided
  if (payload.photo) {
    formData.append('photo', payload.photo)
  }
  
  try {
    const res = await api.post('/residents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data as { success: boolean; data: any; message: string | null; errors: any }
  } catch (error: any) {
    // Log the error details for debugging
    console.error('Resident creation error:', {
      message: error?.response?.data?.message,
      errors: error?.response?.data?.errors,
      status: error?.response?.status,
      payload: Object.fromEntries(formData.entries())
    })
    throw error
  }
}

export async function updateResident(id: number | string, payload: Partial<ResidentPayload>) {
  const formData = new FormData()
  
  // Add all fields to FormData (only non-undefined values)
  // For optional fields, convert empty strings to null or don't append
  if (payload.household_id !== undefined) {
    if (payload.household_id !== null) {
      formData.append('household_id', payload.household_id.toString())
    } else {
      formData.append('household_id', '')
    }
  }
  // Add purok_id for unassigned residents
  if (payload.purok_id !== null && payload.purok_id !== undefined) {
    formData.append('purok_id', payload.purok_id.toString())
  }
  if (payload.first_name !== undefined) formData.append('first_name', payload.first_name)
  if (payload.middle_name !== undefined) {
    if (!isEmpty(payload.middle_name)) {
      formData.append('middle_name', payload.middle_name!)
    } else {
      formData.append('middle_name', '')
    }
  }
  if (payload.last_name !== undefined) formData.append('last_name', payload.last_name)
  if (payload.suffix !== undefined) {
    if (!isEmpty(payload.suffix)) {
      formData.append('suffix', payload.suffix!)
    } else {
      formData.append('suffix', '')
    }
  }
  if (payload.sex !== undefined) formData.append('sex', payload.sex)
  if (payload.birthdate !== undefined) formData.append('birthdate', payload.birthdate)
  if (payload.place_of_birth !== undefined) {
    if (!isEmpty(payload.place_of_birth)) {
      formData.append('place_of_birth', payload.place_of_birth!)
    } else {
      formData.append('place_of_birth', '')
    }
  }
  if (payload.nationality !== undefined) {
    if (!isEmpty(payload.nationality)) {
      formData.append('nationality', payload.nationality!)
    } else {
      formData.append('nationality', '')
    }
  }
  if (payload.religion !== undefined) {
    if (!isEmpty(payload.religion)) {
      formData.append('religion', payload.religion!)
    } else {
      formData.append('religion', '')
    }
  }
  if (payload.contact_number !== undefined) {
    if (!isEmpty(payload.contact_number)) {
      formData.append('contact_number', payload.contact_number!)
    } else {
      formData.append('contact_number', '')
    }
  }
  // Email, valid_id_type, and valid_id_number are optional - convert empty strings to empty string for update
  if (payload.email !== undefined) {
    if (!isEmpty(payload.email)) {
      formData.append('email', payload.email!)
    } else {
      formData.append('email', '')
    }
  }
  if (payload.valid_id_type !== undefined) {
    if (!isEmpty(payload.valid_id_type)) {
      formData.append('valid_id_type', payload.valid_id_type!)
    } else {
      formData.append('valid_id_type', '')
    }
  }
  if (payload.valid_id_number !== undefined) {
    if (!isEmpty(payload.valid_id_number)) {
      formData.append('valid_id_number', payload.valid_id_number!)
    } else {
      formData.append('valid_id_number', '')
    }
  }
  if (payload.civil_status !== undefined) formData.append('civil_status', payload.civil_status)
  if (payload.relationship_to_head !== undefined) {
    if (!isEmpty(payload.relationship_to_head)) {
      formData.append('relationship_to_head', payload.relationship_to_head!)
    } else {
      formData.append('relationship_to_head', '')
    }
  }
  if (payload.occupation_status !== undefined) formData.append('occupation_status', payload.occupation_status)
  if (payload.employer_workplace !== undefined) {
    if (!isEmpty(payload.employer_workplace)) {
      formData.append('employer_workplace', payload.employer_workplace!)
    } else {
      formData.append('employer_workplace', '')
    }
  }
  if (payload.educational_attainment !== undefined) {
    if (!isEmpty(payload.educational_attainment)) {
      formData.append('educational_attainment', payload.educational_attainment!)
    } else {
      formData.append('educational_attainment', '')
    }
  }
  if (payload.is_pwd !== undefined) formData.append('is_pwd', payload.is_pwd.toString())
  if (payload.is_pregnant !== undefined) formData.append('is_pregnant', payload.is_pregnant.toString())
  if (payload.is_solo_parent !== undefined) formData.append('is_solo_parent', payload.is_solo_parent.toString())
  if (payload.resident_status !== undefined) formData.append('resident_status', payload.resident_status)
  if (payload.remarks !== undefined) {
    if (!isEmpty(payload.remarks)) {
      formData.append('remarks', payload.remarks!)
    } else {
      formData.append('remarks', '')
    }
  }
  
  // Add photo if provided (File object)
  if (payload.photo) {
    if (payload.photo instanceof File) {
      formData.append('photo', payload.photo)
    }
  }

  // PHP does not parse FormData for PUT requests - $_POST stays empty.
  // Use POST with _method=PUT (method spoofing) so Laravel routes correctly and PHP parses the body.
  formData.append('_method', 'PUT')
  
  try {
    const res = await api.post(`/residents/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return res.data as { success: boolean; data: any; message: string | null; errors: any }
  } catch (error: any) {
    // Log the error details for debugging
    console.error('Resident update error:', {
      message: error?.response?.data?.message,
      errors: error?.response?.data?.errors,
      status: error?.response?.status,
      payload: Object.fromEntries(formData.entries())
    })
    throw error
  }
}

export async function deleteResident(id: number | string) {
  const res = await api.delete(`/residents/${id}`)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function searchResidents(query: string) {
  const res = await api.get('/residents/search', { params: { query } })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function linkResidentToHousehold(residentId: number, householdId: number) {
  const res = await api.post('/residents/link-to-household', { resident_id: residentId, household_id: householdId })
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export const residentsService = {
  getResidents: listResidents,
  getResident: getResident,
  createResident: createResident,
  updateResident: updateResident,
  deleteResident: deleteResident,
  searchResidents: searchResidents,
  linkResidentToHousehold: linkResidentToHousehold
}