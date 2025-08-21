import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
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
    const res = await api.get('/puroks', { params: { per_page: 100 } })
    const list = (res.data.data?.data || res.data.data) as Purok[]
    setPuroks(list)
  }

  useEffect(() => {
    // if (isAuthenticated) {
    fetchPuroks().catch(() => null)
    // }
  }, [])

  const value = useMemo(() => ({ puroks, refresh: fetchPuroks }), [puroks])
  return <PurokContext.Provider value={value}>{children}</PurokContext.Provider>
}

export function usePuroks() {
  const ctx = useContext(PurokContext)
  if (!ctx) throw new Error('usePuroks must be used within PurokProvider')
  return ctx
}


