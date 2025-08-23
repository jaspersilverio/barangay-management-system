import React, { useEffect, useState } from 'react'
import { getRecentActivities } from '../../services/dashboard.service'
import type { RecentActivity } from '../../services/dashboard.service'
import { Clock, Plus, Edit, Trash2 } from 'lucide-react'

export default function RecentActivities() {
  const [activities, setActivities] = useState<RecentActivity[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true)
        const response = await getRecentActivities()
        if (response.success) {
          setActivities(response.data)
        } else {
          setError(response.message || 'Failed to fetch activities')
        }
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Activities unavailable')
      } finally {
        setLoading(false)
      }
    }
    fetchActivities()
  }, [])

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-500" />
      case 'updated':
        return <Edit className="h-4 w-4 text-blue-500" />
      case 'deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-5">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Recent Activities</h5>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mt-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="col-span-12 lg:col-span-5">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Recent Activities</h5>
          <div className="text-red-600 text-center py-8">Error: {error}</div>
        </div>
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="col-span-12 lg:col-span-5">
        <div className="bg-white shadow rounded-lg p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-gray-900">Recent Activities</h5>
          <div className="text-gray-500 text-center py-8">No recent activities</div>
        </div>
      </div>
    )
  }

  return (
    <div className="col-span-12 lg:col-span-5">
      <div className="bg-white shadow rounded-lg p-4 flex flex-col">
        <h5 className="mb-4 font-semibold text-gray-900">Recent Activities</h5>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="mt-1">
                {getActionIcon(activity.action)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
