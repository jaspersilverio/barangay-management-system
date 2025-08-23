import React from 'react'
import { Modal, Form, Button } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Event, CreateEventPayload } from '../../services/events.service'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  date: z.string().min(1, 'Date is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
})

type FormValues = CreateEventPayload

type Props = {
  show: boolean
  initial?: Event
  onSubmit: (values: FormValues) => Promise<void>
  onHide: () => void
}

export default function EventFormModal({ show, initial, onSubmit, onHide }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      date: '',
      location: '',
      description: '',
      ...initial,
    },
  })

  const handleFormSubmit = async (values: FormValues) => {
    try {
      await onSubmit(values)
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
