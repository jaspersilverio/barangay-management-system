import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import * as AuthService from '../services/auth.service'

type User = {
  id: number
  name: string
  email: string
  role: 'admin' | 'purok_leader' | 'staff' | 'viewer'
  assigned_purok_id?: number | null
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (input: { name: string; email: string; password: string; role: User['role']; assigned_purok_id?: number | null }) => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )

  useEffect(() => {
    if (token) {
      AuthService.me()
        .then((res) => setUser(res.data))
        .catch(() => {
          setUser(null)
          setToken(null)
          localStorage.removeItem('token')
        })
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await AuthService.login({ email, password })
    const t = res.data.token as string
    localStorage.setItem('token', t)
    setToken(t)
    setUser(res.data.user)
  }

  const logout = async () => {
    try {
      await AuthService.logout()
    } finally {
      localStorage.removeItem('token')
      setToken(null)
      setUser(null)
    }
  }

  const register: AuthContextType['register'] = async (input) => {
    await AuthService.register(input)
  }

  const isAuthenticated = !!token
  const value = useMemo(() => ({ user, token, login, logout, register, isAuthenticated }), [
    user,
    token,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


