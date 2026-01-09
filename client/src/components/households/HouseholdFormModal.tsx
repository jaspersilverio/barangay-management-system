import { useEffect, useState } from 'react'
import { Modal, Button, Form } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import { listResidents } from '../../services/residents.service'
import type { Resident } from '../../types'

// Dynamic schema based on user role
const createSchema = (isPurokLeader: boolean) => z.object({
  address: z.string().min(1, 'Address is required'),
  property_type: z.string().min(1, 'Property type is required'),
  head_resident_id: z.union([z.string().min(1, 'Head resident is required'), z.number().min(1, 'Head resident is required')]),
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
  const [residents, setResidents] = useState<Resident[]>([])
  const [loadingResidents, setLoadingResidents] = useState(false)
  const [residentSearchTerm, setResidentSearchTerm] = useState('')
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)

  // Determine if user is a purok leader
  const isPurokLeader = user?.role === 'purok_leader'
  const assignedPurokId = user?.assigned_purok_id

  const schema = createSchema(isPurokLeader)
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<HouseholdFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      address: '',
      property_type: '',
      head_resident_id: '',
      contact: '',
      purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : '',
      ...initial,
    },
  })

  // Load residents for head selection
  useEffect(() => {
    if (show) {
      loadResidents()
      if (initial?.head_resident_id) {
        // If editing, find and set the selected resident
        const residentId = typeof initial.head_resident_id === 'string' ? parseInt(initial.head_resident_id) : initial.head_resident_id
        loadResidents().then(() => {
          const resident = residents.find(r => r.id === residentId)
          if (resident) {
            setSelectedResident(resident)
            setResidentSearchTerm(resident.full_name || `${resident.first_name} ${resident.last_name}`)
          }
        })
      }
    } else {
      setResidents([])
      setResidentSearchTerm('')
      setSelectedResident(null)
    }
  }, [show, initial])

  const loadResidents = async () => {
    setLoadingResidents(true)
    try {
      const response = await listResidents({ per_page: 1000 })
      if (response.success) {
        const residentsList = response.data.data || response.data
        setResidents(Array.isArray(residentsList) ? residentsList : [])
      }
    } catch (error) {
      console.error('Error loading residents:', error)
    } finally {
      setLoadingResidents(false)
    }
  }

  const filteredResidents = residents.filter(resident => {
    if (!residentSearchTerm.trim()) return true
    const fullName = `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.toLowerCase()
    return fullName.includes(residentSearchTerm.toLowerCase())
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
            <Form.Label className="modal-form-label">Head of Household (Select Existing Resident) *</Form.Label>
            <div className="position-relative">
              <Form.Control
                type="text"
                placeholder="Search for a resident..."
                value={residentSearchTerm}
                onChange={(e) => {
                  setResidentSearchTerm(e.target.value)
                  if (selectedResident) {
                    setSelectedResident(null)
                    setValue('head_resident_id', '')
                  }
                }}
                onFocus={() => {
                  if (!residentSearchTerm && residents.length === 0) {
                    loadResidents()
                  }
                }}
                isInvalid={!!errors.head_resident_id}
                className="modal-form-control"
              />
              {residentSearchTerm && filteredResidents.length > 0 && !selectedResident && (
                <div className="position-absolute w-100 bg-white border rounded-bottom" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                  {filteredResidents.map((resident) => (
                    <div
                      key={resident.id}
                      className="px-3 py-2 cursor-pointer"
                      style={{ cursor: 'pointer' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                      onClick={() => {
                        setSelectedResident(resident)
                        setResidentSearchTerm(resident.full_name || `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim())
                        setValue('head_resident_id', resident.id)
                      }}
                    >
                      <div className="fw-medium">{resident.full_name || `${resident.first_name} ${resident.last_name}`}</div>
                      {resident.household && (
                        <small className="text-muted">
                          {resident.household.address} • {resident.relationship_to_head || 'Unassigned'}
                        </small>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <input type="hidden" {...register('head_resident_id')} />
            </div>
            {selectedResident && (
              <Form.Text className="text-success d-block mt-1">
                Selected: {selectedResident.full_name || `${selectedResident.first_name} ${selectedResident.last_name}`}
              </Form.Text>
            )}
            <Form.Control.Feedback type="invalid">{errors.head_resident_id?.message}</Form.Control.Feedback>
            <Form.Text className="text-muted">
              The head must be an existing resident. Create the resident first if they don't exist.
            </Form.Text>
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


