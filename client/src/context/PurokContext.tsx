import { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getPuroks, type Purok } from '../services/puroks.service'

type PurokContextType = {
  puroks: Purok[]
  refresh: () => Promise<void>
  loading: boolean
  error: string | null
}

const PurokContext = createContext<PurokContextType | undefined>(undefined)

export function PurokProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth()
  
  const [puroks, setPuroks] = useState<Purok[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasFetchedRef = useRef(false)

  const fetchPuroks = useCallback(async () => {
    if (loading || hasFetchedRef.current) return // Prevent multiple simultaneous requests and re-initialization
    
    try {
      setLoading(true)
      setError(null)
      const res = await getPuroks({ per_page: 100 })
      const list = res.data.data || []
      setPuroks(list)
    } catch (error) {
      console.warn('Failed to fetch puroks:', error)
      setError('Failed to fetch puroks')
      setPuroks([])
    } finally {
      setLoading(false)
      hasFetchedRef.current = true
    }
  }, [loading])

  useEffect(() => {
    if (isAuthenticated) {
      fetchPuroks()
    }
  }, [isAuthenticated, fetchPuroks])

  const refresh = useCallback(async () => {
    if (loading) return
    try {
      setLoading(true)
      setError(null)
      const res = await getPuroks({ per_page: 100 })
      const list = res.data.data || []
      setPuroks(list)
    } catch (error) {
      console.warn('Failed to refresh puroks:', error)
      setError('Failed to refresh puroks')
      setPuroks([])
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


