import React from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import { User } from '../../services/users.service'

interface DeleteConfirmModalProps {
  show: boolean
  onHide: () => void
  user: User | null
  onConfirm: () => Promise<void>
  loading: boolean
}

export default function DeleteConfirmModal({ show, onHide, user, onConfirm, loading }: DeleteConfirmModalProps) {
  if (!user) return null

  const handleConfirm = async () => {
    try {
      await onConfirm()
      onHide()
    } catch (error) {
      console.error('Error deleting user:', error)
    }
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <p>Are you sure you want to delete the user <strong>{user.name}</strong>?</p>
        <p className="text-muted mb-0">
          This action will soft delete the user. They can be restored later if needed.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          onClick={handleConfirm}
          disabled={loading}
          className="d-flex align-items-center gap-2"
        >
          {loading && <Spinner animation="border" size="sm" />}
          Delete User
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
