import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Toast, ToastContainer, Badge } from 'react-bootstrap'
import { listHouseholds, deleteHousehold, createHousehold, updateHousehold, type Household } from '../../services/households.service'
import ConfirmModal from '../../components/modals/ConfirmModal'
import HouseholdFormModal from '../../components/households/HouseholdFormModal'
import ViewResidentsModal from '../../components/households/ViewResidentsModal'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import { useDashboard } from '../../context/DashboardContext'

const HouseholdListPage = React.memo(() => {
  const navigate = useNavigate()
  const location = useLocation()
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const { refreshData: refreshDashboard } = useDashboard()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  // Separate input value from search query for smooth typing
  const [inputValue, setInputValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [showForm, setShowForm] = useState(false)
  const [showViewResidents, setShowViewResidents] = useState<null | Household>(null)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' | 'warning' }>({ show: false, message: '', variant: 'success' })

  // Manual state management
  const [householdsData, setHouseholdsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with true for immediate skeleton display

  // Ref to maintain input focus
  const searchInputRef = useRef<HTMLInputElement>(null)

  const canManage = role === 'admin' || role === 'purok_leader'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(inputValue)
      // Reset to first page when search changes
      setPage(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [inputValue])

  // Manual data fetching - depends on debouncedSearch, not inputValue
  const loadHouseholds = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listHouseholds({ 
        search: debouncedSearch, 
        page, 
        purok_id: effectivePurokId || undefined,
        per_page: 15 
      })
      // Set data immediately - no delays
      setHouseholdsData(data)
    } catch (err) {
      console.error('Failed to load households:', err)
    } finally {
      // Clear loading state immediately when data is ready
      setIsLoading(false)
    }
  }, [debouncedSearch, page, effectivePurokId])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadHouseholds()
  }, [loadHouseholds])

  // Refresh data when navigating to this page (location change)
  useEffect(() => {
    // Refresh when the location pathname changes to this page
    if (location.pathname === '/households') {
      loadHouseholds()
    }
  }, [location.pathname, loadHouseholds])

  // Refresh data when page becomes visible (e.g., user navigates back to this page)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && location.pathname === '/households') {
        // Page became visible, refresh the data
        loadHouseholds()
      }
    }

    const handleFocus = () => {
      // Window gained focus, refresh the data if we're on this page
      if (location.pathname === '/households') {
        loadHouseholds()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadHouseholds, location.pathname])

  const items = useMemo(() => {
    if (!householdsData?.data?.data) return []
    // Sort alphabetically by head of household name (A-Z)
    return [...(householdsData as any).data.data].sort((a: any, b: any) => {
      const aHeadName = (a.head_name || '').toLowerCase()
      const bHeadName = (b.head_name || '').toLowerCase()
      return aHeadName.localeCompare(bHeadName)
    })
  }, [householdsData])

  const totalPages = useMemo(() => {
    return (householdsData as any)?.data?.last_page ?? 1
  }, [householdsData])

  const totalRecords = useMemo(() => {
    return (householdsData as any)?.data?.total ?? 0
  }, [householdsData])

  const currentPageData = useMemo(() => {
    return (householdsData as any)?.data?.data ?? []
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

  // Handle search input change - only updates input value, not search query
  // Search query is updated via debounce effect above
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Page reset is handled in debounce effect
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
          <h2 className="mb-0 text-brand-primary">Households</h2>
          <p className="text-brand-muted mb-0">Manage household information and records</p>
        </div>
        <div className="page-actions">
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
                  ref={searchInputRef}
                  placeholder="Address, head name, or contact" 
                  value={inputValue} 
                  onChange={handleSearchChange}
                  disabled={isLoading}
                  className="form-control-custom"
                  autoComplete="off"
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

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-brand-primary">Households</h5>
            <span className="text-brand-muted">
              Showing {currentPageData.length} of {totalRecords} households
            </span>
          </div>
        </Col>
      </Row>

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
                  <Badge bg={hh.residents_count > 0 ? 'primary' : 'secondary'} className="rounded-pill">
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
                <span className="text-brand-muted">
                  Page {page} of {totalPages} • {totalRecords} total households
                </span>
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev 
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className="pagination-btn"
                />
                {/* Show page numbers */}
                {(() => {
                  const pages = []
                  const maxVisiblePages = 5
                  let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2))
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                  
                  // Adjust start page if we're near the end
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                  }
                  
                  // Show first page and ellipsis if needed
                  if (startPage > 1) {
                    pages.push(
                      <Pagination.Item 
                        key={1} 
                        active={page === 1}
                        onClick={() => handlePageChange(1)}
                        className="pagination-item"
                      >
                        1
                      </Pagination.Item>
                    )
                    if (startPage > 2) {
                      pages.push(<Pagination.Ellipsis key="ellipsis-start" />)
                    }
                  }
                  
                  // Show visible page range
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Pagination.Item 
                        key={i} 
                        active={page === i}
                        onClick={() => handlePageChange(i)}
                        className="pagination-item"
                      >
                        {i}
                      </Pagination.Item>
                    )
                  }
                  
                  // Show ellipsis and last page if needed
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<Pagination.Ellipsis key="ellipsis-end" />)
                    }
                    pages.push(
                      <Pagination.Item 
                        key={totalPages} 
                        active={page === totalPages}
                        onClick={() => handlePageChange(totalPages)}
                        className="pagination-item"
                      >
                        {totalPages}
                      </Pagination.Item>
                    )
                  }
                  
                  return pages
                })()}
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
            head_resident_id: hh.head_resident_id || hh.head_resident?.id || '',
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
              head_resident_id: typeof values.head_resident_id === 'string' ? parseInt(values.head_resident_id) : values.head_resident_id,
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