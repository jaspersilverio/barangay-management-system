import { 
  Users, 
  Home, 
  MapPin, 
  Calendar,
  FileText,
  Settings
} from 'lucide-react'

export default function QuickActions() {
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
      primary: 'bg-primary-50 text-primary-600 hover:bg-primary-100',
      success: 'bg-success-50 text-success-600 hover:bg-success-100',
      warning: 'bg-accent-50 text-accent-600 hover:bg-accent-100',
      danger: 'bg-red-50 text-red-600 hover:bg-red-100',
      info: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
      neutral: 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.neutral
  }

  return (
    <div className="card-modern">
      <h5 className="h5 font-bold text-neutral-800 mb-4">Quick Actions</h5>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => (
          <a
            key={index}
            href={action.href}
            className={`p-4 rounded-lg border border-neutral-200 transition-all duration-200 hover:shadow-soft ${getColorClasses(action.color)}`}
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
