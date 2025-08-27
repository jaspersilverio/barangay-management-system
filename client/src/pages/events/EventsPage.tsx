import React, { useEffect, useState } from 'react'
import { Container, Row, Col, Card, Button, Table, Badge } from 'react-bootstrap'
import { Plus, Edit, Trash2, Calendar, MapPin, Users } from 'lucide-react'
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
        setEvents(response.data)
      } else {
        setError(response.message || 'Failed to fetch events')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Events unavailable')
    } finally {
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
      return <Badge bg="secondary">Past</Badge>
    } else if (eventDate.getTime() === today.getTime()) {
      return <Badge bg="success">Today</Badge>
    } else {
      return <Badge bg="primary">Upcoming</Badge>
    }
  }

  if (loading) {
    return (
      <Container fluid className="p-4">
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="mb-0">Events Management</h2>
            {canManage && (
              <Button 
                variant="primary" 
                onClick={() => setShowForm(true)}
                className="d-flex align-items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            )}
          </div>
        </Col>
      </Row>

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
          <Card>
            <Card.Header>
              <h5 className="mb-0">All Events ({events.length})</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {events.length === 0 ? (
                <div className="text-center py-5">
                  <Calendar className="h-12 w-12 text-muted mb-3" />
                  <h5 className="text-muted">No events found</h5>
                  <p className="text-muted">Create your first event to get started.</p>
                  {canManage && (
                    <Button variant="primary" onClick={() => setShowForm(true)}>
                      <Plus className="h-4 w-4 me-2" />
                      Add Event
                    </Button>
                  )}
                </div>
              ) : (
                <Table responsive hover className="mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Title</th>
                      <th>Date</th>
                      <th>Location</th>
                      <th>Purok</th>
                      <th>Status</th>
                      <th>Description</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events.map((event) => (
                      <tr key={event.id}>
                        <td>
                          <strong>{event.title}</strong>
                        </td>
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
                            <span className="text-muted">
                              {event.description.length > 50 
                                ? `${event.description.substring(0, 50)}...` 
                                : event.description
                              }
                            </span>
                          ) : (
                            <span className="text-muted">No description</span>
                          )}
                        </td>
                        <td>
                          {canManage && (
                            <div className="d-flex gap-1">
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setEditingEvent(event)
                                  setShowForm(true)
                                }}
                                title="Edit Event"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setDeletingEvent(event)
                                  setShowDeleteConfirm(true)
                                }}
                                title="Delete Event"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
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
    </Container>
  )
}
