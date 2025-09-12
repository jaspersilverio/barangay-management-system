import { useEffect, useState, useMemo } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Toast, ToastContainer, Badge } from 'react-bootstrap'
import { listHouseholds, deleteHousehold, createHousehold, updateHousehold, getArchivedHouseholds, verifyArchivePassword, restoreHousehold, forceDeleteHousehold, type Household } from '../../services/households.service'
import ConfirmModal from '../../components/modals/ConfirmModal'
import HouseholdFormModal from '../../components/households/HouseholdFormModal'
import ViewResidentsModal from '../../components/households/ViewResidentsModal'
import { useNavigate } from 'react-router-dom'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'
import { FaUsers, FaEdit, FaTrash, FaPlus, FaArchive, FaUndo } from 'react-icons/fa'
import { Modal, Alert, Spinner } from 'react-bootstrap'

export default function HouseholdListPage() {
  const navigate = useNavigate()
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const { refreshData: refreshDashboard } = useDashboard()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [items, setItems] = useState<Household[]>([])
  const [search, setSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewResidents, setShowViewResidents] = useState<null | Household>(null)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' | 'warning' }>({ show: false, message: '', variant: 'success' })
  
  // Archive-related state
  const [showArchiveView, setShowArchiveView] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState('')
  const [archiveAuthenticated, setArchiveAuthenticated] = useState(false)

  const canManage = role === 'admin' || role === 'purok_leader'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  const load = async () => {
    setLoading(true)
    try {
      let res
      if (showArchiveView && archiveAuthenticated) {
        res = await getArchivedHouseholds({ search, page })
        // Archived households response structure: { success: true, data: { data: [...], meta: {...} } }
        const archivedData = res.data.data
        setItems(archivedData.data || [])
        setTotalPages(archivedData.last_page || 1)
      } else {
        res = await listHouseholds({ search, page, purok_id: effectivePurokId || undefined })
        // Keep original working logic for regular households
        const data = res.data
        const list = data.data ?? data
        setItems(list.data ?? list)
        setTotalPages(list.last_page ?? 1)
      }
    } catch (error) {
      console.error('Error loading households:', error)
      setItems([])
      setTotalPages(1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    if (showArchiveView && archiveAuthenticated) {
      load().catch(() => null)
    } else if (!showArchiveView) {
      load().catch(() => null)
    }
  }, [search, page, effectivePurokId, showArchiveView, archiveAuthenticated])

  const handleDelete = async () => {
    if (showDelete == null) return
    try {
      await deleteHousehold(showDelete)
      setToast({ show: true, message: 'Household deleted', variant: 'success' })
      await load()
      // Refresh dashboard data to update counts
      await refreshDashboard()
    } catch (e: any) {
      setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
    } finally {
      setShowDelete(null)
    }
  }

  const handleViewResidents = (household: Household) => {
    setShowViewResidents(household)
  }

  // Archive-related handlers
  const handleToggleArchive = () => {
    if (role !== 'admin') {
      setToast({ show: true, message: 'Access denied. This feature is only available to administrators.', variant: 'danger' })
      return
    }

    if (!showArchiveView) {
      // Switching to archive view - require password
      setShowPasswordModal(true)
    } else {
      // Switching back to active view
      setShowArchiveView(false)
      setArchiveAuthenticated(false)
      setPassword('')
      setPasswordError('')
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordLoading(true)
    setPasswordError('')

    try {
      const isValid = await verifyArchivePassword(password)
      if (isValid) {
        setArchiveAuthenticated(true)
        setShowArchiveView(true)
        setShowPasswordModal(false)
        setPassword('')
      } else {
        setPasswordError('Invalid password. Please try again.')
      }
    } catch (error) {
      setPasswordError('Failed to verify password. Please try again.')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleRestoreHousehold = async (household: Household) => {
    if (window.confirm(`Are you sure you want to restore household "${household.head_name}"?\n\nThis will move the household back to the active list and make it available for normal operations.`)) {
      try {
        await restoreHousehold(household.id)
        setToast({ show: true, message: `Household "${household.head_name}" restored successfully!`, variant: 'success' })
        await load()
        await refreshDashboard()
      } catch (error: any) {
        setToast({ show: true, message: error?.response?.data?.message || 'Failed to restore household.', variant: 'danger' })
      }
    }
  }

  const handleForceDeleteHousehold = async (household: Household) => {
    if (window.confirm(`⚠️ PERMANENT DELETE WARNING ⚠️\n\nAre you sure you want to PERMANENTLY DELETE household "${household.head_name}"?\n\nThis action cannot be undone and will:\n• Remove the household completely from the database\n• Delete all associated residents permanently\n• Remove all related data`)) {
      if (window.confirm(`FINAL CONFIRMATION\n\nYou are about to permanently delete household "${household.head_name}" and all its residents.\n\nType "DELETE" in the next prompt to confirm.`)) {
        const confirmation = prompt(`Type "DELETE" to permanently delete household "${household.head_name}":`)
        if (confirmation === 'DELETE') {
          try {
            await forceDeleteHousehold(household.id)
            setToast({ show: true, message: `Household "${household.head_name}" permanently deleted.`, variant: 'success' })
            await load()
            await refreshDashboard()
          } catch (error: any) {
            setToast({ show: true, message: error?.response?.data?.message || 'Failed to permanently delete household.', variant: 'danger' })
          }
        } else {
          setToast({ show: true, message: 'Permanent delete cancelled - confirmation text did not match.', variant: 'warning' })
        }
      }
    }
  }

  return (
    <Card className="shadow rounded-3 p-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            {showArchiveView ? (
              <span className="d-flex align-items-center gap-2">
                <FaArchive className="text-warning" />
                Household Archive
                <Badge bg="warning" className="text-dark">Archived Records</Badge>
              </span>
            ) : (
              'Households'
            )}
          </h2>
          <p className="text-muted mb-0">
            {showArchiveView ? 'Manage archived households - these records have been soft deleted' : 'Manage household records'}
          </p>
        </div>
        <div className="d-flex gap-2">
          {role === 'admin' && (
            <Button
              variant={showArchiveView ? 'outline-secondary' : 'outline-warning'}
              onClick={handleToggleArchive}
            >
              <FaArchive className="me-2" />
              {showArchiveView ? 'Back to Active' : 'View Archive'}
            </Button>
          )}
        </div>
      </div>

      {/* Archive Warning Banner */}
      {showArchiveView && (
        <Alert variant="warning" className="mb-4">
          <FaArchive className="me-2" />
          <strong>Archive View:</strong> You are viewing soft-deleted households. These records have been removed from the active list but can be restored or permanently deleted.
          {items.length > 0 ? (
            <div className="mt-2">
              <small>
                <strong>Total Archived:</strong> {items.length} household{items.length !== 1 ? 's' : ''}
              </small>
            </div>
          ) : !loading && (
            <div className="mt-2">
              <small className="text-muted">
                <em>No archived records yet. Households that are deleted will appear here.</em>
              </small>
            </div>
          )}
        </Alert>
      )}

      <Row className="align-items-end g-3 mb-3">
        <Col md={4}>
          <Form.Group className="mb-0">
            <Form.Label>Search</Form.Label>
            <Form.Control placeholder="Address, head name, or contact" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Group>
        </Col>
        {role === 'admin' && !showArchiveView && (
          <Col md={4}>
            <Form.Group className="mb-0">
              <Form.Label>Purok</Form.Label>
              <Form.Select value={purokId} onChange={(e) => setPurokId(e.target.value)}>
                <option value="">All Puroks</option>
                {puroks.map((purok) => (
                  <option key={purok.id} value={purok.id}>
                    {purok.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        )}
        <Col className="text-end">
          {canManage && !showArchiveView && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <FaPlus className="me-1" />
              Add Household
            </Button>
          )}
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover responsive>
          <thead className={showArchiveView ? 'table-warning' : ''}>
            <tr>
              <th>Head of Household</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Total Residents</th>
              {showArchiveView && <th>Date Deleted</th>}
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((hh) => (
              <tr key={hh.id} className={showArchiveView ? 'table-warning' : ''}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {hh.head_name}
                    {showArchiveView && (
                      <Badge bg="warning" className="text-dark">
                        <FaArchive className="me-1" size={10} />
                        Archived
                      </Badge>
                    )}
                  </div>
                </td>
                <td>
                  <div>
                    {hh.address}
                    {hh.purok && (
                      <small className="text-muted d-block">
                        Purok: {hh.purok.name}
                      </small>
                    )}
                  </div>
                </td>
                <td>{hh.contact || '-'}</td>
                <td>
                  <Badge bg={hh.residents_count > 0 ? 'primary' : 'secondary'}>
                    {hh.residents_count} {hh.residents_count === 1 ? 'Resident' : 'Residents'}
                  </Badge>
                </td>
                {showArchiveView && (
                  <td>
                    <small className="text-muted">
                      {hh.deleted_at ? new Date(hh.deleted_at).toLocaleDateString() : '-'}
                    </small>
                  </td>
                )}
                <td>
                  <div className="d-flex gap-2">
                    {showArchiveView ? (
                      <>
                        <Button 
                          size="sm" 
                          variant="success" 
                          onClick={() => handleRestoreHousehold(hh)}
                        >
                          <FaUndo className="me-1" />
                          Restore
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => handleForceDeleteHousehold(hh)}
                        >
                          <FaTrash className="me-1" />
                          Delete Permanent
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="info" 
                          onClick={() => handleViewResidents(hh)}
                        >
                          <FaUsers className="me-1" />
                          View Residents
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => navigate(`/households/${hh.id}`)}>
                          View
                        </Button>
                        {canManage && (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => {
                                setEditingId(hh.id)
                                setShowForm(true)
                              }}
                            >
                              <FaEdit className="me-1" />
                              Edit
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => setShowDelete(hh.id)}>
                              <FaTrash className="me-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={showArchiveView ? 6 : 5} className="text-center py-4">
                  {loading ? 'Loading...' : (
                    showArchiveView ? 'No archived households found.' : 'No households found.'
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="d-flex justify-content-end">
          <Pagination>
            <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
            <Pagination.Item active>{page}</Pagination.Item>
            <Pagination.Next disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} />
          </Pagination>
        </div>
      )}

      <ConfirmModal
        show={showDelete != null}
        title="Delete Household"
        body="Are you sure you want to delete this household?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onHide={() => setShowDelete(null)}
      />

      <HouseholdFormModal
        show={showForm}
        initial={(() => {
          if (!editingId) return undefined
          const hh = items.find((i) => i.id === editingId)
          if (!hh) return undefined
          return {
            address: hh.address,
            property_type: hh.property_type || '',
            head_name: hh.head_name,
            contact: hh.contact || '',
            purok_id: hh.purok_id ? String(hh.purok_id) : '',
          }
        })()}
        onSubmit={async (values) => {
          try {
            // Handle optional purok_id for purok leaders
            const payload = {
              address: values.address,
              property_type: values.property_type,
              head_name: values.head_name,
              contact: values.contact,
              purok_id: values.purok_id || '', // Convert undefined to empty string
            }

            if (editingId) {
              await updateHousehold(editingId, payload)
              setToast({ show: true, message: 'Household updated', variant: 'success' })
            } else {
              await createHousehold(payload)
              setToast({ show: true, message: 'Household created', variant: 'success' })
            }
            setShowForm(false)
            setEditingId(null)
            await load()
            // Refresh dashboard data to update counts
            await refreshDashboard()
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Save failed', variant: 'danger' })
          }
        }}
        onHide={() => {
          setShowForm(false)
          setEditingId(null)
        }}
      />

      {showViewResidents && (
        <ViewResidentsModal
          show={showViewResidents !== null}
          household={showViewResidents}
          onHide={() => {
            setShowViewResidents(null)
            // Refresh the household list to update resident counts
            load()
          }}
        />
      )}

      {/* Password Verification Modal */}
      <Modal show={showPasswordModal} onHide={() => {}} backdrop="static" keyboard={false} centered>
        <Modal.Header className="bg-warning text-dark">
          <Modal.Title>
            <FaArchive className="me-2" />
            Archive Access Required
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="d-flex align-items-center">
            <FaArchive size={20} className="me-2" />
            <div>
              <strong>Security Notice:</strong> Access to the Household Archive requires password verification.
            </div>
          </Alert>
          
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Enter your account password to continue:</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={passwordLoading}
              />
              {passwordError && (
                <Form.Text className="text-danger">{passwordError}</Form.Text>
              )}
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="warning" 
                type="submit" 
                disabled={passwordLoading || !password}
              >
                {passwordLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  )
}


