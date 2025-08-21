import { useEffect } from 'react'
import { Modal, Button, Form, Row, Col, InputGroup } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePuroks } from '../../context/PurokContext'
import { useState } from 'react'

const schema = z.object({
  purok_id: z.union([z.string(), z.number()]),
  household_code: z.string().optional(),
  head_name: z.string().min(1, 'Head name is required'),
  address: z.string().min(1, 'Address is required'),
  landmark: z.string().optional(),
  latitude: z.union([z.string(), z.number()]).optional(),
  longitude: z.union([z.string(), z.number()]).optional(),
})

export type HouseholdFormValues = z.infer<typeof schema>

type Props = {
  show: boolean
  initial?: Partial<HouseholdFormValues>
  isAdmin: boolean
  defaultPurokId?: number | null
  onSubmit: (values: HouseholdFormValues) => Promise<void>
  onHide: () => void
}

export default function HouseholdFormModal({ show, initial, isAdmin, defaultPurokId, onSubmit, onHide }: Props) {
  const { puroks, refresh } = usePuroks()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<HouseholdFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      purok_id: defaultPurokId ?? '',
      household_code: '',
      head_name: '',
      address: '',
      landmark: '',
      latitude: '',
      longitude: '',
      ...initial,
    },
  })

  useEffect(() => { refresh().catch(() => null) }, [refresh])
  useEffect(() => { reset({ ...initial, purok_id: initial?.purok_id ?? (defaultPurokId ?? '') } as any) }, [initial, defaultPurokId, reset])

  function generateHouseholdCode() {
    const code = `HH-${Date.now().toString().slice(-6)}`
    reset((prev) => ({ ...prev, household_code: code }))
  }

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>{initial ? 'Edit Household' : 'Add Household'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Purok</Form.Label>
                <Form.Select {...register('purok_id')} disabled={!isAdmin} isInvalid={!!errors.purok_id}>
                  <option value="">Select Purok</option>
                  {puroks.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
                </Form.Select>
                <Form.Control.Feedback type="invalid">Purok is required</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Household Code</Form.Label>
                <InputGroup>
                  <Form.Control placeholder="Auto-generate if blank" {...register('household_code')} />
                  <Button variant="secondary" type="button" onClick={generateHouseholdCode}>Generate</Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Head Name</Form.Label>
            <Form.Control {...register('head_name')} isInvalid={!!errors.head_name} />
            <Form.Control.Feedback type="invalid">{errors.head_name?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Address</Form.Label>
            <Form.Control {...register('address')} isInvalid={!!errors.address} />
            <Form.Control.Feedback type="invalid">{errors.address?.message}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Landmark</Form.Label>
            <Form.Control {...register('landmark')} />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Photo</Form.Label>
            <Form.Control type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const url = URL.createObjectURL(file)
                setPhotoPreview(url)
              } else {
                setPhotoPreview(null)
              }
            }} />
            {photoPreview && (
              <div className="mt-2">
                <img src={photoPreview} alt="Preview" style={{ maxWidth: '100%', borderRadius: 8 }} />
              </div>
            )}
          </Form.Group>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Latitude</Form.Label>
                <Form.Control type="number" step="0.0000001" {...register('latitude')} />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Longitude</Form.Label>
                <Form.Control type="number" step="0.0000001" {...register('longitude')} />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>Cancel</Button>
          <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}


