import { useEffect, useState } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast } from 'react-bootstrap'
import { getPuroks, deletePurok, createPurok, updatePurok } from '../../services/puroks.service'
import PurokFormModal from '../../components/puroks/PurokFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
// import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function PurokListPage() {
  // const { user } = useAuth()
  // const role = user?.role
  // const isAdmin = role === 'admin'
  const isAdmin = true // Allow all users to perform CRUD operations for demo
  const navigate = useNavigate()

  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [deletingId, setDeletingId] = useState<null | number>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getPuroks({ search, page, per_page: 15 })
      const list = res.data.data
      setItems(list)
      setTotalPages(res.data.last_page)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load().catch(() => null) 
  }, [search, page]) // These dependencies are fine as they're primitive values

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0">Puroks</h2>
          <p className="text-muted mb-0">Manage purok information and records</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => { setEditingId(null); setShowForm(true) }} 
              disabled={loading}
              className="btn-primary-custom btn-action-add"
            >
              <i className="fas fa-plus me-2"></i>
              Add Purok
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <Card.Body className="p-3">
          <Row className="align-items-end g-3">
            <Col md={6}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Search</Form.Label>
                <Form.Control 
                  placeholder="Purok name, leader, or contact" 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                  disabled={loading}
                  className="form-control-custom"
                />
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
                  <th>Purok Name</th>
                  <th>Purok Leader</th>
                  <th>Leader Contact</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td>
                          <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '200px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px' }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-5">
                      <div className="empty-state">
                        <i className="fas fa-map-marker-alt text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0">No puroks found</p>
                        <small className="text-muted">Try adjusting your search criteria</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((p) => (
                    <tr key={p.id} className="table-row">
                      <td className="fw-medium">{p.name}</td>
                      <td>{p.captain || '-'}</td>
                      <td>{p.contact || '-'}</td>
                      <td>
                        <div className="action-buttons">
                          <Button 
                            size="sm" 
                            onClick={() => navigate(`/puroks/${p.id}`)}
                            className="btn-action btn-action-view"
                          >
                            <i className="fas fa-eye"></i>
                            View
                          </Button>
                          {isAdmin && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => { setEditingId(p.id); setShowForm(true) }}
                                className="btn-action btn-action-edit"
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </Button>
                              <Button 
                                size="sm" 
                                onClick={() => setDeletingId(p.id)}
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
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="pagination-btn"
                />
                <Pagination.Item active className="pagination-item">{page}</Pagination.Item>
                <Pagination.Next 
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => p + 1)}
                  className="pagination-btn"
                />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      )}

      <PurokFormModal
        show={showForm}
        initial={(() => {
          if (!editingId) return undefined
          const p = items.find((i) => i.id === editingId)
          if (!p) return undefined
          return {
            name: p.name,
            captain: p.captain || '',
            contact: p.contact || '',
          }
        })()}
        onSubmit={async (values) => {
          try {
            if (editingId) {
              await updatePurok(editingId, {
                name: values.name,
                captain: values.captain,
                contact: values.contact,
              })
              setToast({ show: true, message: 'Purok updated', variant: 'success' })
            } else {
              await createPurok({
                name: values.name,
                captain: values.captain,
                contact: values.contact,
              })
              setToast({ show: true, message: 'Purok created', variant: 'success' })
            }
            setShowForm(false)
            setEditingId(null)
            await load()
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Save failed', variant: 'danger' })
          }
        }}
        onHide={() => { setShowForm(false); setEditingId(null) }}
      />

      <ConfirmModal
        show={deletingId != null}
        title="Delete Purok"
        body="Are you sure you want to delete this purok?"
        confirmText="Delete"
        onConfirm={async () => {
          if (!deletingId) return
          try {
            await deletePurok(deletingId)
            setToast({ show: true, message: 'Purok deleted', variant: 'success' })
            await load()
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
          } finally {
            setDeletingId(null)
          }
        }}
        onHide={() => setDeletingId(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}


