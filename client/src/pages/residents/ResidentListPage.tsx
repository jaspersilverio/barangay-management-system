import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast } from 'react-bootstrap'
import { listResidents, deleteResident, createResident, updateResident } from '../../services/residents.service'
import ResidentFormModal from '../../components/residents/ResidentFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

const ResidentListPage = React.memo(() => {
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

  // Ref to maintain input focus
  const searchInputRef = useRef<HTMLInputElement>(null)

  const canManage = role === 'admin' || role === 'purok_leader' || role === 'staff'

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

  const items = useMemo(() => {
    if (!residentsData?.data?.data) return []
    // Sort alphabetically by first name, then last name
    return [...residentsData.data.data].sort((a: any, b: any) => {
      const aFirstName = (a.first_name || '').toLowerCase()
      const bFirstName = (b.first_name || '').toLowerCase()
      const aLastName = (a.last_name || '').toLowerCase()
      const bLastName = (b.last_name || '').toLowerCase()
      
      // First compare by first name
      if (aFirstName !== bFirstName) {
        return aFirstName.localeCompare(bFirstName)
      }
      // If first names are equal, compare by last name
      return aLastName.localeCompare(bLastName)
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
                  placeholder="Name, relationship, or occupation"
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

      {/* Data Table */}
      <Card className="data-table-card">
        <Card.Body className="p-0">

          <div className="table-responsive">
            <Table className="data-table" striped hover>
              <thead className="table-header">
                <tr>
                  <th>Name</th>
                  <th>Purok</th>
                  <th>Household</th>
                  <th>Sex</th>
                  <th>Civil Status</th>
                  <th>Age</th>
                  <th>Relationship</th>
                  <th>Occupation</th>
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
                          <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '60px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '70px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '40px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '90px', height: '16px' }}></div>
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
                    <td colSpan={9} className="text-center py-5">
                      <div className="empty-state">
                        <i className="fas fa-users text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0">No residents found</p>
                        <small className="text-muted">Try adjusting your search criteria</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((resident: any) => (
                    <tr 
                      key={resident.id}
                      data-resident-id={resident.id}
                      className={`table-row ${newlyAddedResidentId === resident.id ? 'newly-added-highlight' : ''}`}
                    >
                      <td className="fw-medium">{`${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim()}</td>
                      <td><span className="badge bg-info rounded-pill">{resident.household?.purok?.name || '-'}</span></td>
                      <td>{resident.household?.head_name || '-'}</td>
                      <td><span className="text-capitalize">{resident.sex}</span></td>
                      <td><span className="text-capitalize">{resident.civil_status || '-'}</span></td>
                      <td>{resident.age || '-'}</td>
                      <td><span className="text-capitalize">{resident.relationship_to_head}</span></td>
                      <td><span className="text-capitalize">{resident.occupation_status}</span></td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/residents/${resident.id}`}
                            className="btn-action btn-action-view"
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
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleShowDelete(resident.id)}
                                disabled={isLoading}
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
            sex: r.sex,
            birthdate: r.birthdate,
            civil_status: r.civil_status || 'single',
            relationship_to_head: r.relationship_to_head,
            occupation_status: r.occupation_status,
            is_pwd: !!r.is_pwd,
          }
        })()}
        onSubmit={async (values) => {
          try {
            // Handle optional purok_id for purok leaders
            const payload = {
              household_id: Number(values.household_id),
              first_name: values.first_name,
              middle_name: values.middle_name || undefined,
              last_name: values.last_name,
              sex: values.sex,
              birthdate: values.birthdate,
              civil_status: values.civil_status,
              relationship_to_head: values.relationship_to_head,
              occupation_status: values.occupation_status,
              is_pwd: !!values.is_pwd,
              // purok_id is handled by backend based on household
            }

            if (editingId) {
              await updateResident(editingId, payload)
              setToast({ show: true, message: 'Resident updated', variant: 'success' })
              setShowForm(false)
              setEditingId(null)
              // Reload data after successful update
              loadResidents()
            } else {
              // Create new resident
              const response = await createResident(payload)
              if (response.success && response.data?.id) {
                const newResidentId = response.data.id
                setToast({ show: true, message: 'Resident created', variant: 'success' })
                setShowForm(false)
                setEditingId(null)
                
                // Clear search and reset to page 1 to ensure new resident is visible
                setInputValue('')
                setDebouncedSearch('')
                setPage(1)
                
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
