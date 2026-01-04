import { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap'
import { Calendar, MapPin, Users } from 'lucide-react'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/events.service'
import type { Event, CreateEventPayload } from '../../services/events.service'
import EventFormModal from '../../components/events/EventFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { useAuth } from '../../context/AuthContext'

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)

  // Determine user permissions
  const canManage = user?.role === 'admin' || user?.role === 'purok_leader'

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      setLoading(true)
      const response = await getEvents(false) // Get all events, not just upcoming
      if (response.success) {
        // Set data immediately - no delays
        setEvents(response.data)
      } else {
        setError(response.message || 'Failed to fetch events')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Events unavailable')
    } finally {
      // Clear loading state immediately when data is ready
      setLoading(false)
    }
  }

  const handleCreateEvent = async (values: any) => {
    try {
      // Convert form values to API payload
      const payload: CreateEventPayload = {
        title: values.title,
        date: values.date,
        location: values.location,
        description: values.description,
        purok_id: values.purok_id ? Number(values.purok_id) : null,
      }
      
      const response = await createEvent(payload)
      if (response.success) {
        setEvents(prev => [response.data, ...prev])
        setShowForm(false)
      } else {
        setError(response.message || 'Failed to create event')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create event')
    }
  }

  const handleUpdateEvent = async (values: any) => {
    if (!editingEvent) return
    
    try {
      // Convert form values to API payload
      const payload: CreateEventPayload = {
        title: values.title,
        date: values.date,
        location: values.location,
        description: values.description,
        purok_id: values.purok_id ? Number(values.purok_id) : null,
      }
      
      const response = await updateEvent(editingEvent.id, payload)
      if (response.success) {
        setEvents(prev => prev.map(event => 
          event.id === editingEvent.id ? response.data : event
        ))
        setShowForm(false)
        setEditingEvent(null)
      } else {
        setError(response.message || 'Failed to update event')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update event')
    }
  }

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return
    
    try {
      const response = await deleteEvent(deletingEvent.id)
      if (response.success) {
        setEvents(prev => prev.filter(event => event.id !== deletingEvent.id))
        setShowDeleteConfirm(false)
        setDeletingEvent(null)
      } else {
        setError(response.message || 'Failed to delete event')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete event')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getEventStatus = (dateString: string) => {
    const eventDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (eventDate < today) {
      return <Badge bg="secondary" className="rounded-pill">Past</Badge>
    } else if (eventDate.getTime() === today.getTime()) {
      return <Badge bg="success" className="rounded-pill">Today</Badge>
    } else {
      return <Badge bg="primary" className="rounded-pill">Upcoming</Badge>
    }
  }

  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="row">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="col-md-6 col-lg-4 mb-4">
              <div className="skeleton-card" style={{ height: '200px' }}>
                <div className="skeleton-line" style={{ width: '80%', height: '20px', marginBottom: '10px' }}></div>
                <div className="skeleton-line" style={{ width: '60%', height: '16px', marginBottom: '15px' }}></div>
                <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '90%', height: '14px', marginBottom: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '70%', height: '14px', marginBottom: '15px' }}></div>
                <div className="d-flex justify-content-between align-items-center">
                  <div className="skeleton-badge" style={{ width: '80px', height: '24px' }}></div>
                  <div className="skeleton-button" style={{ width: '60px', height: '32px' }}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    )
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Events Management</h2>
          <p className="text-brand-muted mb-0">Manage barangay events and activities</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => setShowForm(true)} 
              disabled={loading}
              className="btn-brand-primary"
            >
              <i className="fas fa-plus me-2"></i>
              Add Event
            </Button>
          )}
        </div>
      </div>

      {error && (
        <Row className="mb-4">
          <Col>
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card className="data-table-card">
            <Card.Header>
              <h5 className="mb-0 text-brand-primary">All Events ({events.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {events.length === 0 ? (
                <div className="text-center py-5">
                  <div className="empty-state">
                    <i className="fas fa-calendar-alt text-brand-muted mb-3" style={{ fontSize: '3rem' }}></i>
                    <h5 className="text-brand-primary">No events found</h5>
                    <p className="text-brand-muted">Create your first event to get started.</p>
                  </div>
                </div>
              ) : (
                <div className="table-responsive">
                  <Table className="data-table" striped hover>
                    <thead className="table-header">
                      <tr>
                        <th>Title</th>
                        <th>Date</th>
                        <th>Location</th>
                        <th>Purok</th>
                        <th>Status</th>
                        <th>Description</th>
                        <th className="actions-column">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {events.map((event) => (
                        <tr key={event.id} className="table-row">
                          <td className="fw-medium">{event.title}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted" />
                              {formatDate(event.date)}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted" />
                              {event.location}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <Users className="h-4 w-4 text-muted" />
                              {event.purok ? event.purok.name : 'Barangay-wide'}
                            </div>
                          </td>
                          <td>
                            {getEventStatus(event.date)}
                          </td>
                          <td>
                            {event.description ? (
                              <span className="text-brand-muted">
                                {event.description.length > 50 
                                  ? `${event.description.substring(0, 50)}...` 
                                  : event.description
                                }
                              </span>
                            ) : (
                              <span className="text-brand-muted">No description</span>
                            )}
                          </td>
                          <td>
                            {canManage && (
                              <div className="action-buttons">
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setEditingEvent(event)
                                    setShowForm(true)
                                  }}
                                  className="btn-action btn-action-edit"
                                  title="Edit Event"
                                >
                                  <i className="fas fa-edit"></i>
                                  Edit
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setDeletingEvent(event)
                                    setShowDeleteConfirm(true)
                                  }}
                                  className="btn-action btn-action-delete"
                                  title="Delete Event"
                                >
                                  <i className="fas fa-trash"></i>
                                  Delete
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Event Form Modal */}
      <EventFormModal
        show={showForm}
        initial={editingEvent || undefined}
        onSubmit={editingEvent ? handleUpdateEvent : handleCreateEvent}
        onHide={() => {
          setShowForm(false)
          setEditingEvent(null)
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        show={showDeleteConfirm}
        title="Delete Event"
        body={`Are you sure you want to delete "${deletingEvent?.title}"?`}
        onConfirm={handleDeleteEvent}
        onHide={() => {
          setShowDeleteConfirm(false)
          setDeletingEvent(null)
        }}
      />
    </div>
  )
}
