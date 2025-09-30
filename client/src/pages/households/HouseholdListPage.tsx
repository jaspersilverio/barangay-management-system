import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Toast, ToastContainer, Badge } from 'react-bootstrap'
import { listHouseholds, deleteHousehold, createHousehold, updateHousehold, type Household } from '../../services/households.service'
import ConfirmModal from '../../components/modals/ConfirmModal'
import HouseholdFormModal from '../../components/households/HouseholdFormModal'
import ViewResidentsModal from '../../components/households/ViewResidentsModal'
import { useNavigate } from 'react-router-dom'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'

const HouseholdListPage = React.memo(() => {
  const navigate = useNavigate()
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const { refreshData: refreshDashboard } = useDashboard()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [search, setSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewResidents, setShowViewResidents] = useState<null | Household>(null)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' | 'warning' }>({ show: false, message: '', variant: 'success' })

  // Manual state management
  const [householdsData, setHouseholdsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const canManage = role === 'admin' || role === 'purok_leader'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  // Manual data fetching
  const loadHouseholds = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listHouseholds({ search, page, purok_id: effectivePurokId || undefined })
      setHouseholdsData(data)
    } catch (err) {
      console.error('Failed to load households:', err)
    } finally {
      setIsLoading(false)
    }
  }, [search, page, effectivePurokId])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadHouseholds()
  }, [loadHouseholds])

  const items = useMemo(() => {
    if (!householdsData?.data?.data) return []
    return (householdsData as any).data.data
  }, [householdsData])

  const totalPages = useMemo(() => {
    return (householdsData as any)?.data?.last_page ?? 1
  }, [householdsData])

  const handleDelete = useCallback(async () => {
    if (showDelete == null) return
    try {
      await deleteHousehold(showDelete)
      await refreshDashboard()
      setToast({ show: true, message: 'Household deleted', variant: 'success' })
      setShowDelete(null)
      // Reload data after successful deletion
      loadHouseholds()
    } catch (e: any) {
      setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
      setShowDelete(null)
    }
  }, [showDelete, refreshDashboard, loadHouseholds])

  const handleViewResidents = useCallback((household: Household) => {
    setShowViewResidents(household)
  }, [])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }, [])

  const handlePurokChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPurokId(e.target.value)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((pageNumber: number) => {
    setPage(pageNumber)
  }, [])

  const handleShowForm = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleHideForm = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
  }, [])

  const handleEdit = useCallback((id: number) => {
    setEditingId(id)
    setShowForm(true)
  }, [])

  const handleShowDelete = useCallback((id: number) => {
    setShowDelete(id)
  }, [])

  const handleHideDelete = useCallback(() => {
    setShowDelete(null)
  }, [])

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0">Households</h2>
          <p className="text-muted mb-0">Manage household information and records</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleShowForm} 
              disabled={isLoading}
              className="btn-primary-custom btn-action-add"
            >
              <i className="fas fa-plus me-2"></i>
              Add Household
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <Card.Body className="p-3">
          <Row className="align-items-end g-3">
            <Col md={4}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Search</Form.Label>
                <Form.Control 
                  placeholder="Address, head name, or contact" 
                  value={search} 
                  onChange={handleSearchChange}
                  disabled={isLoading}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>
            {role === 'admin' && (
              <Col md={4}>
                <Form.Group className="mb-0">
                  <Form.Label className="form-label-custom">Purok</Form.Label>
                  <Form.Select 
                    value={purokId} 
                    onChange={handlePurokChange}
                    disabled={isLoading}
                    className="form-select-custom"
                  >
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
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card className="data-table-card">
        <Card.Body className="p-0">

          <div className="table-responsive">
            <Table className="data-table" striped hover>
              <thead className="table-header">
                <tr>
                  <th>Head of Household</th>
                  <th>Address</th>
                  <th>Contact</th>
                  <th>Total Residents</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
          <tbody>
            {isLoading ? (
              <>
                {[...Array(5)].map((_, index) => (
                  <tr key={index} className="table-row">
                    <td>
                      <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '200px', height: '16px' }}></div>
                      <div className="skeleton-line" style={{ width: '120px', height: '12px', marginTop: '4px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <div className="skeleton-button" style={{ width: '60px', height: '28px', marginRight: '5px' }}></div>
                        <div className="skeleton-button" style={{ width: '70px', height: '28px', marginRight: '5px' }}></div>
                        <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                        <div className="skeleton-button" style={{ width: '50px', height: '28px' }}></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5">
                  <div className="empty-state">
                    <i className="fas fa-home text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <p className="text-muted mb-0">No households found</p>
                    <small className="text-muted">Try adjusting your search criteria</small>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((hh: any) => (
              <tr key={hh.id}>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    {hh.head_name}
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
                <td>
                  <div className="action-buttons">
                    <Button 
                      size="sm" 
                      onClick={() => navigate(`/households/${hh.id}`)}
                      className="btn-action btn-action-view"
                    >
                      <i className="fas fa-eye"></i>
                      View
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleViewResidents(hh)}
                      className="btn-action btn-action-add"
                    >
                      <i className="fas fa-users"></i>
                      Residents
                    </Button>
                    {canManage && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleEdit(hh.id)}
                          className="btn-action btn-action-edit"
                        >
                          <i className="fas fa-edit"></i>
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={() => handleShowDelete(hh.id)}
                          className="btn-action btn-action-delete"
                        >
                          <i className="fas fa-trash"></i>
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
            )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="pagination-card">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="pagination-info">
                <span className="text-muted">
                  Showing page {page} of {totalPages}
                </span>
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev 
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className="pagination-btn"
                />
                <Pagination.Item active className="pagination-item">{page}</Pagination.Item>
                <Pagination.Next 
                  disabled={page >= totalPages || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  className="pagination-btn"
                />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      )}

      <ConfirmModal
        show={showDelete != null}
        title="Delete Household"
        body="Are you sure you want to delete this household?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onHide={handleHideDelete}
      />

      <HouseholdFormModal
        show={showForm}
        initial={(() => {
          if (!editingId) return undefined
          const hh = items.find((i: any) => i.id === editingId)
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
            // Reload data after successful save
            loadHouseholds()
            // Refresh dashboard data to update counts
            await refreshDashboard()
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Save failed', variant: 'danger' })
          }
        }}
        onHide={handleHideForm}
      />

      {showViewResidents && (
        <ViewResidentsModal
          show={showViewResidents !== null}
          household={showViewResidents}
          onHide={() => {
            setShowViewResidents(null)
            // Refresh the household list to update resident counts
            loadHouseholds()
          }}
        />
      )}

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
})

HouseholdListPage.displayName = 'HouseholdListPage'

export default HouseholdListPage