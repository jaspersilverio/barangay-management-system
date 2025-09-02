import api from './api'

export interface SearchResult {
  id: number
  type: 'household' | 'resident'
  name: string
  full_name?: string
  age?: number
  sex?: string
  address?: string
  purok_name?: string
  household_id?: number
  x_position?: number
  y_position?: number
}

export async function searchHouseholdsAndResidents(query: string) {
  const res = await api.get('/search/households-residents', { params: { query } })
  return res.data as { success: boolean; data: SearchResult[]; message: string | null; errors: any }
}
