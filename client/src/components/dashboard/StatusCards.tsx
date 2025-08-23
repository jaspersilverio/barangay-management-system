import React from 'react'
import { CheckCircle, AlertCircle, Shield, Database, Wifi, Server } from 'lucide-react'

export default function StatusCards() {
  const statusItems = [
    {
      title: 'System Status',
      status: 'operational',
      icon: <Server className="h-5 w-5" />,
      description: 'All systems running normally',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Emergency Status',
      status: 'clear',
      icon: <Shield className="h-5 w-5" />,
      description: 'No active emergencies',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Data Quality',
      status: 'good',
      icon: <Database className="h-5 w-5" />,
      description: '98% data completeness',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Network Status',
      status: 'connected',
      icon: <Wifi className="h-5 w-5" />,
      description: 'Stable connection',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
      case 'clear':
      case 'good':
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  return (
    <div className="col-span-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statusItems.map((item, index) => (
          <div key={index} className={`${item.bgColor} p-4 rounded-lg border border-gray-200`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {item.icon}
                <h6 className="font-medium text-gray-900">{item.title}</h6>
              </div>
              {getStatusIcon(item.status)}
            </div>
            <p className={`text-sm font-medium ${item.color}`}>
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
