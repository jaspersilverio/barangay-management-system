import { useState, useEffect } from 'react'
import { 
  Users, 
  Home, 
  MapPin, 
  Calendar,
  FileText,
  Settings
} from 'lucide-react'

export default function QuickActions() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate a brief loading state for consistency with other dashboard components
    const timer = setTimeout(() => {
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="card-modern p-4">
        <h5 className="h5 font-bold text-brand-primary mb-4">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="skeleton-card" style={{ height: '80px' }}>
              <div className="d-flex align-items-center gap-3 p-4">
                <div className="skeleton-circle" style={{ width: '40px', height: '40px' }}></div>
                <div className="flex-1">
                  <div className="skeleton-line" style={{ width: '70%', height: '16px', marginBottom: '8px' }}></div>
                  <div className="skeleton-line" style={{ width: '50%', height: '12px' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }
  const actions = [
    {
      title: 'Add Resident',
      description: 'Register new resident',
      icon: <Users className="w-6 h-6" />,
      href: '/residents/add',
      color: 'primary'
    },
    {
      title: 'Add Household',
      description: 'Register new household',
      icon: <Home className="w-6 h-6" />,
      href: '/households/add',
      color: 'success'
    },
    {
      title: 'Add Purok',
      description: 'Create new purok',
      icon: <MapPin className="w-6 h-6" />,
      href: '/puroks/add',
      color: 'info'
    },
    {
      title: 'Add Event',
      description: 'Schedule new event',
      icon: <Calendar className="w-6 h-6" />,
      href: '/events/add',
      color: 'warning'
    },
    {
      title: 'Generate Report',
      description: 'Create reports',
      icon: <FileText className="w-6 h-6" />,
      href: '/reports',
      color: 'danger'
    },
    {
      title: 'Settings',
      description: 'System settings',
      icon: <Settings className="w-6 h-6" />,
      href: '/settings',
      color: 'neutral'
    }
  ]

  const getColorClasses = (color: string) => {
    const colorMap = {
      primary: 'text-blue-600 dark:text-blue-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-orange-600 dark:text-orange-400',
      danger: 'text-red-600 dark:text-red-400',
      info: 'text-blue-600 dark:text-blue-400',
      neutral: 'text-gray-600 dark:text-gray-400'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.neutral
  }

  return (
    <div className="card-modern p-4">
      <h5 className="h5 font-bold text-brand-primary mb-4">Quick Actions</h5>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-soft ${getColorClasses(action.color)}`}
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-surface)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-surface)'
            }}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getColorClasses(action.color)}`}>
                {action.icon}
              </div>
              <div>
                <h6 className="font-semibold text-sm">{action.title}</h6>
                <p className="text-xs opacity-75">{action.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  )
}
