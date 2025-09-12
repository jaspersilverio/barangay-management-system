import { useState, useEffect } from 'react'
import { Modal, Form, Button, Alert } from 'react-bootstrap'
import { getPuroks, type Purok } from '../../services/puroks.service'
import PurokBoundaryService, { type PurokBoundary } from '../../services/purokBoundary.service'

interface AssignPurokModalProps {
  show: boolean
  onHide: () => void
  boundary: PurokBoundary | null
  onAssigned: () => void
}

export default function AssignPurokModal({ show, onHide, boundary, onAssigned }: AssignPurokModalProps) {
  const [puroks, setPuroks] = useState<Purok[]>([])
  const [selectedPurokId, setSelectedPurokId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (show) {
      loadPuroks()
      setSelectedPurokId(boundary?.purok_id || null)
      setError(null)
    }
  }, [show, boundary])

  const loadPuroks = async () => {
    setIsLoading(true)
    try {
      const response = await getPuroks()
      setPuroks(response.data.data)
    } catch (err) {
      setError('Failed to load puroks')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!boundary || !selectedPurokId) return

    setIsSaving(true)
    setError(null)

    try {
      await PurokBoundaryService.updateBoundary(boundary.id, {
        purok_id: selectedPurokId
      })
      
      onAssigned()
      onHide()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to assign boundary to purok')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnassign = async () => {
    if (!boundary) return

    setIsSaving(true)
    setError(null)

    try {
      await PurokBoundaryService.updateBoundary(boundary.id, {
        purok_id: null
      })
      
      onAssigned()
      onHide()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to unassign boundary')
    } finally {
      setIsSaving(false)
    }
  }

  const filteredPuroks = puroks.filter(purok =>
    purok.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (purok.captain && purok.captain.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Assign Boundary to Purok</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <div className="mb-3">
          <h6>Boundary Information</h6>
          <p className="text-muted mb-0">
            Points: {boundary?.points.length || 0} • 
            Created: {boundary?.created_at ? new Date(boundary.created_at).toLocaleDateString() : 'Unknown'}
          </p>
        </div>

        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Search Puroks</Form.Label>
            <Form.Control
              type="text"
              placeholder="Search by purok name or captain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Select Purok</Form.Label>
            {isLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span className="ms-2">Loading puroks...</span>
              </div>
            ) : (
              <Form.Select
                value={selectedPurokId || ''}
                onChange={(e) => setSelectedPurokId(e.target.value ? parseInt(e.target.value) : null)}
              >
                <option value="">-- Select a Purok --</option>
                {filteredPuroks.map((purok) => (
                  <option key={purok.id} value={purok.id}>
                    {purok.name} {purok.captain && `(${purok.captain})`}
                  </option>
                ))}
              </Form.Select>
            )}
          </Form.Group>

          {selectedPurokId && (
            <Alert variant="info" className="mb-3">
              <strong>Selected Purok:</strong> {puroks.find(p => p.id === selectedPurokId)?.name}
              {puroks.find(p => p.id === selectedPurokId)?.captain && (
                <><br /><strong>Captain:</strong> {puroks.find(p => p.id === selectedPurokId)?.captain}</>
              )}
            </Alert>
          )}
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          Cancel
        </Button>
        
        {boundary?.purok_id && (
          <Button 
            variant="warning" 
            onClick={handleUnassign}
            disabled={isSaving}
          >
            {isSaving ? 'Unassigning...' : 'Unassign'}
          </Button>
        )}
        
        <Button 
          variant="primary" 
          onClick={handleAssign}
          disabled={!selectedPurokId || isSaving}
        >
          {isSaving ? 'Assigning...' : 'Assign to Purok'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
