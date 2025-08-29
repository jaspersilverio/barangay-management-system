import api from './api'

export type Notification = {
  id: number
  user_id: number | null
  title: string
  message: string
  type: 'info' | 'event' | 'system' | 'household' | 'resident'
  is_read: boolean
  created_at: string
  icon?: string
}

export type NotificationResponse = {
  success: boolean
  data: Notification[]
  pagination?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
  message: string | null
  errors: any
}

export type BellResponse = {
  success: boolean
  data: {
    unread_count: number
    notifications: Notification[]
  }
  message: string | null
  errors: any
}

export type MarkAsReadResponse = {
  success: boolean
  message: string
  errors: any
}

/**
 * Get notifications for the authenticated user
 */
export async function getNotifications(params?: {
  filter?: 'all' | 'unread' | 'read'
  per_page?: number
  page?: number
}): Promise<NotificationResponse> {
  const searchParams = new URLSearchParams()
  
  if (params?.filter && params.filter !== 'all') {
    searchParams.append('filter', params.filter)
  }
  
  if (params?.per_page) {
    searchParams.append('per_page', params.per_page.toString())
  }
  
  if (params?.page) {
    searchParams.append('page', params.page.toString())
  }

  const url = `/notifications${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
  const res = await api.get(url)
  return res.data
}

/**
 * Get unread count and latest notifications for the bell
 */
export async function getBellNotifications(): Promise<BellResponse> {
  const res = await api.get('/notifications/bell')
  return res.data
}

/**
 * Mark a single notification as read
 */
export async function markAsRead(id: number): Promise<MarkAsReadResponse> {
  const res = await api.post(`/notifications/${id}/read`)
  return res.data
}

/**
 * Mark all notifications as read
 */
export async function markAllAsRead(): Promise<MarkAsReadResponse> {
  const res = await api.post('/notifications/read-all')
  return res.data
}
