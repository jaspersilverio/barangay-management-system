import api from './api'

export type LoginPayload = { email: string; password: string }

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload)
  return res.data as { success: boolean; data: { token: string; user: any }; message: string | null; errors: any }
}



export async function me() {
  const res = await api.get('/auth/me')
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}

export async function logout() {
  const res = await api.post('/auth/logout')
  return res.data as { success: boolean; data: any; message: string | null; errors: any }
}


