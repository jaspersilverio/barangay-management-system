import { useEffect, useState } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast } from 'react-bootstrap'
import { listResidents, deleteResident, createResident, updateResident } from '../../services/residents.service'
import ResidentFormModal from '../../components/residents/ResidentFormModal'

export default function ResidentListPage() {
  const [items, setItems] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' })
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<null | number>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await listResidents({ search, page })
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
            <Form.Control placeholder="Name or relationship" value={search} onChange={(e) => setSearch(e.target.value)} />
          </Form.Group>
        </Col>
        <Col className="text-end">
          <Button variant="primary" onClick={() => { setEditingId(null); setShowForm(true) }}>Add Resident</Button>
        </Col>
      </Row>

      <div className="table-responsive">
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Household</th>
              <th>Name</th>
              <th>Sex</th>
              <th>Birthdate</th>
              <th>Relationship</th>
              <th>Occupation</th>
              <th>PWD</th>
              <th style={{ width: 200 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id}>
                <td>{r.household_id}</td>
                <td>{r.first_name} {r.middle_name ? r.middle_name + ' ' : ''}{r.last_name}</td>
                <td>{r.sex}</td>
                <td>{r.birthdate}</td>
                <td>{r.relationship_to_head}</td>
                <td>{r.occupation_status}</td>
                <td>{r.is_pwd ? 'Yes' : 'No'}</td>
                <td>
                  <div className="d-flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => { setEditingId(r.id); setShowForm(true) }}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={async () => {
                      try {
                        await deleteResident(r.id)
                        setToast({ show: true, message: 'Resident deleted', variant: 'success' })
                        await load()
                      } catch (e: any) {
                        setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
                      }
                    }}>Delete</Button>
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
          }
        })()}
        onSubmit={async (values) => {
          try {
            if (editingId) {
              await updateResident(editingId, {
                household_id: Number(values.household_id),
                first_name: values.first_name,
                middle_name: values.middle_name || undefined,
                last_name: values.last_name,
                sex: values.sex,
                birthdate: values.birthdate,
                relationship_to_head: values.relationship_to_head,
                occupation_status: values.occupation_status,
                is_pwd: !!values.is_pwd,
              })
              setToast({ show: true, message: 'Resident updated', variant: 'success' })
            } else {
              await createResident({
                household_id: Number(values.household_id),
                first_name: values.first_name,
                middle_name: values.middle_name || undefined,
                last_name: values.last_name,
                sex: values.sex,
                birthdate: values.birthdate,
                relationship_to_head: values.relationship_to_head,
                occupation_status: values.occupation_status,
                is_pwd: !!values.is_pwd,
              })
              setToast({ show: true, message: 'Resident created', variant: 'success' })
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

      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </Card>
  )
}
