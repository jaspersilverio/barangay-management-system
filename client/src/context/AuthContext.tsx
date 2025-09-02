import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import * as AuthService from '../services/auth.service'

type User = {
  id: number
  name: string
  email: string
  // role: 'admin' | 'purok_leader' | 'staff' | 'viewer'
  role: string // Allow any role for demo
  assigned_purok_id?: number | null
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearAuth: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('token')
  )

  useEffect(() => {
    if (token) {
      AuthService.me()
        .then((res) => {
          const userData = res.data
          setUser(userData)
          localStorage.setItem('user', JSON.stringify(userData))
        })
        .catch((error) => {
          console.log('Auth check failed:', error)
          clearAuth()
        })
    } else {
      setUser(null)
    }
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await AuthService.login({ email, password })
    const t = res.data.token as string
    const userData = res.data.user
    localStorage.setItem('token', t)
    localStorage.setItem('user', JSON.stringify(userData))
    setToken(t)
    setUser(userData)
  }

  const logout = async () => {
    try {
      await AuthService.logout()
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }

  const isAuthenticated = !!(token && user)
  const value = useMemo(() => ({ user, token, login, logout, clearAuth, isAuthenticated }), [
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


