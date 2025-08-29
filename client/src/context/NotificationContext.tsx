import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { getBellNotifications, markAsRead, markAllAsRead, type Notification } from '../services/notification.service'

interface NotificationContextType {
  unreadCount: number
  notifications: Notification[]
  loading: boolean
  error: string | null
  refreshNotifications: () => Promise<void>
  markNotificationAsRead: (id: number) => Promise<void>
  markAllNotificationsAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getBellNotifications()
      
      if (response.success) {
        setUnreadCount(response.data.unread_count)
        setNotifications(response.data.notifications)
      } else {
        setError('Failed to fetch notifications')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  const markNotificationAsRead = async (id: number) => {
    try {
      const response = await markAsRead(id)
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await markAllAsRead()
      if (response.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        )
        setUnreadCount(0)
      }
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const refreshNotifications = async () => {
    await fetchNotifications()
  }

  useEffect(() => {
    fetchNotifications()
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const value: NotificationContextType = {
    unreadCount,
    notifications,
    loading,
    error,
    refreshNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}
