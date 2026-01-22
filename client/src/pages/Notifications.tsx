import { useState, useEffect } from 'react'
import { getNotifications, markAsRead, markAllAsRead, type Notification } from '../services/notification.service'
import { formatDistanceToNow } from 'date-fns'
import { Check, CheckCheck, Filter, RefreshCw } from 'lucide-react'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import LoadingSkeleton from '../components/ui/LoadingSkeleton'

type FilterType = 'all' | 'unread' | 'read'

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  const fetchNotifications = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await getNotifications({
        filter,
        per_page: 15,
        page
      })

      if (response.success) {
        setNotifications(response.data)
        if (response.pagination) {
          setPagination(response.pagination)
        }
      } else {
        setError('Failed to fetch notifications')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications(1)
  }, [filter])

  const handleMarkAsRead = async (id: number) => {
    try {
      const response = await markAsRead(id)
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === id 
              ? { ...notification, is_read: true }
              : notification
          )
        )
      }
    } catch (err: any) {
      console.error('Failed to mark notification as read:', err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const response = await markAllAsRead()
      if (response.success) {
        setNotifications(prev => 
          prev.map(notification => ({ ...notification, is_read: true }))
        )
      }
    } catch (err: any) {
      console.error('Failed to mark all notifications as read:', err)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event': return '📅'
      case 'household': return '🏠'
      case 'resident': return '🧑'
      case 'system': return '⚙️'
      default: return 'ℹ️'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'event': return 'blue'
      case 'household': return 'green'
      case 'resident': return 'purple'
      case 'system': return 'gray'
      default: return 'blue'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading && notifications.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-brand-primary mb-2">Notifications</h1>
          <p className="text-brand-muted">Manage your system notifications</p>
        </div>
        
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <div className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-neutral-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-neutral-200 rounded w-1/3 mb-2"></div>
                    <div className="h-3 bg-neutral-200 rounded w-full mb-1"></div>
                    <div className="h-3 bg-neutral-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-primary mb-2">Notifications</h1>
            <p className="text-brand-muted">Manage your system notifications</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchNotifications(pagination.current_page)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all as read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-brand-muted" />
            <span className="text-sm font-medium text-brand-primary">Filter:</span>
          </div>
          
          <div className="flex gap-2">
            {(['all', 'unread', 'read'] as FilterType[]).map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType)}
                className="px-3 py-1 rounded-lg text-sm font-medium transition-colors border"
                style={{
                  backgroundColor: filter === filterType 
                    ? 'var(--color-primary)' 
                    : 'var(--color-border-light)',
                  color: filter === filterType 
                    ? 'white' 
                    : 'var(--color-text-primary)',
                  borderColor: filter === filterType 
                    ? 'var(--color-primary)' 
                    : 'var(--color-border)'
                }}
                onMouseEnter={(e) => {
                  if (filter !== filterType) {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (filter !== filterType) {
                    e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
                  }
                }}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                {filterType === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 bg-primary-500 text-white text-xs rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {error ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchNotifications()}>Try Again</Button>
            </div>
          </Card>
        ) : notifications.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4" style={{ color: 'var(--color-text-muted)' }}>🔔</div>
              <p className="text-brand-primary mb-2">No notifications found</p>
              <p className="text-sm text-brand-muted">
                {filter === 'all' 
                  ? 'You have no notifications yet.'
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id}>
              <div className="flex items-start gap-4">
                <div className="text-2xl">{getTypeIcon(notification.type)}</div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-brand-primary">
                      {notification.title}
                    </h3>
                    <Badge variant={getTypeColor(notification.type)} size="sm">
                      {notification.type}
                    </Badge>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                  
                  <p className="text-brand-muted mb-3">
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-brand-muted">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                    
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Mark as read
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(pagination.current_page - 1)}
            disabled={pagination.current_page === 1 || loading}
          >
            Previous
          </Button>
          
          <span className="text-sm text-brand-primary">
            Page {pagination.current_page} of {pagination.last_page}
          </span>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchNotifications(pagination.current_page + 1)}
            disabled={pagination.current_page === pagination.last_page || loading}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
