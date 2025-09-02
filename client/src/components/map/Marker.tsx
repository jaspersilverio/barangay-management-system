import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import MapService, { type MapMarker } from '../../services/map.service'

interface MarkerProps {
  marker: MapMarker
  onDelete: (id: number) => void
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: (x: number, y: number) => void
}

export default function Marker({ 
  marker, 
  onDelete, 
  isDragging, 
  onDragStart, 
  onDragEnd 
}: MarkerProps) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [showDetails, setShowDetails] = useState(false)

  const getMarkerIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      household: '🏠',
      barangay_hall: '🏛️',
      school: '🏫',
      health_center: '🏥',
      chapel: '⛪',
      church: '✝️',
      store: '🏪',
      infrastructure: '🏗️',
      evacuation_center: '🚨',
      poi: '📍',
    }
    return icons[type] || '📍'
  }

  const getMarkerColor = (type: string) => {
    const colors: { [key: string]: string } = {
      household: 'bg-blue-500',
      barangay_hall: 'bg-red-500',
      school: 'bg-green-500',
      health_center: 'bg-purple-500',
      chapel: 'bg-yellow-500',
      church: 'bg-yellow-600',
      store: 'bg-orange-500',
      infrastructure: 'bg-gray-500',
      evacuation_center: 'bg-red-600',
      poi: 'bg-indigo-500',
    }
    return colors[type] || 'bg-gray-400'
  }

  const handleDragStart = (e: React.DragEvent) => {
    if (!isAdmin) return
    onDragStart()
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = (e: React.DragEvent) => {
    if (!isAdmin) return
    
    const rect = e.currentTarget.parentElement?.getBoundingClientRect()
    if (rect) {
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      onDragEnd(x, y)
    }
  }

  const handleDelete = async () => {
    if (!isAdmin) return

    if (window.confirm(`Are you sure you want to delete "${marker.name}"?`)) {
      try {
        await MapService.deleteMarker(marker.id)
        onDelete(marker.id)
      } catch (error) {
        console.error('Failed to delete marker:', error)
      }
    }
  }

  return (
    <div
      className={`absolute cursor-pointer transition-all duration-200 ${
        isDragging ? 'scale-110 z-50' : 'hover:scale-105'
      }`}
      style={{
        left: marker.x_position,
        top: marker.y_position,
        transform: 'translate(-50%, -50%)',
      }}
      draggable={isAdmin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => setShowDetails(!showDetails)}
    >
      {/* Marker Icon */}
      <div
        className={`w-2 h-2 rounded-full flex items-center justify-center text-white ${
          getMarkerColor(marker.type)
        }`}
      >
        <span className="text-[6px]">{getMarkerIcon(marker.type)}</span>
      </div>

      {/* Marker Label */}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-white rounded shadow-md text-xs font-medium whitespace-nowrap border">
        {marker.name}
      </div>

      {/* Admin Controls */}
      {isAdmin && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-8 flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete()
            }}
            className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Delete marker"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}

      {/* Details Popup */}
      {showDetails && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-12 bg-white rounded-lg shadow-lg border p-3 min-w-48 z-50">
          <div className="space-y-2">
            <div>
              <h4 className="font-semibold text-gray-900">{marker.name}</h4>
              <p className="text-sm text-gray-600 capitalize">{marker.type.replace('_', ' ')}</p>
            </div>
            
            {marker.description && (
              <div>
                <p className="text-sm text-gray-700">{marker.description}</p>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              <p>Created by: {marker.creator?.name || 'Unknown'}</p>
              <p>Position: ({marker.x_position.toFixed(1)}, {marker.y_position.toFixed(1)})</p>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(false)
            }}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
