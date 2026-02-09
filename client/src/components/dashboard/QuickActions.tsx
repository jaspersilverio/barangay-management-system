import { Link } from 'react-router-dom'
import { 
  Users, 
  Calendar,
  FileText,
  Settings,
  Award,
  ClipboardList
} from 'lucide-react'

export default function QuickActions() {
  const actions = [
    {
      title: 'Register Resident',
      description: 'Register new resident',
      icon: <Users className="w-6 h-6" />,
      to: '/residents/register',
      color: 'primary'
    },
    {
      title: 'Certificates',
      description: 'Request and issue certificates',
      icon: <Award className="w-6 h-6" />,
      to: '/certificates',
      color: 'info'
    },
    {
      title: 'Blotter',
      description: 'Blotter entries and reports',
      icon: <ClipboardList className="w-6 h-6" />,
      to: '/blotter',
      color: 'success'
    },
    {
      title: 'Events',
      description: 'Schedule and manage events',
      icon: <Calendar className="w-6 h-6" />,
      to: '/events',
      color: 'warning'
    },
    {
      title: 'Reports',
      description: 'Generate reports',
      icon: <FileText className="w-6 h-6" />,
      to: '/reports',
      color: 'danger'
    },
    {
      title: 'Settings',
      description: 'System settings',
      icon: <Settings className="w-6 h-6" />,
      to: '/settings',
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
          <Link
            key={index}
            to={action.to}
            className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-soft text-decoration-none d-block ${getColorClasses(action.color)}`}
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
          </Link>
        ))}
      </div>
    </div>
  )
}
