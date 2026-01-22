import { useEffect, useState } from 'react'
import { getEvents, createEvent, updateEvent, deleteEvent } from '../../services/events.service'
import type { Event, CreateEventPayload } from '../../services/events.service'
import { Calendar, MapPin, Plus, Edit, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import EventFormModal from '../events/EventFormModal'
import ConfirmModal from '../modals/ConfirmModal'

export default function UpcomingEvents() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true)
        const response = await getEvents(true) // Get upcoming events only
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
    fetchEvents()
  }, [])

  const handleCreateEvent = async (values: CreateEventPayload) => {
    try {
      const response = await createEvent(values)
      if (response.success) {
        // Optimistically update the events list
        setEvents(prev => prev ? [response.data, ...prev] : [response.data])
        setShowForm(false)
      } else {
        setError(response.message || 'Failed to create event')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to create event')
    }
  }

  const handleUpdateEvent = async (values: CreateEventPayload) => {
    if (!editingEvent) return
    
    try {
      const response = await updateEvent(editingEvent.id, values)
      if (response.success) {
        // Optimistically update the events list
        setEvents(prev => prev ? prev.map(event => 
          event.id === editingEvent.id ? response.data : event
        ) : [response.data])
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
        // Optimistically update the events list
        setEvents(prev => prev ? prev.filter(event => event.id !== deletingEvent.id) : [])
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
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow'
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  if (loading) {
    return (
      <div className="col-span-12 lg:col-span-4">
        <div className="card-modern p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-brand-primary">Upcoming Events</h5>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="col-span-12 lg:col-span-4">
        <div className="card-modern p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-brand-primary">Upcoming Events</h5>
          <div className="text-red-600 text-center py-8">Error: {error}</div>
        </div>
      </div>
    )
  }

  if (!events || events.length === 0) {
    return (
      <div className="col-span-12 lg:col-span-4">
        <div className="card-modern p-4 flex flex-col">
          <h5 className="mb-4 font-semibold text-brand-primary">Upcoming Events</h5>
          <div className="text-gray-500 text-center py-8">No upcoming events</div>
        </div>
      </div>
    )
  }

  return (
    <div className="col-span-12 lg:col-span-4">
      <div className="card-modern p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h5 className="font-semibold text-brand-primary">Upcoming Events</h5>
          <button
            onClick={() => setShowForm(true)}
            className="p-2 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
            style={{
              backgroundColor: 'transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
            title="Add Event"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        
        {error && (
          <div 
            className="mb-4 p-3 text-red-600 dark:text-red-400 rounded-lg text-sm"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
            }}
          >
            {error}
          </div>
        )}
        
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {events?.slice(0, 5).map((event) => (
            <div 
              key={event.id} 
              className="p-3 border rounded-xl transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-surface)'
              }}
            >
              <div className="flex items-start justify-between mb-2">
                <h6 className="font-medium text-sm flex-1 text-brand-primary">{event.title}</h6>
                <div className="flex gap-1 ml-2">
                  <button
                    onClick={() => {
                      setEditingEvent(event)
                      setShowForm(true)
                    }}
                    className="p-1 text-blue-600 dark:text-blue-400 rounded-xl transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title="Edit Event"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      setDeletingEvent(event)
                      setShowDeleteConfirm(true)
                    }}
                    className="p-1 text-red-600 dark:text-red-400 rounded-xl transition-colors"
                    style={{
                      backgroundColor: 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--color-border-light)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                    title="Delete Event"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-brand-muted">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{event.location}</span>
                </div>
                {event.description && (
                  <p className="text-xs text-brand-muted mt-2 line-clamp-2">{event.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {events && events.length > 5 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button 
              onClick={() => navigate('/events')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              View All Events ({events.length})
            </button>
          </div>
        )}
      </div>

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
