import { useEffect, useState } from 'react'
import { Modal, Table, Button, Badge, Row, Col, Toast, ToastContainer, Form, InputGroup, Dropdown } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getHouseholdResidents, type Resident } from '../../services/households.service'
import { updateResident, deleteResident, createResident, listResidents } from '../../services/residents.service'
import { createSoloParent } from '../../services/solo-parents.service'
import ResidentFormModal, { type ResidentFormValues } from '../residents/ResidentFormModal'
import ConfirmModal from '../modals/ConfirmModal'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { FaCheck, FaEdit, FaTrash, FaPlus, FaUserPlus, FaUser } from 'react-icons/fa'

const RELATIONSHIP_OPTIONS = ['Spouse', 'Child', 'Parent', 'Sibling', 'Grandchild', 'Grandparent', 'Other', 'Household Helper']

interface ViewResidentsModalProps {
  show: boolean
  onHide: () => void
  household: {
    id: number
    head_name: string
    address: string
    head_resident_id?: number
    purok?: { name: string }
    purok_id?: number
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
  const [showAddExistingModal, setShowAddExistingModal] = useState(false)
  const [existingSearch, setExistingSearch] = useState('')
  const [existingResidents, setExistingResidents] = useState<any[]>([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [selectedExistingResident, setSelectedExistingResident] = useState<any | null>(null)
  const [selectedRelationship, setSelectedRelationship] = useState('')
  const [submittingExisting, setSubmittingExisting] = useState(false)
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
      if (response.success && Array.isArray(response.data)) {
        setResidents(response.data)
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

  const loadExistingResidents = async () => {
    setLoadingExisting(true)
    try {
      const res = await listResidents({ per_page: 500, search: existingSearch || undefined })
      const raw = res?.data
      const list = Array.isArray(raw) ? raw : (raw?.data ?? [])
      const excludeIds = new Set([
        ...(household.head_resident_id ? [household.head_resident_id] : []),
        ...residents.map((r) => r.id),
      ])
      const filtered = list.filter((r: any) => !excludeIds.has(r.id))
      setExistingResidents(filtered)
    } catch (e) {
      console.error('Failed to load residents:', e)
      setExistingResidents([])
    } finally {
      setLoadingExisting(false)
    }
  }

  useEffect(() => {
    if (showAddExistingModal) {
      setSelectedExistingResident(null)
      setSelectedRelationship('')
      setExistingSearch('')
      loadExistingResidents()
    }
  }, [showAddExistingModal])

  useEffect(() => {
    if (!showAddExistingModal) return
    const delay = existingSearch ? 300 : 0
    const t = setTimeout(loadExistingResidents, delay)
    return () => clearTimeout(t)
  }, [showAddExistingModal, existingSearch])

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

  const handleAddResidentSubmit = async (values: ResidentFormValues & { photo?: File }) => {
    const residentPayload: any = {
      household_id: household.id,
      first_name: values.first_name,
      middle_name: values.middle_name || null,
      last_name: values.last_name,
      suffix: values.suffix || null,
      sex: values.sex,
      birthdate: values.birthdate,
      place_of_birth: values.place_of_birth || null,
      nationality: values.nationality || null,
      religion: values.religion || null,
      contact_number: values.contact_number || null,
      email: values.email || null,
      valid_id_type: values.valid_id_type || null,
      valid_id_number: values.valid_id_number || null,
      civil_status: values.civil_status,
      relationship_to_head: values.relationship_to_head || null,
      occupation_status: values.occupation_status,
      employer_workplace: values.employer_workplace || null,
      educational_attainment: values.educational_attainment || null,
      is_pwd: !!values.is_pwd,
      is_pregnant: !!values.is_pregnant,
      resident_status: values.resident_status || 'active',
      remarks: values.remarks || null,
      photo: values.photo,
    }
    if (household.purok_id) {
      residentPayload.purok_id = household.purok_id
    }
    const residentResponse = await createResident(residentPayload)
    if (!residentResponse.success || !residentResponse.data) {
      throw new Error(residentResponse.message || 'Failed to create resident')
    }
    const createdResident = residentResponse.data
    if (values.is_solo_parent) {
      try {
        const today = new Date()
        const validUntil = new Date(today)
        validUntil.setFullYear(validUntil.getFullYear() + 1)
        await createSoloParent({
          resident_id: createdResident.id,
          eligibility_reason: 'unmarried_parent',
          date_declared: today.toISOString().split('T')[0],
          valid_until: validUntil.toISOString().split('T')[0],
        })
      } catch (e) {
        console.warn('Solo parent record creation failed:', e)
      }
    }
    setToast({ show: true, message: 'Resident added to household successfully', variant: 'success' })
    setShowAddResidentModal(false)
    await loadResidents()
    await refreshDashboard()
  }

  const handleAddExistingSubmit = async () => {
    if (!selectedExistingResident || !selectedRelationship.trim()) return
    setSubmittingExisting(true)
    try {
      await updateResident(selectedExistingResident.id, {
        household_id: household.id,
        relationship_to_head: selectedRelationship.trim(),
      })
      setToast({ show: true, message: 'Existing resident added to household successfully', variant: 'success' })
      setShowAddExistingModal(false)
      await loadResidents()
      await refreshDashboard()
    } catch (error: any) {
      setToast({
        show: true,
        message: error?.response?.data?.message || 'Failed to add resident to household',
        variant: 'danger',
      })
    } finally {
      setSubmittingExisting(false)
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
          <Row className="mb-3 align-items-center">
            <Col>
              <h6 className="text-brand-primary mb-0">
                Household Members: <Badge bg="primary" className="rounded-pill">{residents.length}</Badge>
                {household.head_resident_id && (
                  <small className="text-muted d-block mt-1">
                    Note: Head of household (<strong style={{ color: '#212529' }}>{household.head_name}</strong>) is not shown in this list
                  </small>
                )}
              </h6>
            </Col>
            {canManage && (
              <Col xs="auto">
                <Dropdown>
                  <Dropdown.Toggle variant="primary" size="sm" className="d-flex align-items-center gap-1">
                    <FaPlus /> Add Resident
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => setShowAddResidentModal(true)}>
                      <FaUserPlus className="me-2" /> Add Resident
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => setShowAddExistingModal(true)}>
                      <FaUser className="me-2" /> Add Existing Resident
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Col>
            )}
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

      {/* Add Resident Modal */}
      <ResidentFormModal
        show={showAddResidentModal}
        initial={{
          assignment_mode: 'existing',
          household_id: household.id,
          purok_id: household.purok_id ?? undefined,
          relationship_to_head: '',
        }}
        onSubmit={handleAddResidentSubmit}
        onHide={() => setShowAddResidentModal(false)}
      />

      {/* Add Existing Resident Modal */}
      <Modal show={showAddExistingModal} onHide={() => setShowAddExistingModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Existing Resident</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="text-muted small mb-3">Search and select a resident to add to this household.</p>
          <Form.Group className="mb-3">
            <Form.Label>Search Resident</Form.Label>
            <InputGroup>
              <Form.Control
                placeholder="Search by name..."
                value={existingSearch}
                onChange={(e) => setExistingSearch(e.target.value)}
              />
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Select Resident</Form.Label>
            {loadingExisting ? (
              <div className="text-center py-3 text-muted">Loading...</div>
            ) : existingResidents.length === 0 ? (
              <div className="text-center py-3 text-muted">No residents found. Try a different search.</div>
            ) : (
              <div className="border rounded" style={{ maxHeight: 200, overflowY: 'auto' }}>
                {existingResidents.map((r) => (
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    className={`p-2 border-bottom ${selectedExistingResident?.id === r.id ? 'bg-primary bg-opacity-10' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedExistingResident(r)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedExistingResident(r)}
                  >
                    <strong>{r.full_name || `${r.first_name} ${r.last_name}`}</strong>
                    {r.household_id && (
                      <small className="text-muted d-block">Currently in another household</small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Relationship to Head</Form.Label>
            <Form.Select
              value={selectedRelationship}
              onChange={(e) => setSelectedRelationship(e.target.value)}
              required
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddExistingModal(false)}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleAddExistingSubmit}
            disabled={!selectedExistingResident || !selectedRelationship.trim() || submittingExisting}
          >
            {submittingExisting ? 'Adding...' : 'Add to Household'}
          </Button>
        </Modal.Footer>
      </Modal>

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
