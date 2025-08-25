import { useEffect, useState } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, Toast, ToastContainer } from 'react-bootstrap'
import { listHouseholds, deleteHousehold, createHousehold, updateHousehold } from '../../services/households.service'
import ConfirmModal from '../../components/modals/ConfirmModal'
import HouseholdFormModal from '../../components/households/HouseholdFormModal'
import { useNavigate } from 'react-router-dom'
// import { usePuroks } from '../../context/PurokContext'
// import { useAuth } from '../../context/AuthContext'

export default function HouseholdListPage() {
  const navigate = useNavigate()
  // const { puroks, refresh } = usePuroks()
  // const { user } = useAuth()
  // const role = user?.role
  // const assignedPurokId = user?.assigned_purok_id ?? null
  const role = 'admin' // Allow all users to perform CRUD operations for demo
  // const assignedPurokId = null

  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  // const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<null | number>(null)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' })

  // const canManage = role === 'admin' || role === 'purok_leader'
  const canManage = true // Allow all users to manage for demo

  // const effectivePurokId = useMemo(() => {
  //   // if (role === 'admin') return purokId
  //   // if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
  //   // return purokId
  //   return purokId // Allow all users to select any purok for demo
  // }, [purokId])

  const load = async () => {
    setLoading(true)
    try {
      const res = await listHouseholds({ search, page })
      const data = res.data
      const list = data.data ?? data
      setItems(list.data ?? list)
      setTotalPages(list.last_page ?? 1)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    load().catch(() => null) 
  }, [search, page]) // These dependencies are fine as they're primitive values

  const handleDelete = async () => {
    if (showDelete == null) return
    try {
      await deleteHousehold(showDelete)
      setToast({ show: true, message: 'Household deleted', variant: 'success' })
      await load()
    } catch (e: any) {
      setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
    } finally {
      setShowDelete(null)
    }
  }

  return (
    <Card className="shadow rounded-3 p-4">
      <Row className="align-items-end g-3 mb-3">
        <Col md={6}>
          <Form.Group className="mb-0">
            <Form.Label>Search</Form.Label>
            <Form.Control placeholder="Address, head name, or contact" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Group>
        </Col>
        <Col className="text-end">
          {canManage && (
            <Button variant="primary" onClick={() => setShowForm(true)}>Add Household</Button>
          )}
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Address</th>
              <th>Property Type</th>
              <th>Head of Household</th>
              <th>Contact</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((hh) => (
              <tr key={hh.id}>
                <td>{hh.address}</td>
                <td>{hh.property_type || '-'}</td>
                <td>{hh.head_name}</td>
                <td>{hh.contact || '-'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => navigate(`/households/${hh.id}`)}>View</Button>
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
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setShowDelete(hh.id)}>Delete</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-4">{loading ? 'Loading...' : 'No households found.'}</td>
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
            if (editingId) {
              await updateHousehold(editingId, {
                address: values.address,
                property_type: values.property_type,
                head_name: values.head_name,
                contact: values.contact,
                purok_id: values.purok_id,
              })
              setToast({ show: true, message: 'Household updated', variant: 'success' })
            } else {
              await createHousehold({
                address: values.address,
                property_type: values.property_type,
                head_name: values.head_name,
                contact: values.contact,
                purok_id: values.purok_id,
              })
              setToast({ show: true, message: 'Household created', variant: 'success' })
            }
            setShowForm(false)
            setEditingId(null)
            await load()
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Save failed', variant: 'danger' })
          }
        }}
        onHide={() => {
          setShowForm(false)
          setEditingId(null)
        }}
      />

      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  )
}


