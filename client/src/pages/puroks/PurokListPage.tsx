import { useEffect, useMemo, useState } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast } from 'react-bootstrap'
import { listPuroks, deletePurok, createPurok, updatePurok } from '../../services/puroks.service'
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
      const res = await listPuroks({ search, page })
      const data = res.data
      const list = data.data ?? data
      setItems(list.data ?? list)
      setTotalPages(list.last_page ?? 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load().catch(() => null) }, [search, page])

  return (
    <Card className="shadow rounded-3 p-4">
      <Row className="align-items-end g-3 mb-3">
        <Col md={6}>
          <Form.Group className="mb-0">
            <Form.Label>Search</Form.Label>
            <Form.Control placeholder="Purok name, captain, or contact" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Group>
        </Col>
        <Col className="text-end">
          {isAdmin && (
            <Button variant="primary" onClick={() => { setEditingId(null); setShowForm(true) }}>Add Purok</Button>
          )}
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Purok Name</th>
              <th>Purok Captain</th>
              <th>Captain Contact</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.captain || '-'}</td>
                <td>{p.contact || '-'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/puroks/${p.id}`)}>View</Button>
                    {isAdmin && (
                      <>
                        <Button size="sm" variant="primary" onClick={() => { setEditingId(p.id); setShowForm(true) }}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => setDeletingId(p.id)}>Delete</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-4">{loading ? 'Loading...' : 'No puroks found.'}</td>
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

      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  )
}


