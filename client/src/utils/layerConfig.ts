import MapService from '../services/map.service'

export interface LayerConfig {
  id: string
  name: string
  icon: string
  enabled: boolean
  markerTypes: string[]
  description: string
}

export const DEFAULT_LAYERS: LayerConfig[] = [
  {
    id: 'businessLandmarks',
    name: 'Business & Landmarks',
    icon: '🏢',
    enabled: true,
    markerTypes: ['barangay_hall', 'chapel', 'church', 'school', 'health_center', 'evacuation_center', 'poi'],
    description: 'Government buildings, religious institutions, schools, and points of interest'
  },
  {
    id: 'roadsStreets',
    name: 'Roads & Streets',
    icon: '🛣️',
    enabled: true,
    markerTypes: ['primary_road'],
    description: 'Primary roads and street networks'
  },
  {
    id: 'residentialHouses',
    name: 'Residential Houses',
    icon: '🏠',
    enabled: true,
    markerTypes: ['household'],
    description: 'Residential households and dwellings'
  },
  {
    id: 'streetLabels',
    name: 'Street Labels',
    icon: '📝',
    enabled: true,
    markerTypes: [], // This would be for text labels on the map
    description: 'Street names and location labels'
  },
  {
    id: 'zoningBoundaries',
    name: 'Zoning & Boundaries',
    icon: '🗺️',
    enabled: true,
    markerTypes: ['purok_boundary', 'settlement_zone', 'hazard_zone'],
    description: 'Purok boundaries, settlement zones, and hazard areas'
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    icon: '🌊',
    enabled: true,
    markerTypes: ['waterway'],
    description: 'Waterways and infrastructure elements'
  }
]

export function getLayerConfig(): LayerConfig[] {
  return DEFAULT_LAYERS
}

export function getMarkerLayer(markerType: string): string | null {
  for (const layer of DEFAULT_LAYERS) {
    if (layer.markerTypes.includes(markerType)) {
      return layer.id
    }
  }
  return null
}

export function getVisibleMarkers(markers: any[], layerStates: Record<string, boolean>): any[] {
  return markers.filter(marker => {
    const layerId = getMarkerLayer(marker.type)
    if (!layerId) return true // Show markers that don't belong to any layer
    return layerStates[layerId] !== false
  })
}

export function getLayerState(): Record<string, boolean> {
  const state: Record<string, boolean> = {}
  DEFAULT_LAYERS.forEach(layer => {
    state[layer.id] = layer.enabled
  })
  return state
}

export function getMarkerCountByLayer(markers: any[]): Record<string, number> {
  const counts: Record<string, number> = {}
  
  // Initialize counts for all layers
  DEFAULT_LAYERS.forEach(layer => {
    counts[layer.id] = 0
  })
  
  // Count markers in each layer
  markers.forEach(marker => {
    const layerId = getMarkerLayer(marker.type)
    if (layerId && counts.hasOwnProperty(layerId)) {
      counts[layerId]++
    }
  })
  
  return counts
}
