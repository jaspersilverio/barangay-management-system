import api from './api'

export type HouseholdPayload = {
	address: string
	property_type: string
	head_name: string
	contact: string
	purok_id: string | number
}

export type HouseholdOption = {
	id: number
	head_of_household: string
	address: string
	purok_name: string
	label: string
}

export type Household = {
	id: number
	address: string
	property_type: string
	head_name: string
	contact: string
	purok_id: number
	residents_count: number
	deleted_at?: string
	purok?: {
		id: number
		name: string
	}
}

export type Resident = {
	id: number
	first_name: string
	middle_name?: string
	last_name: string
	full_name: string
	sex: string
	birthdate?: string
	age?: number
	relationship_to_head: string
	occupation_status: string
	is_pwd: boolean
}

export async function listHouseholds(params: { search?: string; purok_id?: number | string; page?: number; per_page?: number }) {
	const res = await api.get('/households', { params })
	return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function getHouseholdsForResidentForm(params: { search?: string }) {
	const res = await api.get('/households/for-resident-form', { params })
	return res.data as { success: boolean; data: HouseholdOption[]; message: string | null; errors: any }
}

export async function getHouseholdResidents(householdId: number) {
	const res = await api.get(`/households/${householdId}/residents`)
	return res.data as { success: boolean; data: Resident[]; message: string | null; errors: any }
}

export async function getHousehold(id: number | string) {
	const res = await api.get(`/households/${id}`)
	return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function createHousehold(payload: HouseholdPayload) {
	const res = await api.post('/households', payload)
	return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function updateHousehold(id: number | string, payload: HouseholdPayload) {
	const res = await api.put(`/households/${id}`, payload)
	return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function deleteHousehold(id: number | string) {
	const res = await api.delete(`/households/${id}`)
	return res.data as { success: boolean; data: any; message: string | null; errors: any }
}



