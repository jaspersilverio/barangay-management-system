import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import api from '../services/api'
// import { useAuth } from './AuthContext'
import type { Purok } from '../types'

type PurokContextType = {
  puroks: Purok[]
  refresh: () => Promise<void>
  loading: boolean
  error: string | null
}

const PurokContext = createContext<PurokContextType | undefined>(undefined)

export function PurokProvider({ children }: { children: React.ReactNode }) {
  const [puroks, setPuroks] = useState<Purok[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)
  // const { isAuthenticated } = useAuth()

  const fetchPuroks = useCallback(async () => {
    if (loading || hasFetchedRef.current) return // Prevent multiple simultaneous requests and re-initialization
    
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/puroks', { params: { per_page: 100 } })
      const list = (res.data.data?.data || res.data.data) as Purok[]
      setPuroks(list)
    } catch (error) {
      console.warn('Failed to fetch puroks:', error)
      setError('Failed to fetch puroks')
      // For demo purposes, set some default puroks if API fails
      const defaultPuroks = [
        { id: 1, name: 'Purok 1', captain: 'Demo Captain 1', contact: '123-456-7890', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: 2, name: 'Purok 2', captain: 'Demo Captain 2', contact: '098-765-4321', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ]
      setPuroks(defaultPuroks)
    } finally {
      setLoading(false)
      hasFetchedRef.current = true
    }
  }, [loading])

  useEffect(() => {
    // if (isAuthenticated) {
    fetchPuroks()
    // }
  }, []) // Only run once on mount, remove fetchPuroks dependency

  const refresh = useCallback(async () => {
    if (loading) return
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/puroks', { params: { per_page: 100 } })
      const list = (res.data.data?.data || res.data.data) as Purok[]
      setPuroks(list)
    } catch (error) {
      console.warn('Failed to refresh puroks:', error)
      setError('Failed to refresh puroks')
    } finally {
      setLoading(false)
    }
  }, [loading])

  const value = useMemo(() => ({ puroks, refresh, loading, error }), [puroks, refresh, loading, error])
  return <PurokContext.Provider value={value}>{children}</PurokContext.Provider>
}

export function usePuroks() {
  const ctx = useContext(PurokContext)
  if (!ctx) throw new Error('usePuroks must be used within PurokProvider')
  return ctx
}


