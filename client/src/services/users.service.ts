import api from './api'

export type User = {
  id: number
  name: string
  email: string
  role: 'admin' | 'purok_leader' | 'staff'
  assigned_purok_id?: number
  created_at: string
  updated_at: string
  deleted_at?: string
  assigned_purok?: {
    id: number
    name: string
  }
}

export type CreateUserPayload = {
  name: string
  email: string
  password: string
  role: 'admin' | 'purok_leader' | 'staff'
  assigned_purok_id?: number
}

export type UpdateUserPayload = {
  name: string
  email: string
  password?: string
  role: 'admin' | 'purok_leader' | 'staff'
  assigned_purok_id?: number
}

export type UserFilters = {
  search?: string
  role?: string
  purok_id?: number
  per_page?: number
}

export type Role = {
  value: string
  label: string
}

export type PurokOption = {
  id: number
  name: string
}

export async function getUsers(filters: UserFilters = {}) {
  const params = new URLSearchParams()
  
  if (filters.search) params.append('search', filters.search)
  if (filters.role) params.append('role', filters.role)
  if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
  if (filters.per_page) params.append('per_page', filters.per_page.toString())

  const res = await api.get(`/users?${params.toString()}`)
  return res.data as { success: boolean; data: { data: User[]; current_page: number; last_page: number; per_page: number; total: number }; message: string | null; errors: any }
}

export async function getUser(id: number) {
  const res = await api.get(`/users/${id}`)
  return res.data as { success: boolean; data: User; message: string | null; errors: any }
}

export async function createUser(payload: CreateUserPayload) {
  const res = await api.post('/users', payload)
  return res.data as { success: boolean; data: User; message: string | null; errors: any }
}

export async function updateUser(id: number, payload: UpdateUserPayload) {
  const res = await api.put(`/users/${id}`, payload)
  return res.data as { success: boolean; data: User; message: string | null; errors: any }
}

export async function deleteUser(id: number) {
  const res = await api.delete(`/users/${id}`)
  return res.data as { success: boolean; data: null; message: string | null; errors: any }
}

export async function restoreUser(id: number) {
  const res = await api.post(`/users/${id}/restore`)
  return res.data as { success: boolean; data: User; message: string | null; errors: any }
}

export async function getRoles() {
  const res = await api.get('/users/roles')
  return res.data as { success: boolean; data: Role[]; message: string | null; errors: any }
}

export async function getPuroks() {
  const res = await api.get('/users/puroks')
  return res.data as { success: boolean; data: PurokOption[]; message: string | null; errors: any }
}
