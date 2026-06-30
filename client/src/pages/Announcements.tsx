import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button, Card, Col, Form, Modal, Row } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import {
  type Announcement,
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
} from '../services/announcements.service'

type FormState = {
  title: string
  content: string
}

const EMPTY_FORM: FormState = {
  title: '',
  content: '',
}

export default function AnnouncementsPage() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'captain'

  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  const sortedAnnouncements = useMemo(
    () => [...announcements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [announcements]
  )

  const loadAnnouncements = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getAnnouncements()
      if (res.success) {
        setAnnouncements(res.data)
      } else {
        setError(res.message || 'Failed to load announcements')
      }
    } catch {
      setError('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadAnnouncements()
  }, [loadAnnouncements])

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (announcement: Announcement) => {
    setEditing(announcement)
    setForm({
      title: announcement.title,
      content: announcement.content,
    })
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
    setForm(EMPTY_FORM)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!form.title.trim() || !form.content.trim()) return

    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
      }

      const res = editing
        ? await updateAnnouncement(editing.id, payload)
        : await createAnnouncement(payload)

      if (!res.success) {
        setError(res.message || 'Failed to save announcement')
        return
      }

      await loadAnnouncements()
      closeModal()
    } catch {
      setError('Failed to save announcement')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (announcement: Announcement) => {
    if (!window.confirm(`Delete announcement "${announcement.title}"?`)) return
    setError(null)
    try {
      const res = await deleteAnnouncement(announcement.id)
      if (!res.success) {
        setError(res.message || 'Failed to delete announcement')
        return
      }
      setAnnouncements((prev) => prev.filter((item) => item.id !== announcement.id))
    } catch {
      setError('Failed to delete announcement')
    }
  }

  return (
    <div className="page-container">
      <div className="page-header d-flex justify-content-between align-items-start mb-4">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Announcements</h2>
          <p className="text-brand-muted mb-0">Barangay-wide updates and public notices</p>
        </div>
        {canManage && (
          <Button className="btn-brand-primary" onClick={openCreate}>
            <i className="fas fa-plus me-2" />
            New Announcement
          </Button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5 text-brand-muted">Loading announcements...</div>
      ) : sortedAnnouncements.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h5 className="text-brand-primary">No announcements yet</h5>
            <p className="text-brand-muted mb-0">New announcements will appear here.</p>
          </Card.Body>
        </Card>
      ) : (
        <Row className="g-3">
          {sortedAnnouncements.map((announcement) => (
            <Col key={announcement.id} md={12}>
              <Card className="data-table-card">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-start gap-3">
                    <div>
                      <h5 className="mb-2 text-brand-primary">{announcement.title}</h5>
                      <p className="mb-2">{announcement.content}</p>
                      <small className="text-brand-muted">
                        Posted {new Date(announcement.created_at).toLocaleString()} by {announcement.creator?.name || 'System'}
                      </small>
                    </div>
                    {canManage && (
                      <div className="d-flex gap-2">
                        <Button size="sm" className="btn-action btn-action-edit" onClick={() => openEdit(announcement)}>
                          <i className="fas fa-edit" /> Edit
                        </Button>
                        <Button size="sm" className="btn-action btn-action-delete" onClick={() => handleDelete(announcement)}>
                          <i className="fas fa-trash" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Modal show={showModal} onHide={closeModal} centered>
        <Form onSubmit={handleSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editing ? 'Edit Announcement' : 'Create Announcement'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Content</Form.Label>
              <Form.Control
                as="textarea"
                rows={5}
                value={form.content}
                onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeModal} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" className="btn-brand-primary" disabled={submitting}>
              {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  )
}
