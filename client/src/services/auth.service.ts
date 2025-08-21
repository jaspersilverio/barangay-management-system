import api from './api'

export type LoginPayload = { email: string; password: string }
export type RegisterPayload = {
  name: string
  email: string
  password: string
  role: 'admin' | 'purok_leader' | 'staff' | 'viewer'
  assigned_purok_id?: number | null
}

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload)
  return res.data as { success: boolean; data: { token: string; user: any }; message: string | null; errors: any }
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload)
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function me() {
  const res = await api.get('/auth/me')
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function logout() {
  const res = await api.post('/auth/logout')
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}


