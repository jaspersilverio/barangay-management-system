import { useEffect, useState } from 'react'
import { Modal, Table, Button, Badge, Row, Col, Toast, ToastContainer, Alert } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getHouseholdResidents, type Resident } from '../../services/households.service'
import { updateResident, deleteResident, listResidents } from '../../services/residents.service'
import ConfirmModal from '../modals/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { FaCheck, FaEdit, FaTrash, FaPlus, FaUserPlus, FaExternalLinkAlt } from 'react-icons/fa'
import Select from 'react-select'

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
  const navigate = useNavigate()
  const { user } = useAuth()
  const { refreshData: refreshDashboard } = useDashboard()
  const [residents, setResidents] = useState<Resident[]>([])
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)
  const [showAddResidentModal, setShowAddResidentModal] = useState(false)
  const [unassignedResidents, setUnassignedResidents] = useState<Resident[]>([])
  const [loadingUnassigned, setLoadingUnassigned] = useState(false)
  const [selectedResidentToAdd, setSelectedResidentToAdd] = useState<Resident | null>(null)
  const [isAddingResident, setIsAddingResident] = useState(false)
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

  const loadUnassignedResidents = async (search?: string) => {
    setLoadingUnassigned(true)
    try {
      const response = await listResidents({ 
        unassigned: true, 
        search,
        per_page: 1000 
      })
      if (response.success) {
        const residentsList = response.data.data || response.data
        const unassigned = Array.isArray(residentsList) 
          ? residentsList.filter((r: Resident) => !r.household_id)
          : []
        setUnassignedResidents(unassigned)
      }
    } catch (error) {
      console.error('Error loading unassigned residents:', error)
    } finally {
      setLoadingUnassigned(false)
    }
  }

  const handleAddExistingResident = async () => {
    if (!selectedResidentToAdd) return

    setIsAddingResident(true)
    try {
      // Update the resident to assign them to this household
      await updateResident(selectedResidentToAdd.id, {
        household_id: household.id,
        relationship_to_head: 'Member', // Default relationship, can be edited later
      })
      setToast({ show: true, message: 'Resident added to household successfully', variant: 'success' })
      await loadResidents()
      await refreshDashboard()
      setShowAddResidentModal(false)
      setSelectedResidentToAdd(null)
    } catch (error: any) {
      setToast({ 
        show: true, 
        message: error?.response?.data?.message || 'Failed to add resident to household', 
        variant: 'danger' 
      })
    } finally {
      setIsAddingResident(false)
    }
  }

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

  const handleOpenAddResidentModal = () => {
    setShowAddResidentModal(true)
    loadUnassignedResidents()
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            Residents of {household.head_name}'s Household
            <div className="text-brand-muted" style={{ fontSize: '0.9rem', fontWeight: 'normal' }}>
              {household.address} {household.purok && `• ${household.purok.name}`}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="mb-3">
            <Col>
              <h6 className="text-brand-primary">
                Total Residents: <Badge bg="primary" className="rounded-pill">{residents.length}</Badge>
              </h6>
            </Col>
            <Col className="text-end">
              {canManage && (
                <>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={handleOpenAddResidentModal}
                    className="btn-brand-primary me-2"
                  >
                    <FaPlus className="me-1" />
                    Add Existing Resident
                  </Button>
                  <Button 
                    variant="outline-primary" 
                    size="sm" 
                    onClick={() => navigate('/residents/register')}
                    className="btn-brand-outline"
                  >
                    <FaUserPlus className="me-1" />
                    Create New Resident
                    <FaExternalLinkAlt className="ms-1" style={{ fontSize: '0.7rem' }} />
                  </Button>
                </>
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
              <p className="text-muted mb-3">No residents in this household yet</p>
              {canManage && (
                <>
                  <Alert variant="info" className="text-start">
                    <strong>Note:</strong> All persons must be registered as residents first before they can be added to a household.
                    <br />
                    <Button 
                      variant="link" 
                      className="p-0 mt-2" 
                      onClick={() => navigate('/residents/register')}
                    >
                      Go to Resident Registration <FaExternalLinkAlt className="ms-1" style={{ fontSize: '0.7rem' }} />
                    </Button>
                  </Alert>
                  <div className="mt-3">
                    <Button variant="outline-primary" onClick={handleOpenAddResidentModal} className="me-2">
                      <FaPlus className="me-1" />
                      Add Existing Resident
                    </Button>
                    <Button variant="primary" onClick={() => navigate('/residents/register')}>
                      <FaUserPlus className="me-1" />
                      Create New Resident
                      <FaExternalLinkAlt className="ms-1" style={{ fontSize: '0.7rem' }} />
                    </Button>
                  </div>
                </>
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
                      <td className="text-capitalize">{resident.sex}</td>
                      <td>{resident.age || '-'}</td>
                      <td>{resident.relationship_to_head || '-'}</td>
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

      {/* Add Existing Resident Modal */}
      <Modal show={showAddResidentModal} onHide={() => {
        setShowAddResidentModal(false)
        setSelectedResidentToAdd(null)
      }} centered>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            Add Existing Resident to Household
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="mb-3">
            <strong>Resident-First Architecture:</strong> Only existing residents can be added to households. 
            To create a new person, go to the <strong>Residents</strong> module first.
          </Alert>
          
          <div className="mb-3">
            <label className="form-label">Select Unassigned Resident</label>
            <Select
              value={selectedResidentToAdd ? {
                value: selectedResidentToAdd.id,
                label: selectedResidentToAdd.full_name
              } : null}
              onChange={(option) => {
                if (option) {
                  const resident = unassignedResidents.find(r => r.id === option.value)
                  setSelectedResidentToAdd(resident || null)
                } else {
                  setSelectedResidentToAdd(null)
                }
              }}
              options={unassignedResidents.map(r => ({
                value: r.id,
                label: `${r.full_name} (Age: ${r.age || 'N/A'})`
              }))}
              placeholder="Search for an unassigned resident..."
              isLoading={loadingUnassigned}
              isClearable
              isSearchable
              onInputChange={(newValue) => {
                if (newValue.length >= 2) {
                  loadUnassignedResidents(newValue)
                } else if (newValue.length === 0) {
                  loadUnassignedResidents()
                }
              }}
            />
            {unassignedResidents.length === 0 && !loadingUnassigned && (
              <div className="text-muted mt-2">
                <small>No unassigned residents found. 
                  <Button 
                    variant="link" 
                    className="p-0 ms-1" 
                    onClick={() => {
                      setShowAddResidentModal(false)
                      navigate('/residents/register')
                    }}
                  >
                    Create a new resident first
                  </Button>
                </small>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowAddResidentModal(false)
              setSelectedResidentToAdd(null)
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddExistingResident}
            disabled={!selectedResidentToAdd || isAddingResident}
          >
            {isAddingResident ? 'Adding...' : 'Add to Household'}
          </Button>
        </Modal.Footer>
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
