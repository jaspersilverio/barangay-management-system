import React from 'react'
import MapService from '../../services/map.service'

interface MarkerSelectionPanelProps {
  selectedMarkerType: string | null
  onMarkerTypeSelect: (type: string | null) => void
  isAdmin: boolean
}

export default function MarkerSelectionPanel({ 
  selectedMarkerType, 
  onMarkerTypeSelect, 
  isAdmin 
}: MarkerSelectionPanelProps) {
  const markerTypeOptions = [
    { value: 'household', label: '🏠 Household' },
    { value: 'barangay_hall', label: '🏛️ Barangay Hall' },
    { value: 'chapel', label: '⛪ Chapel' },
    { value: 'church', label: '✝️ Church' },
    { value: 'school', label: '🏫 School' },
    { value: 'health_center', label: '🏥 Health Center' },
    { value: 'evacuation_center', label: '🚨 Evacuation Center' },
    { value: 'poi', label: '📍 Point of Interest' },
    { value: 'purok_boundary', label: '🗺️ Purok Boundary' },
    { value: 'settlement_zone', label: '🏘️ Settlement Zone' },
    { value: 'hazard_zone', label: '⚠️ Hazard Zone' },
    { value: 'primary_road', label: '🛣️ Primary Road' },
    { value: 'waterway', label: '🌊 Waterway' },
  ]

  const handleMarkerTypeClick = (type: string) => {
    if (selectedMarkerType === type) {
      // If clicking the same type, deselect it
      onMarkerTypeSelect(null)
    } else {
      // Select the new type
      onMarkerTypeSelect(type)
    }
  }

  if (!isAdmin) {
    return (
      <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-border-light)', borderColor: 'var(--color-border)' }}>
        <h6 className="text-muted mb-3">👁️ View Only Mode</h6>
        <p className="text-muted small mb-0">
          Only administrators can add markers to the map.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 rounded border" style={{ backgroundColor: 'var(--color-border-light)', borderColor: 'var(--color-border)' }}>
      <h6 className="text-primary mb-3">
        {selectedMarkerType ? '✅ Marker Selected' : '🎯 Select Marker Type'}
      </h6>
      
      {selectedMarkerType && (
        <div className="mb-3 p-2 bg-success bg-opacity-10 rounded border border-success">
          <small className="text-success">
            <strong>Selected:</strong> {markerTypeOptions.find(opt => opt.value === selectedMarkerType)?.label}
          </small>
          <button
            onClick={() => onMarkerTypeSelect(null)}
            className="btn btn-sm btn-outline-secondary ms-2"
          >
            Clear
          </button>
        </div>
      )}

      <div className="row g-2">
        {markerTypeOptions.map(option => (
          <div key={option.value} className="col-6">
            <button
              onClick={() => handleMarkerTypeClick(option.value)}
              className={`btn btn-sm w-100 text-start ${
                selectedMarkerType === option.value
                  ? 'btn-primary'
                  : 'btn-outline-secondary'
              }`}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                border: selectedMarkerType === option.value ? '2px solid' : '1px solid'
              }}
            >
              <div
                className="d-inline-block me-2 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: MapService.getMarkerColor(option.value),
                  color: 'white',
                  fontSize: '10px'
                }}
              >
                {MapService.getMarkerIcon(option.value)}
              </div>
              {option.label.replace(/^[^\s]*\s/, '')}
            </button>
          </div>
        ))}
      </div>

      {selectedMarkerType && (
        <div className="mt-3 p-2 bg-info bg-opacity-10 rounded border border-info">
          <small className="text-info">
            💡 Now click anywhere on the map to place your marker!
          </small>
        </div>
      )}
    </div>
  )
}
