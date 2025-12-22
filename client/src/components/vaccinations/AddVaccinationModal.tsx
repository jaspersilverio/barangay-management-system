import { useState, useEffect, useRef } from 'react'
import { Modal, Form, Button, Row, Col, Alert, ListGroup } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createVaccination, updateVaccination, COMMON_VACCINES, COMMON_DOSE_NUMBERS, VACCINATION_STATUSES } from '../../services/vaccination.service'
import { listResidents } from '../../services/residents.service'
import type { Vaccination, VaccinationPayload, Resident } from '../../types'

const vaccinationSchema = z.object({
  resident_id: z.number().min(1, 'Resident is required'),
  vaccine_name: z.string().min(1, 'Vaccine name is required').max(255, 'Vaccine name must not exceed 255 characters'),
  dose_number: z.string().min(1, 'Dose number is required').max(50, 'Dose number must not exceed 50 characters'),
  date_administered: z.string().min(1, 'Date administered is required'),
  next_due_date: z.string().optional(),
  status: z.enum(['Completed', 'Pending', 'Scheduled'], {
    required_error: 'Status is required'
  }),
  administered_by: z.string().max(255, 'Administered by must not exceed 255 characters').optional()
}).refine((data) => {
  if (data.next_due_date && data.date_administered) {
    return new Date(data.next_due_date) > new Date(data.date_administered)
  }
  return true
}, {
  message: 'Next due date must be after the date administered',
  path: ['next_due_date']
})

type VaccinationFormData = z.infer<typeof vaccinationSchema>

interface AddVaccinationModalProps {
  show: boolean
  onHide: () => void
  onSuccess: () => void
  residentId?: number
  vaccination?: Vaccination | null
  residentName?: string
}

export default function AddVaccinationModal({ 
  show, 
  onHide, 
  onSuccess, 
  residentId, 
  vaccination, 
  residentName 
}: AddVaccinationModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showVaccineDropdown, setShowVaccineDropdown] = useState(false)
  const [filteredVaccines, setFilteredVaccines] = useState<string[]>(COMMON_VACCINES)
  const [residents, setResidents] = useState<Resident[]>([])
  const [loadingResidents, setLoadingResidents] = useState(false)
  const [showResidentDropdown, setShowResidentDropdown] = useState(false)
  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([])
  const [selectedResident, setSelectedResident] = useState<Resident | null>(null)
  const [residentSearchTerm, setResidentSearchTerm] = useState('')
  const vaccineInputRef = useRef<HTMLInputElement>(null)
  const residentInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<VaccinationFormData>({
    resolver: zodResolver(vaccinationSchema),
    defaultValues: {
      resident_id: residentId || 0,
      vaccine_name: '',
      dose_number: '',
      date_administered: '',
      next_due_date: '',
      status: 'Completed',
      administered_by: ''
    }
  })

  // Manually register the vaccine_name field
  useEffect(() => {
    register('vaccine_name', { required: 'Vaccine name is required' })
  }, [register])

  // Load residents if no specific resident is provided
  useEffect(() => {
    if (!residentId && !vaccination) {
      loadResidents()
    }
  }, [residentId, vaccination])

  const loadResidents = async () => {
    try {
      setLoadingResidents(true)
      const response = await listResidents({ per_page: 1000 }) // Load more residents
      if (response.success) {
        const residentsList = response.data.data || response.data
        setResidents(residentsList)
        setFilteredResidents(residentsList)
      }
    } catch (err) {
      console.error('Error loading residents:', err)
    } finally {
      setLoadingResidents(false)
    }
  }

  // Filter residents based on search
  const filterResidents = (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredResidents(residents)
    } else {
      const filtered = residents.filter(resident => {
        const fullName = `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.toLowerCase()
        return fullName.includes(searchTerm.toLowerCase())
      })
      setFilteredResidents(filtered)
    }
  }

  // Handle resident selection from dropdown
  const handleResidentSelect = (resident: Resident) => {
    setSelectedResident(resident)
    setResidentSearchTerm(`${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim())
    setValue('resident_id', resident.id)
    setShowResidentDropdown(false)
  }

  // Handle resident input change
  const handleResidentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value
    setResidentSearchTerm(searchTerm)
    filterResidents(searchTerm)
    setShowResidentDropdown(true)
    
    // Clear selection if user is typing
    if (selectedResident) {
      setSelectedResident(null)
      setValue('resident_id', 0)
    }
  }

  // Handle resident input focus
  const handleResidentInputFocus = () => {
    setShowResidentDropdown(true)
  }

  const watchedDateAdministered = watch('date_administered')
  const watchedVaccineName = watch('vaccine_name')

  // Filter vaccines based on input
  useEffect(() => {
    if (watchedVaccineName) {
      const filtered = COMMON_VACCINES.filter(vaccine =>
        vaccine.toLowerCase().includes(watchedVaccineName.toLowerCase())
      )
      setFilteredVaccines(filtered)
    } else {
      setFilteredVaccines(COMMON_VACCINES)
    }
  }, [watchedVaccineName])

  // Handle vaccine selection from dropdown
  const handleVaccineSelect = (vaccine: string) => {
    setValue('vaccine_name', vaccine)
    setShowVaccineDropdown(false)
  }

  // Handle vaccine input focus
  const handleVaccineInputFocus = () => {
    setShowVaccineDropdown(true)
  }

  // Handle vaccine input change
  const handleVaccineInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue('vaccine_name', e.target.value)
    setShowVaccineDropdown(true)
  }

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vaccineInputRef.current && !vaccineInputRef.current.contains(event.target as Node)) {
        setShowVaccineDropdown(false)
      }
      if (residentInputRef.current && !residentInputRef.current.contains(event.target as Node)) {
        setShowResidentDropdown(false)
      }
    }

    if (showVaccineDropdown || showResidentDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showVaccineDropdown, showResidentDropdown])

  useEffect(() => {
    if (vaccination) {
      setValue('resident_id', vaccination.resident_id)
      setValue('vaccine_name', vaccination.vaccine_name)
      setValue('dose_number', vaccination.dose_number)
      setValue('date_administered', vaccination.date_administered)
      setValue('next_due_date', vaccination.next_due_date || '')
      setValue('status', vaccination.status)
      setValue('administered_by', vaccination.administered_by || '')
    } else {
      reset({
        resident_id: residentId || 0,
        vaccine_name: '',
        dose_number: '',
        date_administered: '',
        next_due_date: '',
        status: 'Completed',
        administered_by: ''
      })
    }
  }, [vaccination, residentId, setValue, reset])

  const onSubmit = async (data: VaccinationFormData) => {
    setLoading(true)
    setError(null)

    try {
      const payload: VaccinationPayload = {
        ...data,
        next_due_date: data.next_due_date || null,
        administered_by: data.administered_by || null
      }

      if (vaccination) {
        await updateVaccination(vaccination.id, payload)
      } else {
        await createVaccination(payload)
      }

      onSuccess()
      onHide()
    } catch (err: any) {
      console.error('Error saving vaccination:', err)
      if (err.response?.data?.message) {
        setError(err.response.data.message)
      } else if (err.response?.data?.errors) {
        const errorMessages = Object.values(err.response.data.errors).flat()
        setError(errorMessages.join(', '))
      } else {
        setError('Failed to save vaccination record. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Add form validation error handler
  const onError = () => {
    setError('Please fix the form errors before submitting.')
  }

  const handleClose = () => {
    reset()
    setError(null)
    setShowVaccineDropdown(false)
    setShowResidentDropdown(false)
    setSelectedResident(null)
    setResidentSearchTerm('')
    onHide()
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title className="modal-title-custom text-brand-primary">
          {vaccination ? 'Edit Vaccination Record' : 'Add Vaccination Record'}
          {residentName && (
            <div className="text-brand-muted small mt-1">
              Resident: {residentName}
            </div>
          )}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit(onSubmit, onError)}>
        <Modal.Body className="modal-body-custom">
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          {/* Resident Selector - only show if no specific resident is provided */}
          {!residentId && !vaccination && (
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Resident *</Form.Label>
                  <div ref={residentInputRef} className="position-relative">
                    <Form.Control
                      type="text"
                      placeholder={loadingResidents ? 'Loading residents...' : 'Type or select a resident'}
                      value={residentSearchTerm}
                      onChange={handleResidentInputChange}
                      onFocus={handleResidentInputFocus}
                      isInvalid={!!errors.resident_id}
                      disabled={loadingResidents}
                      autoComplete="off"
                    />
                    {showResidentDropdown && filteredResidents.length > 0 && (
                      <div className="position-absolute w-100" style={{ zIndex: 1050, top: '100%' }}>
                        <ListGroup className="border rounded shadow" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                          {filteredResidents.map((resident) => (
                            <ListGroup.Item
                              key={resident.id}
                              action
                              onClick={() => handleResidentSelect(resident)}
                              className="cursor-pointer"
                              style={{ cursor: 'pointer' }}
                            >
                              <div>
                                <strong>{resident.first_name} {resident.middle_name} {resident.last_name}</strong>
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      </div>
                    )}
                  </div>
                  <Form.Control.Feedback type="invalid">
                    {errors.resident_id?.message}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>
          )}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Vaccine Name *</Form.Label>
                <div ref={vaccineInputRef} className="position-relative">
                  <Form.Control
                    type="text"
                    placeholder="Type or select a vaccine"
                    name="vaccine_name"
                    value={watchedVaccineName || ''}
                    onChange={handleVaccineInputChange}
                    onFocus={handleVaccineInputFocus}
                    isInvalid={!!errors.vaccine_name}
                    autoComplete="off"
                  />
                  {showVaccineDropdown && filteredVaccines.length > 0 && (
                    <div className="position-absolute w-100" style={{ zIndex: 1050, top: '100%' }}>
                      <ListGroup className="border rounded shadow" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredVaccines.map((vaccine) => (
                          <ListGroup.Item
                            key={vaccine}
                            action
                            onClick={() => handleVaccineSelect(vaccine)}
                            className="cursor-pointer"
                            style={{ cursor: 'pointer' }}
                          >
                            {vaccine}
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                </div>
                <Form.Control.Feedback type="invalid">
                  {errors.vaccine_name?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Dose Number *</Form.Label>
                <Form.Control
                  as="select"
                  {...register('dose_number')}
                  isInvalid={!!errors.dose_number}
                >
                  <option value="">Select dose number</option>
                  {COMMON_DOSE_NUMBERS.map((dose) => (
                    <option key={dose} value={dose}>
                      {dose}
                    </option>
                  ))}
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors.dose_number?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Date Administered *</Form.Label>
                <Form.Control
                  type="date"
                  max={today}
                  {...register('date_administered')}
                  isInvalid={!!errors.date_administered}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.date_administered?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Next Due Date</Form.Label>
                <Form.Control
                  type="date"
                  min={watchedDateAdministered}
                  {...register('next_due_date')}
                  isInvalid={!!errors.next_due_date}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.next_due_date?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Status *</Form.Label>
                <Form.Control
                  as="select"
                  {...register('status')}
                  isInvalid={!!errors.status}
                >
                  {VACCINATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Form.Control>
                <Form.Control.Feedback type="invalid">
                  {errors.status?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Administered By</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Name of healthcare provider"
                  {...register('administered_by')}
                  isInvalid={!!errors.administered_by}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.administered_by?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={handleClose} disabled={loading} className="btn-brand-secondary">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="btn-brand-primary">
            <i className="fas fa-save me-1"></i>
            {loading ? 'Saving...' : (vaccination ? 'Update' : 'Add')} Vaccination
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
