import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Badge, ToastContainer, Toast } from 'react-bootstrap'
import { Plus } from 'lucide-react'
import {
  listFourPsBeneficiaries,
  createFourPsBeneficiary,
  updateFourPsBeneficiary,
  deleteFourPsBeneficiary,
  type FourPsBeneficiary,
  type FourPsPayload
} from '../../services/fourps.service'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import FourPsFormModal from '../../components/beneficiaries/FourPsFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import type { FourPsFormValues } from '../../components/beneficiaries/FourPsFormModal'

export default function FourPsBeneficiariesPage() {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  // Separate input value from search query for smooth typing
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true) // Start with true for immediate skeleton display
  const [beneficiariesData, setBeneficiariesData] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({
    show: false,
    message: '',
    variant: 'success'
  })

  // Ref to maintain input focus and manage debounce timer
  const searchInputRef = useRef<HTMLInputElement>(null)
  const debounceTimeoutRef = useRef<number | null>(null)

  const canManage = role === 'admin' || role === 'staff'
  const canDelete = role === 'admin' || role === 'captain'

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
      setDebouncedSearch(searchInput)
      setPage(1) // Reset to first page when search changes
    }, 300)

    debounceTimeoutRef.current = timeoutId

    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [searchInput])

  const loadBeneficiaries = useCallback(
    async (overrideSearch?: string, overridePage?: number) => {
      setIsLoading(true)
      try {
        const data = await listFourPsBeneficiaries({
          search: overrideSearch !== undefined ? overrideSearch : debouncedSearch,
          page: overridePage !== undefined ? overridePage : page,
          purok_id: effectivePurokId || undefined,
          status: statusFilter || undefined,
          per_page: 15
        })
        // Set data immediately - no delays
        setBeneficiariesData(data)
      } catch (err) {
        console.error('Error loading 4Ps beneficiaries:', err)
        setToast({ show: true, message: 'Failed to load 4Ps beneficiaries', variant: 'danger' })
      } finally {
        // Clear loading state immediately when data is ready
        setIsLoading(false)
      }
    },
    [debouncedSearch, page, effectivePurokId, statusFilter]
  )

  useEffect(() => {
    loadBeneficiaries()
  }, [loadBeneficiaries])

  const items = useMemo(() => {
    if (!beneficiariesData?.data?.data) return []
    return beneficiariesData.data.data
  }, [beneficiariesData])

  const totalPages = useMemo(() => {
    return beneficiariesData?.data?.last_page ?? 1
  }, [beneficiariesData])

  const total = useMemo(() => {
    return beneficiariesData?.data?.total ?? 0
  }, [beneficiariesData])

  const handleSubmit = useCallback(async (values: FourPsFormValues) => {
    try {
      const payload: FourPsPayload = {
        household_id: Number(values.household_id),
        four_ps_number: values.four_ps_number,
        status: values.status,
        date_registered: values.date_registered,
      }

      if (editingId) {
        await updateFourPsBeneficiary(editingId, payload)
        setToast({ show: true, message: '4Ps beneficiary updated successfully', variant: 'success' })
      } else {
        await createFourPsBeneficiary(payload)
        setToast({ show: true, message: '4Ps beneficiary registered successfully', variant: 'success' })
      }

      setShowForm(false)
      setEditingId(null)
      loadBeneficiaries()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to save 4Ps beneficiary'
      setToast({ show: true, message: errorMessage, variant: 'danger' })
      throw err
    }
  }, [editingId, loadBeneficiaries])

  const handleDelete = useCallback(async () => {
    if (showDelete == null) return
    try {
      await deleteFourPsBeneficiary(showDelete)
      setToast({ show: true, message: '4Ps beneficiary deleted successfully', variant: 'success' })
      setShowDelete(null)
      loadBeneficiaries()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to delete 4Ps beneficiary'
      setToast({ show: true, message: errorMessage, variant: 'danger' })
      setShowDelete(null)
    }
  }, [showDelete, loadBeneficiaries])

  // Handle search input change - only updates input value, not search query
  // Search query is updated via debounce effect above
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value)
    // Page reset is handled in debounce effect
  }, [])

  // Manual search trigger for Enter key or Search button
  const handleSearchSubmit = useCallback(() => {
    // Cancel any pending debounced search to avoid duplicate requests
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current)
      debounceTimeoutRef.current = null
    }

    const searchTerm = searchInput
    setDebouncedSearch(searchTerm)
    setPage(1)
    // Trigger an immediate search using the latest input value
    loadBeneficiaries(searchTerm, 1)

    // Ensure the input keeps focus after triggering search
    if (searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchInput, loadBeneficiaries])

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        handleSearchSubmit()
      }
    },
    [handleSearchSubmit]
  )

  const handleEdit = useCallback((beneficiary: FourPsBeneficiary) => {
    setEditingId(beneficiary.id)
    setShowForm(true)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Active</Badge>
      case 'suspended':
        return <Badge bg="warning" text="dark">Suspended</Badge>
      case 'inactive':
        return <Badge bg="danger">Inactive</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  const editingBeneficiary = useMemo(() => {
    if (!editingId) return undefined
    return items.find((item: FourPsBeneficiary) => item.id === editingId)
  }, [editingId, items])

  return (
    <div className="page-container page-sub">
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">4Ps Beneficiaries</h2>
          <p className="text-brand-muted mb-0">Pantawid Pamilyang Pilipino Program Monitoring</p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null)
              setShowForm(true)
            }}
            className="btn-brand-primary d-flex align-items-center gap-2"
          >
            <Plus size={18} />
            Register 4Ps Household
          </Button>
        )}
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
                  placeholder="4Ps number, household name, or address"
                  value={searchInput}
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
              <Col md={3}>
                <Form.Group className="mb-0">
                  <Form.Label className="form-label-custom">Purok</Form.Label>
                  <Form.Select
                    value={purokId}
                    onChange={(e) => {
                      setPurokId(e.target.value)
                      setPage(1)
                    }}
                    disabled={isLoading}
                    className="form-control-custom"
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
            <Col md={role === 'admin' ? 3 : 4}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value)
                    setPage(1)
                  }}
                  disabled={isLoading}
                  className="form-control-custom"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
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
                  <th>4Ps ID / Number</th>
                  <th>Household Name</th>
                  <th>Purok</th>
                  <th>Head of Household</th>
                  <th>Status</th>
                  <th>Date Registered</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></td>
                        <td><div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></td>
                        <td><div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></td>
                        {canManage && (
                          <td>
                            <div className="action-buttons">
                              <div className="skeleton-button" style={{ width: '60px', height: '28px' }}></div>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={canManage ? 7 : 6} className="text-center py-5 text-muted">
                      No 4Ps beneficiaries found
                    </td>
                  </tr>
                ) : (
                  items.map((beneficiary: FourPsBeneficiary) => (
                    <tr key={beneficiary.id} className="table-row">
                      <td>
                        <strong>{beneficiary.four_ps_number}</strong>
                      </td>
                      <td>{beneficiary.household?.head_name || 'N/A'}</td>
                      <td>
                        <span className="badge bg-primary">
                          {beneficiary.household?.purok?.name || 'N/A'}
                        </span>
                      </td>
                      <td>{beneficiary.household?.head_name || 'N/A'}</td>
                      <td>{getStatusBadge(beneficiary.status)}</td>
                      <td>{beneficiary.date_registered}</td>
                      {canManage && (
                        <td>
                          <div className="action-buttons">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="btn-action btn-action-view me-2"
                              onClick={() => handleEdit(beneficiary)}
                            >
                              Edit
                            </Button>
                            {canDelete && (
                              <Button
                                variant="outline-danger"
                                size="sm"
                                className="btn-action btn-action-delete"
                                onClick={() => setShowDelete(beneficiary.id)}
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div className="pagination-info">
                Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, total)} of {total} 4Ps beneficiaries
              </div>
              <Pagination className="mb-0">
                <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      return (
                        <React.Fragment key={p}>
                          <Pagination.Ellipsis />
                          <Pagination.Item active={p === page} onClick={() => setPage(p)}>
                            {p}
                          </Pagination.Item>
                        </React.Fragment>
                      )
                    }
                    return (
                      <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
                        {p}
                      </Pagination.Item>
                    )
                  })}
                <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <FourPsFormModal
          show={showForm}
          initial={editingBeneficiary ? {
            household_id: String(editingBeneficiary.household_id),
            four_ps_number: editingBeneficiary.four_ps_number,
            status: editingBeneficiary.status,
            date_registered: editingBeneficiary.date_registered,
          } : undefined}
          onSubmit={handleSubmit}
          onHide={() => {
            setShowForm(false)
            setEditingId(null)
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDelete !== null}
        title="Delete 4Ps Beneficiary"
        body="Are you sure you want to delete this 4Ps beneficiary? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDelete}
        onHide={() => setShowDelete(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={toast.show}
          onClose={() => setToast({ ...toast, show: false })}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
