import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'

const schema = z.object({
  name: z.string().min(1, 'Purok Name is required'),
  captain: z.string().min(1, 'Purok Leader is required'),
  contact: z.string().min(1, 'Leader Contact is required'),
})

export type PurokFormValues = z.infer<typeof schema>

type Props = {
  show: boolean
  initial?: Partial<PurokFormValues>
  onSubmit: (values: PurokFormValues) => Promise<void>
  onHide: () => void
}

export default function PurokFormModal({ show, initial, onSubmit, onHide }: Props) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PurokFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', captain: '', contact: '', ...initial },
  })

  useEffect(() => { reset(initial) }, [initial, reset])

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">{initial ? 'Edit Purok' : 'Add Purok'}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Purok Name</Form.Label>
            <Form.Control 
              placeholder="Enter purok name" 
              {...register('name')} 
              isInvalid={!!errors.name}
              className="modal-form-control"
            />
            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Purok Leader</Form.Label>
            <Form.Control 
              placeholder="Enter leader name" 
              {...register('captain')} 
              isInvalid={!!errors.captain}
              className="modal-form-control"
            />
            <Form.Control.Feedback type="invalid">{errors.captain?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Leader Contact</Form.Label>
            <Form.Control 
              placeholder="Enter contact number" 
              {...register('contact')} 
              isInvalid={!!errors.contact}
              className="modal-form-control"
            />
            <Form.Control.Feedback type="invalid">{errors.contact?.message}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={onHide} className="btn-brand-secondary">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting} className="btn-brand-primary">
            <i className="fas fa-save me-1"></i>
            {isSubmitting ? (initial ? 'Updating...' : 'Creating...') : (initial ? 'Update Purok' : 'Create Purok')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}


