import React from 'react'
import { Modal, Form, Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Event, CreateEventPayload } from '../../services/events.service'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
  purok_id: z.string().optional(),
})

type FormValues = {
  title: string
  date: string
  location: string
  description?: string
  purok_id: string
}

type Props = {
  show: boolean
  initial?: Event
  onSubmit: (values: FormValues) => Promise<void>
  onHide: () => void
}

export default function EventFormModal({ show, initial, onSubmit, onHide }: Props) {
  const { puroks } = usePuroks()
  const { user } = useAuth()

  // Determine if user is a purok leader
  const isPurokLeader = user?.role === 'purok_leader'
  const assignedPurokId = user?.assigned_purok_id

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initial?.title || '',
      date: initial?.date || '',
      location: initial?.location || '',
      description: initial?.description || '',
      purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : (initial?.purok_id ? String(initial.purok_id) : ''),
    },
  })

  const handleFormSubmit = async (values: any) => {
    try {
      // Convert purok_id to number or null
      const formData: FormValues = {
        ...values,
        purok_id: values.purok_id ? Number(values.purok_id) : null,
      }
      await onSubmit(formData)
      reset()
    } catch (error) {
      // Error handling is done in parent component
    }
  }

  const handleHide = () => {
    reset()
    onHide()
  }

  return (
    <Modal show={show} onHide={handleHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{initial ? 'Edit Event' : 'Add New Event'}</Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Event Title</Form.Label>
            <Form.Control
              {...register('title')}
              type="text"
              placeholder="Enter event title"
              isInvalid={!!errors.title}
            />
            <Form.Control.Feedback type="invalid">{errors.title?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Date</Form.Label>
            <Form.Control
              {...register('date')}
              type="date"
              isInvalid={!!errors.date}
            />
            <Form.Control.Feedback type="invalid">{errors.date?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              {...register('location')}
              type="text"
              placeholder="Enter event location"
              isInvalid={!!errors.location}
            />
            <Form.Control.Feedback type="invalid">{errors.location?.message}</Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Description (Optional)</Form.Label>
            <Form.Control
              {...register('description')}
              as="textarea"
              rows={3}
              placeholder="Enter event description"
            />
          </Form.Group>

          {!isPurokLeader && (
            <Form.Group className="mb-3">
              <Form.Label>Purok (Optional - Leave blank for barangay-wide event)</Form.Label>
              <Form.Select {...register('purok_id')}>
                <option value="">Barangay-wide Event</option>
                {puroks.map((purok) => (
                  <option key={purok.id} value={purok.id}>
                    {purok.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          )}

          {isPurokLeader && (
            <Form.Group className="mb-3">
              <Form.Label>Purok</Form.Label>
              <Form.Control
                type="text"
                value={puroks.find(p => p.id === assignedPurokId)?.name || 'Your Assigned Purok'}
                disabled
              />
              <Form.Text className="text-muted">
                Events will be automatically assigned to your purok.
              </Form.Text>
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleHide}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : initial ? 'Update Event' : 'Create Event'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
