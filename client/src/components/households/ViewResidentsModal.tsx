import { useEffect, useState } from 'react'
import { Modal, Table, Button, Badge, Row, Col, Toast, ToastContainer } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getHouseholdResidents, type Resident } from '../../services/households.service'
import { updateResident, deleteResident } from '../../services/residents.service'
import ConfirmModal from '../modals/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { FaCheck, FaEdit, FaTrash } from 'react-icons/fa'

interface ViewResidentsModalProps {
  show: boolean
  onHide: () => void
  household: {
    id: number
    head_name: string
    address: string
    head_resident_id?: number
    purok?: { name: string }
  }
}

export default function ViewResidentsModal({ show, onHide, household }: ViewResidentsModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshData: refreshDashboard } = useDashboard()
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({
    show: false,
    message: '',
    variant: 'success'
  })

  const canManage = user?.role === 'admin' || user?.role === 'purok_leader' || user?.role === 'staff'

  const loadResidents = async () => {
    setLoading(true)
    try {
      const response = await getHouseholdResidents(household.id)
      if (response.success) {
        setResidents(Array.isArray(response.data) ? response.data : [])
      } else {
        setResidents([])
      }
    } catch (error) {
      console.error('Error loading residents:', error)
      setToast({ show: true, message: 'Failed to load residents', variant: 'danger' })
      setResidents([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (show) {
      loadResidents()
    }
  }, [show, household.id])

  const handleRemoveResident = async (residentId: number) => {
    try {
      // Remove resident from household by setting household_id to null
      await updateResident(residentId, {
        household_id: null,
        relationship_to_head: null,
      })
      setToast({ show: true, message: 'Resident removed from household successfully', variant: 'success' })
      await loadResidents()
      await refreshDashboard()
    } catch (error: any) {
      setToast({
        show: true,
        message: error?.response?.data?.message || 'Failed to remove resident from household',
        variant: 'danger'
      })
    }
  }

  const handleDeleteResident = async () => {
    if (!showDeleteConfirm) return

    try {
      await deleteResident(showDeleteConfirm)
      setToast({ show: true, message: 'Resident deleted successfully', variant: 'success' })
      await loadResidents()
      await refreshDashboard()
      setShowDeleteConfirm(null)
    } catch (error: any) {
      setToast({ show: true, message: error?.response?.data?.message || 'Failed to delete resident', variant: 'danger' })
    }
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            Residents of <strong style={{ color: '#fff', fontWeight: '700' }}>{household.head_name}</strong>'s Household
            <div className="text-brand-muted" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
              {household.address} {household.purok && `• ${household.purok.name}`}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col>
              <h6 className="text-brand-primary">
                Household Members: <Badge bg="primary" className="rounded-pill">{residents.length}</Badge>
                {household.head_resident_id && (
                  <small className="text-muted d-block mt-1">
                    Note: Head of household (<strong style={{ color: '#212529' }}>{household.head_name}</strong>) is not shown in this list
                  </small>
                )}
              </h6>
            </Col>
          </Row>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading residents...</p>
            </div>
          ) : residents.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted mb-3">No residents in this household yet</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Sex</th>
                    <th>Age</th>
                    <th>Relationship to Head</th>
                    <th>Occupation Status</th>
                    <th>PWD</th>
                    {canManage && <th style={{ width: 150 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {residents.map((resident) => (
                    <tr key={resident.id}>
                      <td>
                        <Button
                          variant="link"
                          className="p-0 text-start text-decoration-none"
                          onClick={() => navigate(`/residents/${resident.id}`)}
                        >
                          {resident.full_name}
                        </Button>
                      </td>
                      <td>
                        <Badge bg={resident.sex === 'male' ? 'primary' : resident.sex === 'female' ? 'pink' : 'secondary'} className="rounded-pill">
                          {resident.sex ? resident.sex.charAt(0).toUpperCase() + resident.sex.slice(1) : '-'}
                        </Badge>
                      </td>
                      <td>{resident.age || '-'}</td>
                      <td>
                        <span className="text-capitalize">{resident.relationship_to_head || '-'}</span>
                      </td>
                      <td className="text-capitalize">{resident.occupation_status}</td>
                      <td className="text-center">
                        {resident.is_pwd && <FaCheck className="text-success" />}
                      </td>
                      {canManage && (
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => navigate(`/residents/${resident.id}`)}
                              title="View/Edit Resident"
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={() => handleRemoveResident(resident.id)}
                              title="Remove from Household"
                            >
                              Remove
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => setShowDeleteConfirm(resident.id)}
                              title="Delete Resident"
                            >
                              <FaTrash />
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteConfirm !== null}
        title="Delete Resident"
        body="Are you sure you want to delete this resident? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteResident}
        onHide={() => setShowDeleteConfirm(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toast.variant}
          onClose={() => setToast((t) => ({ ...t, show: false }))}
          show={toast.show}
          delay={3000}
          autohide
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  )
}
