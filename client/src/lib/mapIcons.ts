import L from 'leaflet'

const createIcon = (emoji: string) =>
  L.divIcon({
    className: 'custom-emoji-icon',
    html: `<div style="font-size:20px; line-height:20px">${emoji}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    popupAnchor: [0, -20],
  })

export const icons = {
  household: createIcon('🏠'),
  barangay_hall: createIcon('🏛️'),
  chapel: createIcon('⛪'),
  church: createIcon('✝️'),
  school: createIcon('🏫'),
  health_center: createIcon('🏥'),
  evacuation_center: createIcon('🚨'),
  poi: createIcon('📍'),
}

export type MarkerType = keyof typeof icons
