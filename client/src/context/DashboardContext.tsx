import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getSummary, clearDashboardCache, getDashboardCached, setDashboardCached } from '../services/dashboard.service'
import type { DashboardSummary } from '../services/dashboard.service'
import { useAuth } from './AuthContext'

const SUMMARY_CACHE_KEY = 'summary'

export type RefreshOptions = { fullRefresh?: boolean }

interface DashboardContextType {
  summaryData: DashboardSummary | null
  loading: boolean
  error: string | null
  refreshData: (options?: RefreshOptions) => Promise<void>
  refreshTrigger: number
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [summaryData, setSummaryData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const initialLoadDone = useRef(false)

  const fetchSummary = useCallback(async (showLoading: boolean) => {
    if (showLoading) {
      setLoading(true)
      setError(null)
    }
    try {
      const response = await getSummary()
      if (response.success) {
        setSummaryData(response.data)
        setDashboardCached(SUMMARY_CACHE_KEY, response.data)
      } else {
        setError(response.message || 'Failed to fetch dashboard data')
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null
      setError(message || 'Dashboard data unavailable')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [])

  const refreshData = useCallback(async (options?: RefreshOptions) => {
    const fullRefresh = options?.fullRefresh === true
    if (fullRefresh) {
      clearDashboardCache()
      setRefreshTrigger((t) => t + 1)
      setLoading(true)
      setError(null)
    }
    try {
      const response = await getSummary()
      if (response.success) {
        setSummaryData(response.data)
        setDashboardCached(SUMMARY_CACHE_KEY, response.data)
      } else if (fullRefresh) {
        setError(response.message || 'Failed to fetch dashboard data')
      }
    } catch (err: unknown) {
      const message = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null
      if (fullRefresh) setError(message || 'Dashboard data unavailable')
    } finally {
      if (fullRefresh) setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false)
      setError(null)
      setSummaryData(null)
      initialLoadDone.current = false
      return
    }
    if (initialLoadDone.current) return
    initialLoadDone.current = true

    const cached = getDashboardCached<DashboardSummary>(SUMMARY_CACHE_KEY)
    if (cached != null) {
      setSummaryData(cached)
      setLoading(false)
      return
    }
    fetchSummary(true)
  }, [isAuthenticated, fetchSummary])

  return (
    <DashboardContext.Provider value={{
      summaryData,
      loading,
      error,
      refreshData,
      refreshTrigger,
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
