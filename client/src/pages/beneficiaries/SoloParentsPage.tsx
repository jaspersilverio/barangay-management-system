import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Badge, ToastContainer, Toast, Modal } from 'react-bootstrap'
import { Plus, FileText } from 'lucide-react'
import { 
  listSoloParents, 
  createSoloParent, 
  updateSoloParent, 
  deleteSoloParent,
  generateSoloParentCertificate,
  type SoloParent,
  type SoloParentPayload 
} from '../../services/solo-parents.service'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import SoloParentFormModal from '../../components/beneficiaries/SoloParentFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import type { SoloParentFormValues } from '../../components/beneficiaries/SoloParentFormModal'

export default function SoloParentsPage() {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [search, setSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [soloParentsData, setSoloParentsData] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [showCertificate, setShowCertificate] = useState<null | number>(null)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ 
    show: false, 
    message: '', 
    variant: 'success' 
  })

  const canManage = role === 'admin' || role === 'staff'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  const loadSoloParents = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listSoloParents({ 
        search, 
        page, 
        purok_id: effectivePurokId || undefined,
        status: statusFilter || undefined,
        per_page: 15 
      })
      setSoloParentsData(data)
    } catch (err) {
      console.error('Error loading solo parents:', err)
      setToast({ show: true, message: 'Failed to load solo parents', variant: 'danger' })
    } finally {
      setIsLoading(false)
    }
  }, [search, page, effectivePurokId, statusFilter])

  useEffect(() => {
    loadSoloParents()
  }, [loadSoloParents])

  const items = useMemo(() => {
    if (!soloParentsData?.data?.data) return []
    return soloParentsData.data.data
  }, [soloParentsData])

  const totalPages = useMemo(() => {
    return soloParentsData?.data?.last_page ?? 1
  }, [soloParentsData])

  const total = useMemo(() => {
    return soloParentsData?.data?.total ?? 0
  }, [soloParentsData])

  const handleSubmit = useCallback(async (values: SoloParentFormValues) => {
    try {
      const payload: SoloParentPayload = {
        resident_id: Number(values.resident_id),
        eligibility_reason: values.eligibility_reason,
        date_declared: values.date_declared,
        valid_until: values.valid_until,
        verification_date: values.verification_date || undefined,
        verified_by: values.verified_by ? Number(values.verified_by) : undefined,
      }

      if (editingId) {
        await updateSoloParent(editingId, payload)
        setToast({ show: true, message: 'Solo parent updated successfully', variant: 'success' })
      } else {
        await createSoloParent(payload)
        setToast({ show: true, message: 'Solo parent registered successfully', variant: 'success' })
      }
      
      setShowForm(false)
      setEditingId(null)
      loadSoloParents()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to save solo parent'
      setToast({ show: true, message: errorMessage, variant: 'danger' })
      throw err
    }
  }, [editingId, loadSoloParents])

  const handleDelete = useCallback(async () => {
    if (showDelete == null) return
    try {
      await deleteSoloParent(showDelete)
      setToast({ show: true, message: 'Solo parent deleted successfully', variant: 'success' })
      setShowDelete(null)
      loadSoloParents()
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to delete solo parent'
      setToast({ show: true, message: errorMessage, variant: 'danger' })
      setShowDelete(null)
    }
  }, [showDelete, loadSoloParents])

  const handleEdit = useCallback((soloParent: SoloParent) => {
    setEditingId(soloParent.id)
    setShowForm(true)
  }, [])

  const handleGenerateCertificate = useCallback(async () => {
    if (showCertificate == null) return
    try {
      const blob = await generateSoloParentCertificate(showCertificate)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `solo-parent-certificate-${showCertificate}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      setToast({ show: true, message: 'Certificate generated successfully', variant: 'success' })
      setShowCertificate(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to generate certificate'
      setToast({ show: true, message: errorMessage, variant: 'danger' })
      setShowCertificate(null)
    }
  }, [showCertificate])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Active</Badge>
      case 'expired':
        return <Badge bg="warning" text="dark">Expired</Badge>
      case 'inactive':
        return <Badge bg="secondary">Inactive</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  const editingSoloParent = useMemo(() => {
    if (!editingId) return undefined
    return items.find((item: SoloParent) => item.id === editingId)
  }, [editingId, items])

  const viewingSoloParent = useMemo(() => {
    if (!showCertificate) return undefined
    return items.find((item: SoloParent) => item.id === showCertificate)
  }, [showCertificate, items])

  return (
    <div className="page-container page-sub">
      {/* Page Header */}
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Solo Parents</h2>
          <p className="text-brand-muted mb-0">Manage solo parent beneficiaries and certificates</p>
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
            Register Solo Parent
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
                  placeholder="Resident name or eligibility reason"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  disabled={isLoading}
                  className="form-control-custom"
                />
              </Form.Group>
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
                  <option value="expired">Expired</option>
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
                  <th>Resident Name</th>
                  <th>Eligibility Reason</th>
                  <th>Purok</th>
                  <th>Status</th>
                  <th>Dependent Children</th>
                  <th>Date Declared</th>
                  <th>Valid Until</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></td>
                        <td><div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div></td>
                        <td><div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '40px', height: '16px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></td>
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
                    <td colSpan={canManage ? 8 : 7} className="text-center py-5 text-muted">
                      No solo parents found
                    </td>
                  </tr>
                ) : (
                  items.map((soloParent: SoloParent) => (
                    <tr key={soloParent.id} className="table-row">
                      <td>
                        <strong>{soloParent.resident?.full_name || 'N/A'}</strong>
                        {soloParent.resident?.age && (
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Age: {soloParent.resident.age}
                          </div>
                        )}
                      </td>
                      <td>{soloParent.eligibility_reason_label}</td>
                      <td>
                        <span className="badge bg-primary">
                          {soloParent.resident?.household?.purok?.name || 'N/A'}
                        </span>
                      </td>
                      <td>{getStatusBadge(soloParent.computed_status)}</td>
                      <td>
                        <span className="badge bg-info">
                          {soloParent.dependent_children_count} {soloParent.dependent_children_count === 1 ? 'child' : 'children'}
                        </span>
                      </td>
                      <td>{soloParent.date_declared}</td>
                      <td>{soloParent.valid_until}</td>
                      {canManage && (
                        <td>
                          <div className="action-buttons d-flex gap-2">
                            {soloParent.computed_status === 'active' && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                className="btn-action"
                                onClick={() => setShowCertificate(soloParent.id)}
                                title="Generate Certificate"
                              >
                                <FileText size={14} />
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              className="btn-action btn-action-view"
                              onClick={() => handleEdit(soloParent)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="btn-action btn-action-delete"
                              onClick={() => setShowDelete(soloParent.id)}
                            >
                              Delete
                            </Button>
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
                Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, total)} of {total} solo parents
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
        <SoloParentFormModal
          show={showForm}
          initial={editingSoloParent ? {
            resident_id: String(editingSoloParent.resident_id),
            eligibility_reason: editingSoloParent.eligibility_reason as any,
            date_declared: editingSoloParent.date_declared,
            valid_until: editingSoloParent.valid_until,
            verification_date: editingSoloParent.verification_date || '',
            verified_by: '',
          } : undefined}
          onSubmit={handleSubmit}
          onHide={() => {
            setShowForm(false)
            setEditingId(null)
          }}
        />
      )}

      {/* Certificate Generation Modal */}
      <Modal show={showCertificate !== null} onHide={() => setShowCertificate(null)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Generate Solo Parent Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {viewingSoloParent && (
            <div>
              <p><strong>Resident:</strong> {viewingSoloParent.resident?.full_name}</p>
              <p><strong>Status:</strong> {getStatusBadge(viewingSoloParent.computed_status)}</p>
              <p><strong>Eligibility Reason:</strong> {viewingSoloParent.eligibility_reason_label}</p>
              <p><strong>Dependent Children:</strong> {viewingSoloParent.dependent_children_count}</p>
              {viewingSoloParent.computed_status !== 'active' && (
                <div className="alert alert-warning">
                  Only Active solo parents can generate certificates.
                </div>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCertificate(null)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleGenerateCertificate}
            disabled={viewingSoloParent?.computed_status !== 'active'}
            className="btn-brand-primary"
          >
            Generate Certificate
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDelete !== null}
        title="Delete Solo Parent"
        body="Are you sure you want to delete this solo parent record? This action cannot be undone."
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
