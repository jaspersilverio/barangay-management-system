import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast, Badge } from 'react-bootstrap'
import { listResidents, deleteResident, createResident, updateResident } from '../../services/residents.service'
import { createHousehold } from '../../services/households.service'
import ResidentFormModal from '../../components/residents/ResidentFormModal'
import type { ResidentFormValues } from '../../components/residents/ResidentFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ResidentListPage = React.memo(() => {
  const navigate = useNavigate()
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  // Separate input value from search query for smooth typing
  const [inputValue, setInputValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' })
  const [showForm, setShowForm] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [editingId, setEditingId] = useState<null | number>(null)

  // Manual state management
  const [residentsData, setResidentsData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true) // Start with true for immediate skeleton display
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<any>(null)

  // Track newly added resident for highlighting
  const [newlyAddedResidentId, setNewlyAddedResidentId] = useState<number | null>(null)

  // Ref to maintain input focus and manage debounce timer
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<number | null>(null)

  const canManage = role === 'admin' || role === 'purok_leader' || role === 'staff'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
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
  const loadResidents = useCallback(async (overrideSearch?: string, overridePage?: number) => {
    setIsLoading(true)
    setIsError(false)
    setError(null)
    try {
      const data = await listResidents({
        search: overrideSearch !== undefined ? overrideSearch : debouncedSearch,
        page: overridePage !== undefined ? overridePage : page,
        purok_id: effectivePurokId || undefined
      })
      // Set data immediately - no delays
      setResidentsData(data)
    } catch (err) {
      setIsError(true)
      setError(err)
    } finally {
      // Clear loading state immediately when data is ready
      setIsLoading(false)
    }
  }, [debouncedSearch, page, effectivePurokId])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadResidents()
  }, [loadResidents])

  // Auto-remove highlight after 5 seconds and scroll to highlighted row
  useEffect(() => {
    if (newlyAddedResidentId !== null) {
      // Scroll to the highlighted row after a short delay to ensure DOM is updated
      setTimeout(() => {
        const rowElement = document.querySelector(`tr[data-resident-id="${newlyAddedResidentId}"]`)
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 150)

      // Remove highlight after 5 seconds
      const timeoutId = setTimeout(() => {
        setNewlyAddedResidentId(null)
      }, 5000) // 5 seconds

      return () => clearTimeout(timeoutId)
    }
  }, [newlyAddedResidentId])

  // Format full name as "Last, First Middle Suffix"
  const formatFullName = useCallback((resident: any) => {
    const lastName = resident.last_name || ''
    const firstName = resident.first_name || ''
    const middleName = resident.middle_name || ''
    const suffix = resident.suffix || ''

    let name = lastName
    if (firstName || middleName || suffix) {
      name += ','
      if (firstName) name += ' ' + firstName
      if (middleName) name += ' ' + middleName
      if (suffix) name += ' ' + suffix
    }
    return name.trim() || 'N/A'
  }, [])

  // Get household role
  const getHouseholdRole = useCallback((resident: any) => {
    if (resident.is_head_of_household) return 'Head'
    if (resident.household_id) return 'Member'
    return 'Unassigned'
  }, [])

  const items = useMemo(() => {
    if (!residentsData?.data?.data) return []
    // Backend already sorts by last name, then first name, so we can use the data as-is
    // But we'll ensure consistency by sorting client-side if needed
    return [...residentsData.data.data].sort((a: any, b: any) => {
      const aLastName = (a.last_name || '').toLowerCase()
      const bLastName = (b.last_name || '').toLowerCase()
      const aFirstName = (a.first_name || '').toLowerCase()
      const bFirstName = (b.first_name || '').toLowerCase()

      // Primary sort by last name
      if (aLastName !== bLastName) {
        return aLastName.localeCompare(bLastName)
      }
      // Secondary sort by first name if last names are equal
      return aFirstName.localeCompare(bFirstName)
    })
  }, [residentsData])

  const totalPages = useMemo(() => {
    return residentsData?.data?.last_page ?? 1
  }, [residentsData])

  const handleDelete = useCallback(async () => {
    if (showDelete == null) return
    try {
      await deleteResident(showDelete)
      setToast({ show: true, message: 'Resident deleted', variant: 'success' })
      setShowDelete(null)
      // Reload data after successful deletion
      loadResidents()
    } catch (e: any) {
      setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
      setShowDelete(null)
    }
  }, [showDelete, loadResidents])

  // Handle search input change - only updates input value, not search query
  // Search query is updated via debounce effect above
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    // Page reset is handled in debounce effect
  }, [])

  const handlePurokChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPurokId(e.target.value)
    setPage(1) // Reset to first page when changing purok
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
    loadResidents(searchTerm, 1)

    // Ensure the input keeps focus after triggering search
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [inputValue, loadResidents])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearchSubmit()
      }
    },
    [handleSearchSubmit]
  )

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

  if (isError) {
    return (
      <Card className="shadow rounded-3 p-4">
        <Card.Body className="text-center">
          <p className="text-danger">Failed to load residents: {error?.message}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Residents</h2>
          <p className="text-brand-muted mb-0">Manage resident information and records</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleShowForm}
              disabled={isLoading}
              className="btn-brand-primary"
            >
              <i className="fas fa-plus me-2"></i>
              Add Resident
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
                  ref={searchInputRef}
                  placeholder="Search by name, purok, household/head name, or occupation"
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
                disabled={isLoading}
              >
                <i className="fas fa-search me-2" />
                Search
              </Button>
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
            <h5 className="mb-0 text-brand-primary">Resident Registry</h5>
            <span className="text-brand-muted">
              {!isLoading && residentsData?.data ? (
                <>
                  Showing {((page - 1) * (residentsData.data.per_page || 15)) + 1} to {Math.min(page * (residentsData.data.per_page || 15), residentsData.data.total || 0)} of {residentsData.data.total || 0} residents
                </>
              ) : (
                'Loading...'
              )}
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
                  <th style={{ width: '60px' }}>Photo</th>
                  <th>Full Name</th>
                  <th style={{ width: '70px' }}>Sex</th>
                  <th style={{ width: '60px' }}>Age</th>
                  <th style={{ width: '110px' }}>Civil Status</th>
                  <th style={{ width: '120px' }}>Purok</th>
                  <th style={{ width: '120px' }}>Household Role</th>
                  <th style={{ width: '180px' }}>Household / Head</th>
                  <th style={{ width: '130px' }}>Occupation</th>
                  <th style={{ width: '180px' }}>Classifications</th>
                  <th style={{ width: '100px' }}>Status</th>
                  <th className="actions-column" style={{ width: '180px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td>
                          <div className="skeleton-line" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '180px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '50px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '40px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <div className="skeleton-badge" style={{ width: '60px', height: '20px' }}></div>
                            <div className="skeleton-badge" style={{ width: '50px', height: '20px' }}></div>
                          </div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <div className="skeleton-button" style={{ width: '60px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px' }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="text-center py-5">
                      <div className="empty-state">
                        <i className="fas fa-users text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0">No residents found</p>
                        <small className="text-muted">Try adjusting your search criteria</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((resident: any) => {
                    const isInactive = resident.resident_status === 'deceased' || resident.resident_status === 'transferred' || resident.resident_status === 'inactive'
                    const householdRole = getHouseholdRole(resident)
                    const fullName = formatFullName(resident)

                    return (
                      <tr
                        key={resident.id}
                        data-resident-id={resident.id}
                        className={`table-row ${newlyAddedResidentId === resident.id ? 'newly-added-highlight' : ''} ${isInactive ? 'text-muted' : ''}`}
                        style={isInactive ? { opacity: 0.7, fontStyle: 'italic' } : {}}
                      >
                        {/* Photo */}
                        <td>
                          <div style={{ position: 'relative', width: '40px', height: '40px' }}>
                            {resident.photo_url ? (
                              <>
                                <img
                                  src={resident.photo_url}
                                  alt={fullName}
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #dee2e6',
                                    display: 'block'
                                  }}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    const placeholder = target.parentElement?.querySelector('.photo-placeholder') as HTMLElement
                                    if (placeholder) placeholder.style.display = 'flex'
                                  }}
                                />
                                <div
                                  className="photo-placeholder"
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: '#e9ecef',
                                    display: 'none',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '16px',
                                    color: '#6c757d',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                  }}
                                >
                                  <i className="fas fa-user"></i>
                                </div>
                              </>
                            ) : (
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  backgroundColor: '#e9ecef',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '16px',
                                  color: '#6c757d'
                                }}
                              >
                                <i className="fas fa-user"></i>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Full Name (Last, First Middle Suffix) */}
                        <td className="fw-medium">
                          <div className="d-flex align-items-center gap-2">
                            <span>{fullName}</span>
                            {resident.is_head_of_household && (
                              <Badge bg="primary" className="rounded-pill" style={{ fontSize: '0.7rem' }}>
                                Head
                              </Badge>
                            )}
                          </div>
                        </td>

                        {/* Sex */}
                        <td>
                          <span className="text-capitalize">{resident.sex === 'male' ? 'M' : resident.sex === 'female' ? 'F' : 'O'}</span>
                        </td>

                        {/* Age */}
                        <td>{resident.age !== null && resident.age !== undefined ? `${resident.age}` : '-'}</td>

                        {/* Civil Status */}
                        <td>
                          <span className="text-capitalize small">
                            {resident.civil_status || '-'}
                          </span>
                        </td>

                        {/* Purok */}
                        <td>
                          {resident.household?.purok?.name ? (
                            <Badge bg="info" className="rounded-pill">
                              {resident.household.purok.name}
                            </Badge>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* Household Role */}
                        <td>
                          {householdRole === 'Head' && (
                            <Badge bg="success" className="rounded-pill">Head</Badge>
                          )}
                          {householdRole === 'Member' && (
                            <Badge bg="secondary" className="rounded-pill">Member</Badge>
                          )}
                          {householdRole === 'Unassigned' && (
                            <Badge bg="warning" text="dark" className="rounded-pill">Unassigned</Badge>
                          )}
                        </td>

                        {/* Household / Head Name */}
                        <td>
                          {resident.household ? (
                            <div>
                              <div className="fw-semibold small">
                                {resident.is_head_of_household ? 'Self (Head)' : resident.household.head_name || 'N/A'}
                              </div>
                              <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                                {resident.household.address || ''}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted">-</span>
                          )}
                        </td>

                        {/* Occupation */}
                        <td>
                          <span className="text-capitalize small">
                            {resident.occupation_status || '-'}
                          </span>
                        </td>

                        {/* Classifications */}
                        <td>
                          <div className="d-flex flex-wrap gap-1">
                            {resident.is_senior && (
                              <Badge bg="warning" text="dark" className="rounded-pill" style={{ fontSize: '0.75rem' }}>
                                Senior
                              </Badge>
                            )}
                            {resident.is_pwd && (
                              <Badge bg="danger" className="rounded-pill" style={{ fontSize: '0.75rem' }}>
                                PWD
                              </Badge>
                            )}
                            {resident.is_solo_parent && (
                              <Badge bg="info" className="rounded-pill" style={{ fontSize: '0.75rem' }}>
                                Solo Parent
                              </Badge>
                            )}
                            {!resident.is_senior && !resident.is_pwd && !resident.is_solo_parent && (
                              <span className="text-muted small">-</span>
                            )}
                          </div>
                        </td>

                        {/* Resident Status */}
                        <td>
                          {resident.resident_status === 'active' && (
                            <Badge bg="success" className="rounded-pill">Active</Badge>
                          )}
                          {resident.resident_status === 'deceased' && (
                            <Badge bg="dark" className="rounded-pill">Deceased</Badge>
                          )}
                          {resident.resident_status === 'transferred' && (
                            <Badge bg="warning" text="dark" className="rounded-pill">Transferred</Badge>
                          )}
                          {resident.resident_status === 'inactive' && (
                            <Badge bg="secondary" className="rounded-pill">Inactive</Badge>
                          )}
                          {!resident.resident_status && (
                            <Badge bg="success" className="rounded-pill">Active</Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="action-buttons">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/residents/${resident.id}`)}
                              className="btn-action btn-action-view"
                              title="View Profile"
                            >
                              <i className="fas fa-eye"></i>
                              View
                            </Button>
                            {canManage && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleEdit(resident.id)}
                                  className="btn-action btn-action-edit"
                                  title="Edit Resident"
                                >
                                  <i className="fas fa-edit"></i>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleShowDelete(resident.id)}
                                  disabled={isLoading}
                                  className="btn-action btn-action-delete"
                                  title="Delete Resident"
                                >
                                  <i className="fas fa-trash"></i>
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
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
                  Page {page} of {totalPages} • {residentsData?.data?.total ?? 0} total residents
                </span>
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className="pagination-btn"
                />
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
        title="Delete Resident"
        body="Are you sure you want to delete this resident?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onHide={handleHideDelete}
      />

      <ResidentFormModal
        show={showForm}
        initial={(() => {
          if (!editingId) return undefined
          const r = items.find((i: any) => i.id === editingId)
          if (!r) return undefined
          return {
            household_id: r.household_id,
            first_name: r.first_name,
            middle_name: r.middle_name || '',
            last_name: r.last_name,
            suffix: r.suffix || null,
            sex: r.sex,
            birthdate: r.birthdate,
            place_of_birth: r.place_of_birth || null,
            nationality: r.nationality || null,
            religion: r.religion || null,
            contact_number: r.contact_number || null,
            email: r.email || null,
            valid_id_type: r.valid_id_type || null,
            valid_id_number: r.valid_id_number || null,
            civil_status: r.civil_status || 'single',
            relationship_to_head: r.relationship_to_head,
            occupation_status: r.occupation_status,
            employer_workplace: r.employer_workplace || null,
            educational_attainment: r.educational_attainment || null,
            is_pwd: !!r.is_pwd,
            is_pregnant: !!r.is_pregnant,
            resident_status: r.resident_status || 'active',
            remarks: r.remarks || null,
            photo_url: r.photo_url || null,
          }
        })()}
        onSubmit={async (values: ResidentFormValues & { photo?: File }) => {
          try {
            // Handle optional purok_id for purok leaders
            const payload: any = {
              household_id: values.household_id ? Number(values.household_id) : null,
              first_name: values.first_name,
              middle_name: values.middle_name ?? null,
              last_name: values.last_name,
              suffix: values.suffix ?? null,
              sex: values.sex,
              birthdate: values.birthdate,
              place_of_birth: values.place_of_birth ?? null,
              nationality: values.nationality ?? null,
              religion: values.religion ?? null,
              contact_number: values.contact_number ?? null,
              email: values.email ?? null,
              valid_id_type: values.valid_id_type ?? null,
              valid_id_number: values.valid_id_number ?? null,
              civil_status: values.civil_status,
              relationship_to_head: values.relationship_to_head ?? null,
              occupation_status: values.occupation_status,
              employer_workplace: values.employer_workplace ?? null,
              educational_attainment: values.educational_attainment ?? null,
              is_pwd: !!values.is_pwd,
              is_pregnant: !!values.is_pregnant,
              resident_status: values.resident_status || 'active',
              remarks: values.remarks ?? null,
              photo: values.photo ?? undefined,
              // purok_id is handled by backend based on household
            }

            if (editingId) {
              const response = await updateResident(editingId, payload)
              if (!response.success) {
                throw new Error(response.message || 'Update failed')
              }
              setToast({ show: true, message: 'Resident updated', variant: 'success' })
              setShowForm(false)
              setEditingId(null)
              // Reload data after successful update
              await loadResidents()
            } else {
              // Create new resident
              const response = await createResident(payload)
              if (response.success && response.data?.id) {
                const newResidentId = response.data.id

                // Step 2: If creating new household, create it with this resident as head
                if (values.assignment_mode === 'new_household') {
                  try {
                    const householdPayload = {
                      address: values.new_household_address!,
                      property_type: values.new_household_property_type || 'Residential',
                      head_resident_id: newResidentId,
                      contact: values.new_household_contact || '',
                      purok_id: typeof values.new_household_purok_id === 'string'
                        ? parseInt(values.new_household_purok_id)
                        : values.new_household_purok_id!,
                    }
                    const householdResponse = await createHousehold(householdPayload)

                    if (!householdResponse.success) {
                      throw new Error(householdResponse.message || 'Failed to create household')
                    }
                  } catch (householdError: any) {
                    // If household creation fails, show error but resident is already created
                    setToast({
                      show: true,
                      message: `Resident created but household creation failed: ${householdError?.response?.data?.message || householdError?.message || 'Unknown error'}`,
                      variant: 'danger'
                    })
                    // Still reload to show the resident (even if unassigned)
                    setShowForm(false)
                    setEditingId(null)
                    setInputValue('')
                    setDebouncedSearch('')
                    setPage(1)
                    await new Promise(resolve => setTimeout(resolve, 300))
                    await loadResidents('', 1)
                    return
                  }
                }

                setToast({ show: true, message: 'Resident created', variant: 'success' })
                setShowForm(false)
                setEditingId(null)

                // Clear search and reset to page 1 to ensure new resident is visible
                setInputValue('')
                setDebouncedSearch('')
                setPage(1)

                // Small delay to ensure backend has processed household creation/linking
                await new Promise(resolve => setTimeout(resolve, 300))

                // Reload data with empty search and page 1 to show the new resident
                await loadResidents('', 1)

                // Set highlight after DOM is updated
                setTimeout(() => {
                  setNewlyAddedResidentId(newResidentId)
                }, 200)
              } else {
                throw new Error('Failed to create resident')
              }
            }
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Save failed', variant: 'danger' })
          }
        }}
        onHide={handleHideForm}
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

ResidentListPage.displayName = 'ResidentListPage'

export default ResidentListPage
