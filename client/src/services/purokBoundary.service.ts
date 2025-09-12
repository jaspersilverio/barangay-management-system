import api from './api'

export interface BoundaryPoint {
  x: number
  y: number
}

export interface PurokBoundary {
  id: number
  purok_id: number | null
  points: BoundaryPoint[]
  centroid_x: number | null
  centroid_y: number | null
  created_by: number
  updated_by: number | null
  created_at: string
  updated_at: string
  purok?: {
    id: number
    name: string
    captain: string | null
    contact: string | null
  }
  creator?: {
    id: number
    name: string
  }
  updater?: {
    id: number
    name: string
  }
}

export interface CreateBoundaryData {
  points: BoundaryPoint[]
  purok_id?: number | null
}

export interface UpdateBoundaryData {
  points?: BoundaryPoint[]
  purok_id?: number | null
}

export interface PurokSummary {
  id: number
  name: string
  captain: string | null
  contact: string | null
  household_count: number
  description: string | null
}

class PurokBoundaryService {
  /**
   * Get all boundaries
   */
  async getBoundaries(): Promise<PurokBoundary[]> {
    const response = await api.get('/purok-boundaries')
    return response.data.map((boundary: any) => ({
      ...boundary,
      centroid_x: boundary.centroid_x ? Number(boundary.centroid_x) : null,
      centroid_y: boundary.centroid_y ? Number(boundary.centroid_y) : null
    }))
  }

  /**
   * Get a specific boundary
   */
  async getBoundary(id: number): Promise<PurokBoundary> {
    const response = await api.get(`/purok-boundaries/${id}`)
    const boundary = response.data
    return {
      ...boundary,
      centroid_x: boundary.centroid_x ? Number(boundary.centroid_x) : null,
      centroid_y: boundary.centroid_y ? Number(boundary.centroid_y) : null
    }
  }

  /**
   * Create a new boundary
   */
  async createBoundary(data: CreateBoundaryData): Promise<PurokBoundary> {
    const response = await api.post('/purok-boundaries', data)
    const boundary = response.data
    return {
      ...boundary,
      centroid_x: boundary.centroid_x ? Number(boundary.centroid_x) : null,
      centroid_y: boundary.centroid_y ? Number(boundary.centroid_y) : null
    }
  }

  /**
   * Update a boundary
   */
  async updateBoundary(id: number, data: UpdateBoundaryData): Promise<PurokBoundary> {
    const response = await api.put(`/purok-boundaries/${id}`, data)
    const boundary = response.data
    return {
      ...boundary,
      centroid_x: boundary.centroid_x ? Number(boundary.centroid_x) : null,
      centroid_y: boundary.centroid_y ? Number(boundary.centroid_y) : null
    }
  }

  /**
   * Delete a boundary
   */
  async deleteBoundary(id: number): Promise<void> {
    await api.delete(`/purok-boundaries/${id}`)
  }

  /**
   * Get purok summary
   */
  async getPurokSummary(id: number): Promise<PurokSummary> {
    const response = await api.get(`/puroks/${id}/summary`)
    return response.data.data
  }
}

export default new PurokBoundaryService()
