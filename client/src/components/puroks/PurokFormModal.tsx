import { Modal, Button, Form, Row, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect } from 'react'

const schema = z.object({
  code: z.string().min(1, 'Code is required'),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  centroid_lat: z.union([z.string(), z.number()]).optional(),
  centroid_lng: z.union([z.string(), z.number()]).optional(),
  boundary_geojson: z.string().optional(),
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
    defaultValues: { code: '', name: '', description: '', boundary_geojson: '', ...initial },
  })

  useEffect(() => { reset(initial) }, [initial, reset])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{initial ? 'Edit Purok' : 'Add Purok'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Code</Form.Label>
                <Form.Control {...register('code')} isInvalid={!!errors.code} />
                <Form.Control.Feedback type="invalid">{errors.code?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Name</Form.Label>
                <Form.Control {...register('name')} isInvalid={!!errors.name} />
                <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} {...register('description')} />
          </Form.Group>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Centroid Lat</Form.Label>
                <Form.Control type="number" step="0.0000001" {...register('centroid_lat')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Centroid Lng</Form.Label>
                <Form.Control type="number" step="0.0000001" {...register('centroid_lng')} />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Boundary GeoJSON</Form.Label>
            <Form.Control as="textarea" rows={4} placeholder="Paste GeoJSON here" {...register('boundary_geojson')} />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}


