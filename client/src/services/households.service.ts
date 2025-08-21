import api from './api'

export type HouseholdPayload = {
	purok_id: number
	household_code?: string
	head_name: string
	address: string
	landmark?: string | null
	photo_path?: string | null
	latitude?: number | null
	longitude?: number | null
	created_by?: number
	updated_by?: number | null
}

export async function listHouseholds(params: { search?: string; purok_id?: number | string; page?: number }) {
	const res = await api.get('/households', { params })
	return res.data as { success: boolean; data: any; message: string | null; errors: any }
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


