import { createContext, useContext, useEffect, useMemo, useState } from 'react'
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
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = sessionStorage.getItem('user')
    return savedUser ? JSON.parse(savedUser) : null
  })
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('token')
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check authentication status on app load
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      // Only check auth if we have a token
      if (token) {
        const res = await AuthService.me()
        setUser(res.data)
      } else {
        setUser(null)
      }
    } catch (error: any) {
      console.error('Auth check failed:', error)
      setUser(null)
      setToken(null)
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    const res = await AuthService.login({ email, password })
    const userData = res.data.user
    const tokenData = res.data.token
    
    // Store in sessionStorage (better than localStorage)
    sessionStorage.setItem('token', tokenData)
    sessionStorage.setItem('user', JSON.stringify(userData))
    
    setUser(userData)
    setToken(tokenData)
  }

  const logout = async () => {
    try {
      await AuthService.logout()
    } finally {
      sessionStorage.removeItem('token')
      sessionStorage.removeItem('user')
      setUser(null)
      setToken(null)
    }
  }

  const clearAuth = () => {
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
    setToken(null)
  }

  const isAuthenticated = !!(token && user)
  const value = useMemo(() => ({ user, token, login, logout, clearAuth, isAuthenticated, loading }), [
    user,
    token,
    loading,
  ])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


