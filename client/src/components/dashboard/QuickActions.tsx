import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Home, MapPin, FileText, Calendar } from 'lucide-react'

export default function QuickActions() {
  const navigate = useNavigate()

  const actions = [
    {
      title: 'Add Household',
      icon: <Home className="h-5 w-5" />,
      onClick: () => navigate('/households'),
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'Add Resident',
      icon: <Users className="h-5 w-5" />,
      onClick: () => navigate('/residents'),
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Manage Puroks',
      icon: <MapPin className="h-5 w-5" />,
      onClick: () => navigate('/puroks'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Manage Events',
      icon: <Calendar className="h-5 w-5" />,
      onClick: () => navigate('/events'),
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'View Reports',
      icon: <FileText className="h-5 w-5" />,
      onClick: () => navigate('/reports'),
      color: 'bg-purple-500 hover:bg-purple-600',
    },
    {
      title: 'Interactive Map',
      icon: <MapPin className="h-5 w-5" />,
      onClick: () => navigate('/map'),
      color: 'bg-teal-500 hover:bg-teal-600',
    },

  ]

  return (
    <div className="col-span-12 lg:col-span-3">
      <div className="bg-white shadow rounded-lg p-4 flex flex-col">
        <h5 className="mb-4 font-semibold text-gray-900">Quick Actions</h5>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`${action.color} text-white p-3 rounded-lg flex flex-col items-center justify-center gap-2 transition-colors duration-200`}
            >
              {action.icon}
              <span className="text-xs font-medium text-center">{action.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
