import { useEffect } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

// Dynamic schema based on user role
const createSchema = (isPurokLeader: boolean) => z.object({
  address: z.string().min(1, 'Address is required'),
  property_type: z.string().min(1, 'Property type is required'),
  head_name: z.string().min(1, 'Head of household is required'),
  contact: z.string().min(1, 'Contact is required'),
  purok_id: isPurokLeader 
    ? z.string().optional() // Optional for purok leaders (auto-assigned)
    : z.string().min(1, 'Purok is required'), // Required for others
})

export type HouseholdFormValues = z.infer<ReturnType<typeof createSchema>>

type Props = {
  show: boolean
  initial?: Partial<HouseholdFormValues>
  onSubmit: (values: HouseholdFormValues) => Promise<void>
  onHide: () => void
}

export default function HouseholdFormModal({ show, initial, onSubmit, onHide }: Props) {
  const { puroks } = usePuroks()
  const { user } = useAuth()

  // Determine if user is a purok leader
  const isPurokLeader = user?.role === 'purok_leader'
  const assignedPurokId = user?.assigned_purok_id

  const schema = createSchema(isPurokLeader)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<HouseholdFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: '',
      property_type: '',
      head_name: '',
      contact: '',
      purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : '',
      ...initial,
    },
  })

  useEffect(() => { 
    const newInitial = {
      ...initial,
      purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : initial?.purok_id || '',
    }
    reset(newInitial) 
  }, [initial, reset, isPurokLeader, assignedPurokId])

  return (
    <Modal show={show} onHide={onHide} centered>
      <Form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            {initial ? 'Edit Household' : 'Add Household'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Address</Form.Label>
            <Form.Control 
              placeholder="Enter complete address" 
              {...register('address')} 
              isInvalid={!!errors.address}
              className="modal-form-control"
            />
            <Form.Control.Feedback type="invalid">{errors.address?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Purok</Form.Label>
            {isPurokLeader ? (
              <>
                <Form.Control
                  type="text"
                  value={puroks.find(p => p.id === assignedPurokId)?.name || 'Your Assigned Purok'}
                  disabled
                  className="modal-form-control"
                />
                <Form.Text className="text-muted">
                  You can only manage households in your assigned purok.
                </Form.Text>
                {/* Hidden input to include purok_id in form submission */}
                <input type="hidden" {...register('purok_id')} defaultValue={assignedPurokId ? String(assignedPurokId) : ''} />
              </>
            ) : (
              <>
                <Form.Select 
                  {...register('purok_id')} 
                  isInvalid={!!errors.purok_id}
                  className="modal-form-control"
                >
                  <option value="">Select purok</option>
                  {puroks.map((purok) => (
                    <option key={purok.id} value={purok.id}>
                      {purok.name}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.purok_id?.message}</Form.Control.Feedback>
              </>
            )}
          </Form.Group>
          
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Property Type</Form.Label>
            <Form.Select {...register('property_type')} isInvalid={!!errors.property_type} className="modal-form-control">
              <option value="">Select property type</option>
              <option value="house">House</option>
              <option value="apartment">Apartment</option>
              <option value="condominium">Condominium</option>
              <option value="shanty">Shanty</option>
              <option value="commercial">Commercial</option>
              <option value="other">Other</option>
            </Form.Select>
            <Form.Control.Feedback type="invalid">{errors.property_type?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Head of Household</Form.Label>
            <Form.Control 
              placeholder="Enter head of household name" 
              {...register('head_name')} 
              isInvalid={!!errors.head_name}
              className="modal-form-control"
            />
            <Form.Control.Feedback type="invalid">{errors.head_name?.message}</Form.Control.Feedback>
          </Form.Group>
          
          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Contact</Form.Label>
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
            {isSubmitting ? (initial ? 'Updating...' : 'Creating...') : (initial ? 'Update Household' : 'Create Household')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}


