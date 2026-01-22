import { type MapMarker } from '../../services/map.service'
import MapService from '../../services/map.service'

interface MarkerInfoPopupProps {
  marker: MapMarker
  onClose: () => void
  isAdmin: boolean
  onDelete?: (markerId: number) => void
}

export default function MarkerInfoPopup({ marker, onClose, isAdmin, onDelete }: MarkerInfoPopupProps) {
  const getMarkerTypeLabel = (type: string) => {
    const typeLabels: { [key: string]: string } = {
      household: 'Household',
      barangay_hall: 'Barangay Hall',
      chapel: 'Chapel',
      church: 'Church',
      school: 'School',
      health_center: 'Health Center',
      evacuation_center: 'Evacuation Center',
      poi: 'Point of Interest',
      purok_boundary: 'Purok Boundary',
      settlement_zone: 'Settlement Zone',
      hazard_zone: 'Hazard Zone',
      primary_road: 'Primary Road',
      waterway: 'Waterway',
    }
    return typeLabels[type] || type.replace('_', ' ')
  }

  return (
    <div
      className="position-absolute bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50"
      style={{
        minWidth: '280px',
        maxWidth: '320px',
        transform: 'translate(-50%, -100%)',
        marginTop: '-10px'
      }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="position-absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
        style={{ fontSize: '18px' }}
      >
        ×
      </button>

      {/* Marker icon and type */}
      <div className="d-flex align-items-center mb-3">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-3"
          style={{
            width: '40px',
            height: '40px',
            backgroundColor: MapService.getMarkerColor(marker.type),
            color: 'white',
            fontSize: '20px'
          }}
        >
          {MapService.getMarkerIcon(marker.type)}
        </div>
        <div>
          <h6 className="mb-0 fw-bold text-brand-primary">{marker.name}</h6>
          <small className="text-muted">{getMarkerTypeLabel(marker.type)}</small>
        </div>
      </div>

      {/* Description */}
      {marker.description && (
        <div className="mb-3">
          <p className="text-muted small mb-0">{marker.description}</p>
        </div>
      )}

      {/* Position */}
      <div className="mb-3">
        <small className="text-muted">
          <strong>Position:</strong> X: {marker.x_position.toFixed(1)}%, Y: {marker.y_position.toFixed(1)}%
        </small>
      </div>

      {/* Created by */}
      <div className="mb-3">
        <small className="text-muted">
          <strong>Created by:</strong> {marker.creator?.name || 'Unknown'}
        </small>
      </div>

      {/* Created date */}
      <div className="mb-3">
        <small className="text-muted">
          <strong>Created:</strong> {new Date(marker.created_at).toLocaleDateString()}
        </small>
      </div>

      {/* Household Information */}
      {marker.household && (
        <div className="mb-3">
          <small className="text-muted">
            <strong>🏠 Household:</strong> {marker.household.head_name}
          </small>
          <br />
          <small className="text-muted">
            <strong>📍 Address:</strong> {marker.household.address}
          </small>
          <br />
          <small className="text-muted">
            <strong>👥 Residents:</strong> {marker.household.residents?.length || 0}
          </small>
        </div>
      )}

      {/* Admin actions */}
      {isAdmin && (
        <div className="pt-2 border-top">
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                // Edit functionality - navigate to marker edit page or open edit modal
                // Implementation depends on marker management requirements
              }}
            >
              ✏️ Edit
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete "${marker.name}"?`)) {
                  try {
                    const success = await MapService.deleteMarker(marker.id)
                    if (success) {
                      if (onDelete) {
                        onDelete(marker.id)
                      }
                      onClose()
                    } else {
                      alert('Failed to delete marker. Please try again.')
                    }
                  } catch (error) {
                    console.error('Error deleting marker:', error)
                    alert('Failed to delete marker. Please try again.')
                  }
                }
              }}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}

      {/* Arrow pointing to marker */}
      <div
        className="position-absolute"
        style={{
          bottom: '-8px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '0',
          height: '0',
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid white'
        }}
      />
    </div>
  )
}
