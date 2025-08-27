import React, { useEffect, useState } from 'react'
import { Modal, Table, Button, Badge, Row, Col, Toast, ToastContainer } from 'react-bootstrap'
import { getHouseholdResidents, type Resident } from '../../services/households.service'
import { createResident, updateResident, deleteResident } from '../../services/residents.service'
import ResidentFormModal from '../residents/ResidentFormModal'
import ConfirmModal from '../modals/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { FaCheck, FaEdit, FaTrash, FaPlus } from 'react-icons/fa'

interface ViewResidentsModalProps {
  show: boolean
  onHide: () => void
  household: {
    id: number
    head_name: string
    address: string
    purok?: { name: string }
  }
}

export default function ViewResidentsModal({ show, onHide, household }: ViewResidentsModalProps) {
  const { user } = useAuth()
  const { refreshData: refreshDashboard } = useDashboard()
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(false)
  const [showResidentForm, setShowResidentForm] = useState(false)
  const [editingResident, setEditingResident] = useState<Resident | null>(null)
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
        setResidents(response.data)
      }
    } catch (error) {
      console.error('Error loading residents:', error)
      setToast({ show: true, message: 'Failed to load residents', variant: 'danger' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (show) {
      loadResidents()
    }
  }, [show, household.id])

  const handleCreateResident = async (values: any) => {
    try {
      const payload = {
        ...values,
        household_id: household.id,
      }
      await createResident(payload)
      setToast({ show: true, message: 'Resident created successfully', variant: 'success' })
      await loadResidents()
      // Refresh dashboard data to update counts
      await refreshDashboard()
      setShowResidentForm(false)
    } catch (error: any) {
      setToast({ show: true, message: error?.response?.data?.message || 'Failed to create resident', variant: 'danger' })
    }
  }

  const handleUpdateResident = async (values: any) => {
    if (!editingResident) return
    
    try {
      const payload = {
        ...values,
        household_id: household.id,
      }
      await updateResident(editingResident.id, payload)
      setToast({ show: true, message: 'Resident updated successfully', variant: 'success' })
      await loadResidents()
      // Refresh dashboard data to update counts
      await refreshDashboard()
      setShowResidentForm(false)
      setEditingResident(null)
    } catch (error: any) {
      setToast({ show: true, message: error?.response?.data?.message || 'Failed to update resident', variant: 'danger' })
    }
  }

  const handleDeleteResident = async () => {
    if (!showDeleteConfirm) return
    
    try {
      await deleteResident(showDeleteConfirm)
      setToast({ show: true, message: 'Resident deleted successfully', variant: 'success' })
      await loadResidents()
      // Refresh dashboard data to update counts
      await refreshDashboard()
      setShowDeleteConfirm(null)
    } catch (error: any) {
      setToast({ show: true, message: error?.response?.data?.message || 'Failed to delete resident', variant: 'danger' })
    }
  }

  const handleEditResident = (resident: Resident) => {
    setEditingResident(resident)
    setShowResidentForm(true)
  }

  const handleAddResident = () => {
    setEditingResident(null)
    setShowResidentForm(true)
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            Residents of {household.head_name}'s Household
            <div className="text-muted" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
              {household.address} {household.purok && `• ${household.purok.name}`}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col>
              <h6>
                Total Residents: <Badge bg="primary">{residents.length}</Badge>
              </h6>
            </Col>
            <Col className="text-end">
              {canManage && (
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleAddResident}
                >
                  <FaPlus className="me-1" />
                  Add Resident
                </Button>
              )}
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
              <p className="text-muted">No residents yet</p>
              {canManage && (
                <Button variant="outline-primary" onClick={handleAddResident}>
                  <FaPlus className="me-1" />
                  Add First Resident
                </Button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Full Name</th>
                    <th>Sex</th>
                    <th>Age</th>
                    <th>Occupation Status</th>
                    <th>PWD</th>
                    {canManage && <th style={{ width: 120 }}>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {residents.map((resident) => (
                    <tr key={resident.id}>
                      <td>{resident.full_name}</td>
                      <td>{resident.sex}</td>
                      <td>{resident.age || '-'}</td>
                      <td>{resident.occupation_status}</td>
                      <td className="text-center">
                        {resident.is_pwd && <FaCheck className="text-success" />}
                      </td>
                      {canManage && (
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => handleEditResident(resident)}
                            >
                              <FaEdit />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => setShowDeleteConfirm(resident.id)}
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

      {/* Resident Form Modal */}
      <ResidentFormModal
        show={showResidentForm}
        initial={editingResident ? {
          household_id: household.id,
          first_name: editingResident.first_name,
          middle_name: editingResident.middle_name || '',
          last_name: editingResident.last_name,
          sex: editingResident.sex as any,
          birthdate: editingResident.birthdate || '',
          relationship_to_head: editingResident.relationship_to_head,
          occupation_status: editingResident.occupation_status as any,
          is_pwd: editingResident.is_pwd,
        } : undefined}
        onSubmit={editingResident ? handleUpdateResident : handleCreateResident}
        onHide={() => {
          setShowResidentForm(false)
          setEditingResident(null)
        }}
      />

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
