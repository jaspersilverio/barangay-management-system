import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSummary } from '../services/dashboard.service'
import type { DashboardSummary } from '../services/dashboard.service'
import { useAuth } from './AuthContext'

interface DashboardContextType {
  summaryData: DashboardSummary | null
  loading: boolean
  error: string | null
  refreshData: () => Promise<void>
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getSummary()
      if (response.success) {
        setSummaryData(response.data)
      } else {
        setError(response.message || 'Failed to fetch dashboard data')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Dashboard data unavailable')
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async () => {
    await fetchSummary()
  }, [fetchSummary])

  useEffect(() => {
    if (isAuthenticated) {
      fetchSummary()
    } else {
      setLoading(false)
      setError(null)
      setSummaryData(null)
    }
  }, [fetchSummary, isAuthenticated])

  return (
    <DashboardContext.Provider value={{
      summaryData,
      loading,
      error,
      refreshData,
    }}>
      {children}
    </DashboardContext.Provider>
  )
}

export function useDashboard() {
  const context = useContext(DashboardContext)
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider')
  }
  return context
}
