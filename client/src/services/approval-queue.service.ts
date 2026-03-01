import api from './api'

/** Session cache so approval center shows immediately when navigating back (no loading) */
const approvalCenterCache: Record<string, unknown> = {}

export function getApprovalQueueCached<T = unknown>(key: string): T | undefined {
  return approvalCenterCache[key] as T | undefined
}

export function setApprovalQueueCached(key: string, value: unknown): void {
  approvalCenterCache[key] = value
}

export function clearApprovalCenterCache(): void {
  Object.keys(approvalCenterCache).forEach((k) => delete approvalCenterCache[k])
}

export interface PendingRequest {
  id: number
  type: 'certificate' | 'blotter' | 'incident'
  type_label: string
  title: string
  subtitle: string
  requested_by: string
  requested_at: string
  data: any // The actual request data (certificate, blotter, or incident)
}

export interface ApprovalQueueResponse {
  success: boolean
  data: PendingRequest[]
  statistics: {
    total_pending: number
    certificates: number
    blotters: number
    incidents: number
  }
}

export interface PendingCountResponse {
  success: boolean
  data: {
    total_pending: number
    certificates: number
    blotters: number
    incidents: number
  }
}

/**
 * Get all pending requests for approval
 */
export async function getApprovalQueue(params?: {
  type?: 'all' | 'certificate' | 'blotter' | 'incident'
}): Promise<ApprovalQueueResponse> {
  const searchParams = new URLSearchParams()
  
  if (params?.type && params.type !== 'all') {
    searchParams.append('type', params.type)
  }

  const url = `/approval-queue${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const response = await api.get(url)
  return response.data
}

/**
 * Get pending count for dashboard
 */
export async function getPendingCount(): Promise<PendingCountResponse> {
  const response = await api.get('/approval-queue/pending-count')
  return response.data
}
