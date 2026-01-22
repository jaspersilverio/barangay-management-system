import { useState } from 'react'
import { Table, Button, Badge, Dropdown, Modal, Alert } from 'react-bootstrap'
import { MoreVertical, Edit, Trash2, Calendar, User } from 'lucide-react'
import { format } from 'date-fns'
import { deleteVaccination } from '../../services/vaccination.service'
import type { Vaccination } from '../../types'

interface VaccinationTableProps {
  vaccinations: Vaccination[]
  onEdit: (vaccination: Vaccination) => void
  onRefresh: () => void
  loading?: boolean
}

export default function VaccinationTable({ vaccinations, onEdit, onRefresh, loading }: VaccinationTableProps) {
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; vaccination: Vaccination | null }>({
    show: false,
    vaccination: null
  })
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = (vaccination: Vaccination) => {
    setDeleteModal({ show: true, vaccination })
  }

  const confirmDelete = async () => {
    if (!deleteModal.vaccination) return

    setDeleting(true)
    setError(null)

    try {
      await deleteVaccination(deleteModal.vaccination.id)
      onRefresh()
      setDeleteModal({ show: false, vaccination: null })
    } catch (err: any) {
      console.error('Error deleting vaccination:', err)
      setError('Failed to delete vaccination record. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'Completed': 'success',
      'Pending': 'warning',
      'Scheduled': 'info'
    } as const

    return (
      <Badge bg={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="table-responsive">
        <Table striped hover>
          <thead>
            <tr>
              <th>Resident</th>
              <th>Vaccine</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td>
                  <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                </td>
                <td>
                  <div className="skeleton-button" style={{ width: '60px', height: '28px' }}></div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  if (vaccinations.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="text-brand-muted">
          <Calendar size={48} className="mb-3" />
          <h5 className="text-brand-primary">No vaccination records found</h5>
          <p>Start by adding a vaccination record for this resident.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="table-responsive">
        <Table striped hover>
          <thead>
            <tr>
              <th>Vaccine Name</th>
              <th>Dose</th>
              <th>Date Administered</th>
              <th>Next Due Date</th>
              <th>Status</th>
              <th>Administered By</th>
              <th style={{ width: '100px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vaccinations.map((vaccination) => (
              <tr key={vaccination.id}>
                <td>
                  <div className="fw-medium">{vaccination.vaccine_name}</div>
                </td>
                <td>
                  <span
                    className="badge rounded-pill"
                    style={{ 
                      color: '#0F172A', 
                      backgroundColor: '#F1F5F9', 
                      padding: '0.25rem 0.75rem',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    {vaccination.dose_number}
                  </span>
                </td>
                <td>
                  <div className="d-flex align-items-center">
                    <Calendar size={16} className="me-2 text-brand-muted" />
                    {formatDate(vaccination.date_administered)}
                  </div>
                </td>
                <td>
                  {vaccination.next_due_date ? (
                    <div className="d-flex align-items-center">
                      <Calendar size={16} className="me-2 text-brand-muted" />
                      {formatDate(vaccination.next_due_date)}
                    </div>
                  ) : (
                    <span className="text-brand-muted">-</span>
                  )}
                </td>
                <td>{getStatusBadge(vaccination.status)}</td>
                <td>
                  {vaccination.administered_by ? (
                    <div className="d-flex align-items-center">
                      <User size={16} className="me-2 text-brand-muted" />
                      {vaccination.administered_by}
                    </div>
                  ) : (
                    <span className="text-brand-muted">-</span>
                  )}
                </td>
                <td>
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-secondary" size="sm" className="border-0">
                      <MoreVertical size={16} />
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => onEdit(vaccination)}>
                        <Edit size={16} className="me-2" />
                        Edit
                      </Dropdown.Item>
                      <Dropdown.Item 
                        onClick={() => handleDelete(vaccination)}
                        className="text-danger"
                      >
                        <Trash2 size={16} className="me-2" />
                        Delete
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} onHide={() => setDeleteModal({ show: false, vaccination: null })} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">Confirm Delete</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}
          <p>
            Are you sure you want to delete this vaccination record for{' '}
            <strong>{deleteModal.vaccination?.vaccine_name}</strong>?
          </p>
          <p className="text-brand-muted small">
            This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button 
            variant="secondary" 
            onClick={() => setDeleteModal({ show: false, vaccination: null })}
            disabled={deleting}
            className="btn-brand-secondary"
          >
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={confirmDelete}
            disabled={deleting}
            className="btn-danger"
          >
            <i className="fas fa-trash me-1"></i>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
