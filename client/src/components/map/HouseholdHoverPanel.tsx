import React, { useMemo } from 'react'
import { type MapMarker } from '../../services/map.service'

interface HouseholdHoverPanelProps {
  marker: MapMarker | null
}

export default function HouseholdHoverPanel({ marker }: HouseholdHoverPanelProps) {
  const specialGroups = useMemo(() => {
    if (!marker?.household?.residents) return []

    const groups: string[] = []
    const residents = marker.household.residents

    // Check for Senior Citizens (age >= 60)
    const hasSenior = residents.some(resident => {
      if (resident.age !== undefined) {
        return resident.age >= 60
      }
      // Calculate from birthdate if age is not available
      if (resident.birthdate) {
        const birthDate = new Date(resident.birthdate)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        const monthDiff = today.getMonth() - birthDate.getMonth()
        const dayDiff = today.getDate() - birthDate.getDate()
        const calculatedAge = monthDiff < 0 || (monthDiff === 0 && dayDiff < 0) ? age - 1 : age
        return calculatedAge >= 60
      }
      return false
    })

    // Check for PWD
    const hasPWD = residents.some(resident => resident.is_pwd === true)

    if (hasSenior) groups.push('Senior')
    if (hasPWD) groups.push('PWD')

    // Note: Solo Parent and 4Ps require additional backend data/queries
    // These are not available in the current marker data structure

    return groups
  }, [marker])

  if (!marker || marker.type !== 'household' || !marker.household) {
    return null
  }

  const household = marker.household
  const residentCount = household.residents?.length || 0

  return (
    <div
      className="position-absolute rounded-lg shadow-lg border p-3"
      style={{
        top: '10px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 300,
        minWidth: '280px',
        maxWidth: '400px',
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        pointerEvents: 'none'
      }}
    >
      <div className="d-flex align-items-start mb-2">
        <div
          className="rounded-circle d-flex align-items-center justify-content-center me-2"
          style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontSize: '16px',
            flexShrink: 0
          }}
        >
          🏠
        </div>
        <div className="flex-grow-1">
          <h6 className="mb-1 fw-bold text-brand-primary">{household.head_name}</h6>
          <div className="text-brand-muted small">
            <div>📍 {household.purok?.name || `Purok ${household.purok_id}`}</div>
            <div>🏷️ Household #{household.id}</div>
            <div>👥 {residentCount} {residentCount === 1 ? 'Resident' : 'Residents'}</div>
            {specialGroups.length > 0 && (
              <div className="mt-1">
                <span className="fw-semibold">Special Groups: </span>
                <span>{specialGroups.join(', ')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
