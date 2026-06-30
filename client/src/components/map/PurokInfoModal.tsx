import { useState, useEffect } from 'react'
import { Modal, Button, Row, Col, Alert, Badge } from 'react-bootstrap'
import PurokBoundaryService, { type PurokBoundary, type PurokSummary } from '../../services/purokBoundary.service'
import MapService, { type MapMarker } from '../../services/map.service'
import { pointInPolygon } from '../../utils/pointInPolygon'

interface PurokInfoModalProps {
  show: boolean
  onHide: () => void
  boundary: PurokBoundary | null
  /** When provided, coverage uses this list (stays in sync when pins move). Otherwise markers are fetched from the API. */
  householdMarkers?: MapMarker[]
  onEdit?: () => void
  onDelete: () => void
  isAdmin: boolean
}

export default function PurokInfoModal({
  show,
  onHide,
  boundary,
  householdMarkers: householdMarkersProp,
  onDelete,
  isAdmin
}: PurokInfoModalProps) {
  const [purokSummary, setPurokSummary] = useState<PurokSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coveredStats, setCoveredStats] = useState<{
    house_marker_count: number
    resident_count: number
  }>({ house_marker_count: 0, resident_count: 0 })
  const [isLoadingHouses, setIsLoadingHouses] = useState(false)

  useEffect(() => {
    if (show && boundary?.purok_id) {
      loadPurokSummary()
    } else {
      setPurokSummary(null)
    }
    
    if (show && boundary) {
      calculateCoverageStats()
    } else {
      setCoveredStats({ house_marker_count: 0, resident_count: 0 })
    }
  }, [show, boundary, householdMarkersProp])

  const calculateCoverageStats = async () => {
    if (!boundary) return

    setIsLoadingHouses(true)
    try {
      const householdMarkers =
        householdMarkersProp ??
        (await MapService.getMarkers()).filter((marker) => marker.type === 'household')

      const polygon =
        boundary.points?.map((p) => ({ x: Number(p.x), y: Number(p.y) })).filter(
          (p) => Number.isFinite(p.x) && Number.isFinite(p.y)
        ) ?? []

      const seenMarkerIds = new Set<number>()
      const insideHouseholdMarkers: MapMarker[] = []

      for (const m of householdMarkers) {
        if (seenMarkerIds.has(m.id)) continue
        seenMarkerIds.add(m.id)

        const x = Number(m.x_position)
        const y = Number(m.y_position)
        if (!Number.isFinite(x) || !Number.isFinite(y)) continue

        if (pointInPolygon({ x, y }, polygon)) {
          insideHouseholdMarkers.push(m)
        }
      }

      const uniqueResidentIds = new Set<number>()

      insideHouseholdMarkers.forEach((m) => {
        if (m.household?.id != null) {
          ;(m.household.residents || []).forEach((r: { id?: number }) => {
            if (r?.id != null) uniqueResidentIds.add(r.id)
          })
        }
      })

      setCoveredStats({
        house_marker_count: insideHouseholdMarkers.length,
        resident_count: uniqueResidentIds.size
      })
    } catch (err) {
      setCoveredStats({ house_marker_count: 0, resident_count: 0 })
    } finally {
      setIsLoadingHouses(false)
    }
  }

  const loadPurokSummary = async () => {
    if (!boundary?.purok_id) return

    setIsLoading(true)
    setError(null)

    try {
      const summary = await PurokBoundaryService.getPurokSummary(boundary.purok_id)
      setPurokSummary(summary)
    } catch (err: any) {
      setError('Failed to load purok information')
    } finally {
      setIsLoading(false)
    }
  }


  const handleDelete = () => {
    onDelete()
    onHide()
  }

  if (!boundary) return null

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Purok Boundary Information
          {boundary.purok && (
            <Badge bg="primary" className="ms-2">
              {boundary.purok.name}
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <Row>
          <Col md={6}>
            <h6>Boundary Details</h6>
            <div className="mb-3">
              <strong>Points:</strong> {boundary.points.length}
            </div>
            <div className="mb-3">
              <strong>Created:</strong> {new Date(boundary.created_at).toLocaleDateString()}
            </div>
            <div className="mb-3">
              <strong>Created By:</strong> {boundary.creator?.name || 'Unknown'}
            </div>
            {boundary.updated_by && (
              <div className="mb-3">
                <strong>Last Updated:</strong> {new Date(boundary.updated_at).toLocaleDateString()}
              </div>
            )}
            {boundary.updater && (
              <div className="mb-3">
                <strong>Updated By:</strong> {boundary.updater.name}
              </div>
            )}
          </Col>

          <Col md={6}>
            <h6>Purok Information</h6>
            {isLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Loading purok info...</span>
              </div>
            ) : purokSummary ? (
              <>
                <div className="mb-3">
                  <strong>Name:</strong> {purokSummary.name}
                </div>
                <div className="mb-3">
                  <strong>Captain:</strong> {purokSummary.captain || 'Not assigned'}
                </div>
                <div className="mb-3">
                  <strong>Contact:</strong> {purokSummary.contact || 'Not provided'}
                </div>
                <div className="mb-3">
                  <strong>Households:</strong> 
                  <Badge bg="info" className="ms-2">
                    {purokSummary.household_count}
                  </Badge>
                </div>
                <div className="mb-3">
                  <strong>Covered Houses (Pins in boundary):</strong> 
                  {isLoadingHouses ? (
                    <div className="d-inline-flex align-items-center ms-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Calculating...</span>
                    </div>
                  ) : (
                    <Badge bg="success" className="ms-2">
                      {coveredStats.house_marker_count}
                    </Badge>
                  )}
                </div>
                <div className="mb-3">
                  <strong>Residents in boundary:</strong>
                  {isLoadingHouses ? (
                    <div className="d-inline-flex align-items-center ms-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Calculating...</span>
                    </div>
                  ) : (
                    <Badge bg="dark" className="ms-2">
                      {coveredStats.resident_count}
                    </Badge>
                  )}
                </div>
                {purokSummary.description && (
                  <div className="mb-3">
                    <strong>Description:</strong>
                    <p className="text-muted mt-1">{purokSummary.description}</p>
                  </div>
                )}
              </>
            ) : (
              <div>
                <div className="text-muted mb-3">
                  No purok assigned to this boundary
                </div>
                <div className="mb-3">
                  <strong>Covered Houses (Pins in boundary):</strong> 
                  {isLoadingHouses ? (
                    <div className="d-inline-flex align-items-center ms-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Calculating...</span>
                    </div>
                  ) : (
                    <Badge bg="success" className="ms-2">
                      {coveredStats.house_marker_count}
                    </Badge>
                  )}
                </div>
                <div className="mb-3">
                  <strong>Residents in boundary:</strong>
                  {isLoadingHouses ? (
                    <div className="d-inline-flex align-items-center ms-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Calculating...</span>
                    </div>
                  ) : (
                    <Badge bg="dark" className="ms-2">
                      {coveredStats.resident_count}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </Col>
        </Row>

        {boundary.centroid_x != null && boundary.centroid_y != null && (
          <Row className="mt-3">
            <Col>
              <h6>Boundary Center</h6>
              <div className="text-muted">
                X: {Number(boundary.centroid_x).toFixed(2)}% • Y: {Number(boundary.centroid_y).toFixed(2)}%
              </div>
            </Col>
          </Row>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        
        {isAdmin && (
          <Button variant="danger" onClick={handleDelete}>
            Delete Boundary
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}
