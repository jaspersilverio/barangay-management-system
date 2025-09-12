import React from 'react'
import { Modal, Button, Alert } from 'react-bootstrap'
import PurokBoundaryService, { type PurokBoundary } from '../../services/purokBoundary.service'

interface DeleteBoundaryModalProps {
  show: boolean
  onHide: () => void
  boundary: PurokBoundary | null
  onDeleted: () => void
}

export default function DeleteBoundaryModal({ show, onHide, boundary, onDeleted }: DeleteBoundaryModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleDelete = async () => {
    if (!boundary) return

    setIsDeleting(true)
    setError(null)

    try {
      await PurokBoundaryService.deleteBoundary(boundary.id)
      onDeleted()
      onHide()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete boundary')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Delete Boundary</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        <p>Are you sure you want to delete this boundary?</p>
        
        {boundary && (
          <div className="bg-light p-3 rounded mb-3">
            <strong>Boundary Details:</strong>
            <ul className="mb-0 mt-2">
              <li>Points: {boundary.points.length}</li>
              <li>Purok: {boundary.purok?.name || 'Unassigned'}</li>
              <li>Created: {new Date(boundary.created_at).toLocaleDateString()}</li>
            </ul>
          </div>
        )}

        <Alert variant="warning">
          <strong>Warning:</strong> This action cannot be undone. The boundary will be permanently removed from the system.
        </Alert>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete Boundary'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
