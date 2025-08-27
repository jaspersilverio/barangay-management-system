import { useEffect, useState, useMemo } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast } from 'react-bootstrap'
import { listResidents, deleteResident, createResident, updateResident } from '../../services/residents.service'
import ResidentFormModal from '../../components/residents/ResidentFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

export default function ResidentListPage() {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' })
  const [showForm, setShowForm] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [editingId, setEditingId] = useState<null | number>(null)

  const canManage = role === 'admin' || role === 'purok_leader' || role === 'staff'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  const load = async () => {
    setLoading(true)
    try {
      const res = await listResidents({ 
        search, 
        page, 
        purok_id: effectivePurokId || undefined 
      })
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
  }, [search, page, effectivePurokId])

  const handleDelete = async () => {
    if (showDelete == null) return
    try {
      await deleteResident(showDelete)
      setToast({ show: true, message: 'Resident deleted', variant: 'success' })
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
        <Col md={4}>
          <Form.Group className="mb-0">
            <Form.Label>Search</Form.Label>
            <Form.Control placeholder="Name, relationship, or occupation" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Group>
        </Col>
        {role === 'admin' && (
          <Col md={4}>
            <Form.Group className="mb-0">
              <Form.Label>Purok</Form.Label>
              <Form.Select value={purokId} onChange={(e) => setPurokId(e.target.value)}>
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
        <Col className="text-end">
          {canManage && (
            <Button variant="primary" onClick={() => setShowForm(true)}>Add Resident</Button>
          )}
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Name</th>
              <th>Purok</th>
              <th>Household</th>
              <th>Sex</th>
              <th>Age</th>
              <th>Relationship</th>
              <th>Occupation</th>
              <th style={{ width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((resident) => (
              <tr key={resident.id}>
                <td>{`${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim()}</td>
                <td>{resident.household?.purok?.name || '-'}</td>
                <td>{resident.household?.head_name || '-'}</td>
                <td>{resident.sex}</td>
                <td>{resident.age || '-'}</td>
                <td>{resident.relationship_to_head}</td>
                <td>{resident.occupation_status}</td>
                <td>
                  <div className="d-flex gap-2">
                    {canManage && (
                      <>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => {
                            setEditingId(resident.id)
                            setShowForm(true)
                          }}
                        >
                          Edit
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setShowDelete(resident.id)}>Delete</Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-4">{loading ? 'Loading...' : 'No residents found.'}</td>
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
        title="Delete Resident"
        body="Are you sure you want to delete this resident?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onHide={() => setShowDelete(null)}
      />

      <ResidentFormModal
        show={showForm}
        initial={(() => {
          if (!editingId) return undefined
          const r = items.find((i) => i.id === editingId)
          if (!r) return undefined
          return {
            household_id: r.household_id,
            first_name: r.first_name,
            middle_name: r.middle_name || '',
            last_name: r.last_name,
            sex: r.sex,
            birthdate: r.birthdate,
            relationship_to_head: r.relationship_to_head,
            occupation_status: r.occupation_status,
            is_pwd: !!r.is_pwd,
            purok_id: r.household?.purok_id ? String(r.household.purok_id) : '',
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
              relationship_to_head: values.relationship_to_head,
              occupation_status: values.occupation_status,
              is_pwd: !!values.is_pwd,
              purok_id: values.purok_id || '', // Convert undefined to empty string
            }

            if (editingId) {
              await updateResident(editingId, payload)
              setToast({ show: true, message: 'Resident updated', variant: 'success' })
            } else {
              await createResident(payload)
              setToast({ show: true, message: 'Resident created', variant: 'success' })
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
