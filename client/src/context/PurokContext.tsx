import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import api from '../services/api'
// import { useAuth } from './AuthContext'
import type { Purok } from '../types'

type PurokContextType = {
  puroks: Purok[]
  refresh: () => Promise<void>
}

const PurokContext = createContext<PurokContextType | undefined>(undefined)

export function PurokProvider({ children }: { children: React.ReactNode }) {
  const [puroks, setPuroks] = useState<Purok[]>([])
  // const { isAuthenticated } = useAuth()

  const fetchPuroks = async () => {
    try {
      const res = await api.get('/puroks', { params: { per_page: 100 } })
      const list = (res.data.data?.data || res.data.data) as Purok[]
      setPuroks(list)
    } catch (error) {
      console.warn('Failed to fetch puroks:', error)
      // For demo purposes, set some default puroks if API fails
      const defaultPuroks = [
        { id: 1, code: 'P1', name: 'Purok 1', description: 'Demo Purok 1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, code: 'P2', name: 'Purok 2', description: 'Demo Purok 2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]
      setPuroks(defaultPuroks)
    }
  }

  useEffect(() => {
    // if (isAuthenticated) {
    fetchPuroks().catch(() => null)
    // }
  }, []) // Remove refresh dependency to prevent infinite calls

  const refresh = useCallback(async () => {
    await fetchPuroks()
  }, [])

  const value = useMemo(() => ({ puroks, refresh }), [puroks, refresh])
  return <PurokContext.Provider value={value}>{children}</PurokContext.Provider>
}

export function usePuroks() {
  const ctx = useContext(PurokContext)
  if (!ctx) throw new Error('usePuroks must be used within PurokProvider')
  return ctx
}


