import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Toast, ToastContainer, Badge } from 'react-bootstrap'
import { listHouseholds, deleteHousehold, getHouseholdsListCached, setHouseholdsListCached, clearHouseholdsListCache } from '../../services/households.service'
import ConfirmModal from '../../components/modals/ConfirmModal'
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

  // Separate input value from search query for smooth typing
  const [inputValue, setInputValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' | 'warning' }>({ show: false, message: '', variant: 'success' })

  // Manual state management
  const [householdsData, setHouseholdsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Ref to maintain input focus and manage debounce timer
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<number | null>(null)

  const canManage = role === 'admin' || role === 'purok_leader' || role === 'staff'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin' || role === 'staff') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    // Clear any pending debounce when input changes
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current)
    }

    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(inputValue)
      // Reset to first page when search changes
      setPage(1)
    }, 300)

    debounceTimeoutRef.current = timeoutId

    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [inputValue])

  // Manual data fetching - depends on debouncedSearch, not inputValue
  const loadHouseholds = useCallback(
    async (overrideSearch?: string, overridePage?: number, showLoading = true, cacheKey?: string) => {
      if (showLoading) setIsLoading(true)
      const key = cacheKey ?? `households:${overrideSearch !== undefined ? overrideSearch : debouncedSearch}:${overridePage !== undefined ? overridePage : page}:${effectivePurokId}`
      try {
        const data = await listHouseholds({
          search: overrideSearch !== undefined ? overrideSearch : debouncedSearch,
          page: overridePage !== undefined ? overridePage : page,
          purok_id: effectivePurokId || undefined,
          per_page: 15,
        })
        setHouseholdsData(data)
        setHouseholdsListCached(key, data)
      } catch (err) {
        console.error('Failed to load households:', err)
      } finally {
        if (showLoading) setIsLoading(false)
      }
    },
    [debouncedSearch, page, effectivePurokId]
  )

  // Load data on mount and when dependencies change
  useEffect(() => {
    const key = `households:${debouncedSearch}:${page}:${effectivePurokId}`
    const cached = getHouseholdsListCached(key)
    if (cached != null) {
      setHouseholdsData(cached)
      setIsLoading(false)
      // Refetch in background to keep data fresh
      loadHouseholds(undefined, undefined, false, key).catch(() => {})
      return
    }
    loadHouseholds(undefined, undefined, true, key)
  }, [loadHouseholds, debouncedSearch, page, effectivePurokId])

  // When households page is visited, refresh dashboard so cards stay in sync
  useEffect(() => {
    refreshDashboard().catch(() => {})
  }, [])

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


  const handleDelete = useCallback(async () => {
    if (showDelete == null) return
    const deletedId = showDelete
    const previousData = householdsData
    
    try {
      // Optimistically remove the item from the list immediately
      setHouseholdsData((prev: any) => {
        if (!prev?.data?.data) return prev
        return {
          ...prev,
          data: {
            ...prev.data,
            data: prev.data.data.filter((h: any) => h.id !== deletedId),
            total: Math.max(0, prev.data.total - 1)
          }
        }
      })
      setShowDelete(null)
      
      // Clear list cache so reload gets fresh data
      clearHouseholdsListCache()
      
      // Delete from backend
      const deleteResponse = await deleteHousehold(deletedId)
      
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.message || 'Delete failed')
      }
      
      // Small delay to ensure backend has processed the deletion before refreshing dashboard
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Refresh dashboard to update counts - ensure it completes before showing success
      await refreshDashboard()
      setToast({ show: true, message: 'Household deleted', variant: 'success' })
      
      // Only reload if we need to fix pagination (e.g. deleted last item on page)
      // Otherwise, optimistic update is sufficient - reloading too fast can restore deleted items
      const remainingOnPage = householdsData?.data?.data?.length ? householdsData.data.data.length - 1 : 0
      if (remainingOnPage === 0 && page > 1) {
        // Deleted last item on page, go to previous page
        setPage(page - 1)
      }
    } catch (e: any) {
      // If delete fails, restore previous data
      setHouseholdsData(previousData)
      setToast({ show: true, message: e?.response?.data?.message || e?.message || 'Delete failed', variant: 'danger' })
    }
  }, [showDelete, refreshDashboard, loadHouseholds, householdsData])

  // Handle search input change - only updates input value, not search query
  // Search query is updated via debounce effect above
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Page reset is handled in debounce effect
  }, [])

  // Manual search trigger for Enter key or Search button
  const handleSearchSubmit = useCallback(() => {
    // Cancel any pending debounced search to avoid duplicate requests
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    const searchTerm = inputValue
    setDebouncedSearch(searchTerm)
    setPage(1)
    // Trigger an immediate search using the latest input value
    loadHouseholds(searchTerm, 1)

    // Ensure the input keeps focus after triggering search
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [inputValue, loadHouseholds])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearchSubmit()
      }
    },
    [handleSearchSubmit]
  )

  const handlePurokChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPurokId(e.target.value)
    setPage(1)
  }, [])

  const handlePageChange = useCallback((pageNumber: number) => {
    setPage(pageNumber)
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
                  onKeyDown={handleSearchKeyDown}
                  className="form-control-custom"
                  autoComplete="off"
                />
              </Form.Group>
            </Col>
            <Col md="auto">
              <Button
                variant="outline-primary"
                className="btn-outline-brand"
                onClick={handleSearchSubmit}
              >
                <i className="fas fa-search me-2" />
                Search
              </Button>
            </Col>
            {(role === 'admin' || role === 'staff') && (
              <Col md={4}>
                <Form.Group className="mb-0">
                  <Form.Label className="form-label-custom">Purok</Form.Label>
                  <Form.Select 
                    value={purokId} 
                    onChange={handlePurokChange}
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
              Showing {items.length} of {totalRecords} households
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
                    {canManage && (
                      <Button
                        size="sm"
                        onClick={() => handleShowDelete(hh.id)}
                        className="btn-action btn-action-delete"
                      >
                        <i className="fas fa-trash"></i>
                        Delete
                      </Button>
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
                  disabled={page <= 1}
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
                  disabled={page >= totalPages}
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