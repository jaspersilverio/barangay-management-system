import { useState, useEffect } from 'react'
import { Form } from 'react-bootstrap'
import { getLayerConfig, getLayerState, getMarkerCountByLayer, type LayerConfig } from '../../utils/layerConfig'
import { type MapMarker } from '../../services/map.service'

interface MapLayersProps {
  onLayerToggle: (layer: string, enabled: boolean) => void
  markers: MapMarker[]
}

export default function MapLayers({ onLayerToggle, markers }: MapLayersProps) {
  const [layers, setLayers] = useState<LayerConfig[]>(getLayerConfig())
  const [layerStates, setLayerStates] = useState<Record<string, boolean>>(getLayerState())
  const [markerCounts, setMarkerCounts] = useState<Record<string, number>>({})

  // Update marker counts when markers change
  useEffect(() => {
    const counts = getMarkerCountByLayer(markers)
    setMarkerCounts(counts)
  }, [markers])

  const handleToggle = (layerId: string) => {
    const newLayerStates = { ...layerStates, [layerId]: !layerStates[layerId] }
    setLayerStates(newLayerStates)
    onLayerToggle(layerId, newLayerStates[layerId])
  }

  return (
    <div className="bg-white rounded border p-3">
      <h6 className="mb-3 fw-bold">🗺️ Map Layers</h6>
      
      <Form>
        {layers.map((layer) => (
          <Form.Check
            key={layer.id}
            type="switch"
            id={layer.id}
            label={
              <div className="d-flex justify-content-between align-items-center w-100">
                <span>
                  {layer.icon} {layer.name}
                </span>
                <span className="badge bg-secondary ms-2">
                  {markerCounts[layer.id] || 0}
                </span>
              </div>
            }
            checked={layerStates[layer.id]}
            onChange={() => handleToggle(layer.id)}
            className="mb-2"
          />
        ))}
      </Form>
      
      <hr className="my-3" />
      
      <div className="d-flex align-items-center">
        <div className="me-2">🗺️</div>
        <span className="text-muted small">Map Static (Base Layer)</span>
      </div>

      {/* Layer Summary */}
      <div className="mt-3 p-2 bg-light rounded">
        <small className="text-muted">
          <strong>Total Markers:</strong> {markers.length} | 
          <strong>Visible:</strong> {Object.values(layerStates).filter(Boolean).length} layers
        </small>
      </div>
    </div>
  )
}
