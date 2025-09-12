import { useState, useEffect } from 'react'
import { Modal, Button, Row, Col, Alert, Badge } from 'react-bootstrap'
import PurokBoundaryService, { type PurokBoundary, type PurokSummary } from '../../services/purokBoundary.service'
import MapService from '../../services/map.service'
import { countPointsInPolygon } from '../../utils/pointInPolygon'

interface PurokInfoModalProps {
  show: boolean
  onHide: () => void
  boundary: PurokBoundary | null
  onEdit?: () => void
  onDelete: () => void
  isAdmin: boolean
}

export default function PurokInfoModal({ 
  show, 
  onHide, 
  boundary, 
  onDelete, 
  isAdmin 
}: PurokInfoModalProps) {
  const [purokSummary, setPurokSummary] = useState<PurokSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [housesInsideCount, setHousesInsideCount] = useState<number>(0)
  const [isLoadingHouses, setIsLoadingHouses] = useState(false)

  useEffect(() => {
    if (show && boundary?.purok_id) {
      loadPurokSummary()
    } else {
      setPurokSummary(null)
    }
    
    if (show && boundary) {
      calculateHousesInside()
    } else {
      setHousesInsideCount(0)
    }
  }, [show, boundary])

  const calculateHousesInside = async () => {
    if (!boundary) return

    setIsLoadingHouses(true)
    try {
      // Get all markers from the map
      const markers = await MapService.getMarkers()
      
      // Filter only household markers
      const householdMarkers = markers.filter(marker => marker.type === 'household')
      
      // Convert marker coordinates to the same coordinate system as boundary points
      // Boundary points are in percentage (0-100), markers are also in percentage
      const housePoints = householdMarkers.map(marker => ({
        x: marker.x_position,
        y: marker.y_position
      }))
      
      // Count houses inside the boundary
      const count = countPointsInPolygon(housePoints, boundary.points)
      setHousesInsideCount(count)
    } catch (err) {
      console.error('Error calculating houses inside boundary:', err)
      setHousesInsideCount(0)
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
                  <strong>Covered Houses:</strong> 
                  {isLoadingHouses ? (
                    <div className="d-inline-flex align-items-center ms-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Calculating...</span>
                    </div>
                  ) : (
                    <Badge bg="success" className="ms-2">
                      {housesInsideCount}
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
                  <strong>Covered Houses:</strong> 
                  {isLoadingHouses ? (
                    <div className="d-inline-flex align-items-center ms-2">
                      <div className="spinner-border spinner-border-sm" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2 text-muted">Calculating...</span>
                    </div>
                  ) : (
                    <Badge bg="success" className="ms-2">
                      {housesInsideCount}
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
