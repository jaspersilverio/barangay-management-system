import api from './api'

export interface MapMarker {
  id: number
  name: string
  type: string
  description: string
  x_position: number
  y_position: number
  created_by: number
  created_at: string
  updated_at: string
  household_id?: number
  creator?: {
    id: number
    name: string
  }
  household?: {
    id: number
    address: string
    property_type: string
    head_name: string
    contact: string
    purok_id: number
    residents?: Array<{
      id: number
      first_name: string
      middle_name?: string
      last_name: string
      full_name: string
      sex: string
      birthdate?: string
      age?: number
      relationship_to_head: string
      occupation_status: string
      is_pwd: boolean
    }>
  }
}

export interface CreateMapMarkerData {
  name: string
  type: string
  description: string
  x_position: number
  y_position: number
}

export interface UpdateMapMarkerData {
  name?: string
  type?: string
  description?: string
  x_position?: number
  y_position?: number
}

export interface MapMarkerTypeOption {
  value: string
  label: string
  icon: string
  color: string
}

class MapService {
  private static readonly STORAGE_KEY = 'offline_map_markers'
  private static readonly OFFLINE_ACTIONS_KEY = 'offline_map_actions'

  /**
   * Get all map markers
   */
  async getMarkers(): Promise<MapMarker[]> {
    try {
      const response = await api.get('/map/markers')
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch markers:', error)
      // Return offline data if available
      return this.getOfflineMarkers()
    }
  }

  /**
   * Create a new map marker
   */
  async createMarker(data: CreateMapMarkerData): Promise<MapMarker | null> {
    try {
      const response = await api.post('/map/markers', {
        ...data,
        x_position: data.x_position,
        y_position: data.y_position,
      })
      return response.data.data
    } catch (error: any) {
      console.error('Failed to create marker:', error)
      console.error('Error details:', {
        message: error.response?.data?.message,
        status: error.response?.status,
        statusText: error.response?.statusText
      })
      // Store offline action
      this.storeOfflineAction('create', data)
      return null
    }
  }

  /**
   * Update an existing map marker
   */
  async updateMarker(id: number, data: UpdateMapMarkerData): Promise<MapMarker | null> {
    try {
      const response = await api.put(`/map/markers/${id}`, data)
      return response.data.data
    } catch (error) {
      console.error('Failed to update marker:', error)
      // Store offline action
      this.storeOfflineAction('update', { id, ...data })
      return null
    }
  }

  /**
   * Delete a map marker
   */
  async deleteMarker(id: number): Promise<boolean> {
    try {
      await api.delete(`/map/markers/${id}`)
      return true
    } catch (error) {
      console.error('Failed to delete marker:', error)
      // Store offline action
      this.storeOfflineAction('delete', { id })
      return false
    }
  }

  /**
   * Get marker type options
   */
  async getTypeOptions(): Promise<MapMarkerTypeOption[]> {
    try {
      const response = await api.get('/map/markers/types')
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch type options:', error)
      // Return default options
      return this.getDefaultTypeOptions()
    }
  }

  /**
   * Get default type options
   */
  getDefaultTypeOptions(): MapMarkerTypeOption[] {
    return [
      { value: 'household', label: 'Household', icon: '🏠', color: '#3B82F6' },
      { value: 'barangay_hall', label: 'Barangay Hall', icon: '🏛️', color: '#EF4444' },
      { value: 'chapel', label: 'Chapel', icon: '⛪', color: '#F59E0B' },
      { value: 'church', label: 'Church', icon: '✝️', color: '#D97706' },
      { value: 'school', label: 'School', icon: '🏫', color: '#10B981' },
      { value: 'health_center', label: 'Health Center', icon: '🏥', color: '#8B5CF6' },
      { value: 'evacuation_center', label: 'Evacuation Center', icon: '🚨', color: '#DC2626' },
      { value: 'poi', label: 'Point of Interest', icon: '📍', color: '#6366F1' },
      { value: 'purok_boundary', label: 'Purok Boundary', icon: '🗺️', color: '#059669' },
      { value: 'settlement_zone', label: 'Settlement Zone', icon: '🏘️', color: '#7C3AED' },
      { value: 'hazard_zone', label: 'Hazard Zone', icon: '⚠️', color: '#EA580C' },
      { value: 'primary_road', label: 'Primary Road', icon: '🛣️', color: '#374151' },
      { value: 'waterway', label: 'Waterway', icon: '🌊', color: '#0EA5E9' },
    ]
  }

  /**
   * Get marker icon by type
   */
  getMarkerIcon(type: string): string {
    const options = this.getDefaultTypeOptions()
    const option = options.find(opt => opt.value === type)
    return option?.icon || '📍'
  }

  /**
   * Get marker color by type
   */
  getMarkerColor(type: string): string {
    const options = this.getDefaultTypeOptions()
    const option = options.find(opt => opt.value === type)
    return option?.color || '#9CA3AF'
  }

  /**
   * Get marker with household details
   */
  async getMarkerWithHousehold(id: number): Promise<MapMarker | null> {
    try {
      const response = await api.get(`/map/markers/${id}/with-household`)
      return response.data.data
    } catch (error) {
      console.error('Failed to fetch marker with household:', error)
      return null
    }
  }

  /**
   * Assign a household to a marker
   */
  async assignHousehold(markerId: number, householdId: number): Promise<MapMarker | null> {
    try {
      const response = await api.post(`/map/markers/${markerId}/assign-household`, {
        household_id: householdId
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to assign household:', error)
      return null
    }
  }

  /**
   * Remove household assignment from a marker
   */
  async removeHousehold(markerId: number): Promise<MapMarker | null> {
    try {
      const response = await api.delete(`/map/markers/${markerId}/remove-household`)
      return response.data.data
    } catch (error) {
      console.error('Failed to remove household assignment:', error)
      return null
    }
  }

  // Offline functionality
  private getOfflineMarkers(): MapMarker[] {
    try {
      const stored = localStorage.getItem(MapService.STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get offline markers:', error)
      return []
    }
  }

  private storeOfflineAction(action: 'create' | 'update' | 'delete', data: any): void {
    try {
      const actions = this.getOfflineActions()
      actions.push({
        id: Date.now(),
        action,
        data,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem(MapService.OFFLINE_ACTIONS_KEY, JSON.stringify(actions))
    } catch (error) {
      console.error('Failed to store offline action:', error)
    }
  }

  private getOfflineActions(): any[] {
    try {
      const stored = localStorage.getItem(MapService.OFFLINE_ACTIONS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Failed to get offline actions:', error)
      return []
    }
  }

  /**
   * Get offline status
   */
  getOfflineStatus(): {
    hasOfflineData: boolean
    offlineCreates: number
    offlineUpdates: number
    offlineDeletes: number
  } {
    const actions = this.getOfflineActions()
    const creates = actions.filter(a => a.action === 'create').length
    const updates = actions.filter(a => a.action === 'update').length
    const deletes = actions.filter(a => a.action === 'delete').length

    return {
      hasOfflineData: actions.length > 0,
      offlineCreates: creates,
      offlineUpdates: updates,
      offlineDeletes: deletes
    }
  }

  /**
   * Sync offline data
   */
  async syncOfflineData(): Promise<void> {
    const actions = this.getOfflineActions()
    if (actions.length === 0) return

    for (const action of actions) {
      try {
        switch (action.action) {
          case 'create':
            await this.createMarker(action.data)
            break
          case 'update':
            await this.updateMarker(action.data.id, action.data)
            break
          case 'delete':
            await this.deleteMarker(action.data.id)
            break
        }
      } catch (error) {
        console.error(`Failed to sync action ${action.action}:`, error)
      }
    }

    // Clear offline actions after sync
    localStorage.removeItem(MapService.OFFLINE_ACTIONS_KEY)
  }

  /**
   * Clear offline data
   */
  clearOfflineData(): void {
    localStorage.removeItem(MapService.STORAGE_KEY)
    localStorage.removeItem(MapService.OFFLINE_ACTIONS_KEY)
  }
}

export default new MapService()
