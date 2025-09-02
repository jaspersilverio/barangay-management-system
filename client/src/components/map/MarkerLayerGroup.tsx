import React from 'react'
import { type MapMarker } from '../../services/map.service'
import { getMarkerLayer } from '../../utils/layerConfig'
import MapService from '../../services/map.service'
import MarkerInfoPopup from './MarkerInfoPopup'

interface MarkerLayerGroupProps {
  markers: MapMarker[]
  layerId: string
  isVisible: boolean
  highlightedMarker: MapMarker | null
  onMarkerClick: (e: React.MouseEvent, marker: MapMarker) => void
  selectedMarkerForInfo: MapMarker | null
  isAdmin: boolean
}

export default function MarkerLayerGroup({
  markers,
  layerId,
  isVisible,
  highlightedMarker,
  onMarkerClick,
  selectedMarkerForInfo,
  isAdmin
}: MarkerLayerGroupProps) {
  if (!isVisible) return null

  const getMarkerIcon = (type: string) => {
    return MapService.getMarkerIcon(type)
  }

  const getMarkerColor = (type: string) => {
    return MapService.getMarkerColor(type)
  }

  return (
    <>
      {markers.map((marker) => {
        // Only render markers that belong to this layer
        if (getMarkerLayer(marker.type) !== layerId) return null

        return (
          <div key={marker.id}>
            {/* Main marker */}
            <div
              style={{
                position: 'absolute',
                left: `${marker.x_position}%`,
                top: `${marker.y_position}%`,
                width: '16px',
                height: '16px',
                backgroundColor: getMarkerColor(marker.type),
                borderRadius: '50%',
                border: highlightedMarker?.id === marker.id 
                  ? '3px solid #ffc107' 
                  : '1px solid white',
                transform: 'translate(-50%, -50%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '8px',
                boxShadow: highlightedMarker?.id === marker.id 
                  ? '0 0 10px #ffc107, 0 2px 4px rgba(0,0,0,0.3)' 
                  : '0 2px 4px rgba(0,0,0,0.3)',
                cursor: 'pointer',
                zIndex: highlightedMarker?.id === marker.id ? 150 : 100,
                pointerEvents: 'auto',
                transition: 'all 0.3s ease'
              }}
              onClick={(e) => {
                e.stopPropagation()
                onMarkerClick(e, marker)
              }}
            >
              {getMarkerIcon(marker.type) || '📍'}
            </div>
          </div>
        )
      })}
    </>
  )
}
