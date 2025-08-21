import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'

const schema = z.object({
  name: z.string().min(1, 'Purok Name is required'),
  captain: z.string().min(1, 'Purok Captain is required'),
  contact: z.string().min(1, 'Captain Contact is required'),
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
        <Modal.Header closeButton>
          <Modal.Title>{initial ? 'Edit Purok' : 'Add Purok'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Purok Name</Form.Label>
            <Form.Control 
              placeholder="Enter purok name" 
              {...register('name')} 
              isInvalid={!!errors.name} 
            />
            <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Purok Captain</Form.Label>
            <Form.Control 
              placeholder="Enter captain name" 
              {...register('captain')} 
              isInvalid={!!errors.captain} 
            />
            <Form.Control.Feedback type="invalid">{errors.captain?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Captain Contact</Form.Label>
            <Form.Control 
              placeholder="Enter contact number" 
              {...register('contact')} 
              isInvalid={!!errors.contact} 
            />
            <Form.Control.Feedback type="invalid">{errors.contact?.message}</Form.Control.Feedback>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create Purok'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}


