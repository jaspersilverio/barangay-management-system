import { useEffect, useState } from 'react'
import { Modal, Button, Form, Alert, Row, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import Select from 'react-select'
import { listResidents } from '../../services/residents.service'

const schema = z.object({
  resident_id: z.string().min(1, 'Resident is required'),
  eligibility_reason: z.enum([
    'death_of_spouse',
    'abandonment',
    'legally_separated',
    'unmarried_parent',
    'spouse_incapacitated'
  ], {
    required_error: 'Eligibility reason is required',
  }),
  date_declared: z.string().min(1, 'Date declared is required'),
  valid_until: z.string().min(1, 'Valid until date is required'),
  verification_date: z.string().optional(),
  verified_by: z.string().optional(),
}).refine((data) => {
  if (data.valid_until && data.date_declared) {
    return new Date(data.valid_until) > new Date(data.date_declared)
  }
  return true
}, {
  message: 'Valid until date must be after date declared',
  path: ['valid_until'],
})

export type SoloParentFormValues = z.infer<typeof schema>

type ResidentOption = {
  id: number
  label: string
  value: number
  first_name: string
  middle_name?: string
  last_name: string
  age: number
  household?: {
    head_name: string
    purok?: { name: string }
  }
}

type Props = {
  show: boolean
  initial?: Partial<SoloParentFormValues>
  onSubmit: (values: SoloParentFormValues) => Promise<void>
  onHide: () => void
}

export default function SoloParentFormModal({ show, initial, onSubmit, onHide }: Props) {
  const [residents, setResidents] = useState<ResidentOption[]>([])
  const [loadingResidents, setLoadingResidents] = useState(false)
  const [selectedResident, setSelectedResident] = useState<ResidentOption | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<SoloParentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      resident_id: '',
      eligibility_reason: 'unmarried_parent',
      date_declared: new Date().toISOString().split('T')[0],
      valid_until: '',
      verification_date: '',
      verified_by: '',
      ...initial,
    },
  })

  const dateDeclared = watch('date_declared')

  // Calculate default valid_until (1 year from date_declared)
  useEffect(() => {
    if (dateDeclared && !initial?.valid_until) {
      const declaredDate = new Date(dateDeclared)
      const validUntilDate = new Date(declaredDate)
      validUntilDate.setFullYear(validUntilDate.getFullYear() + 1)
      setValue('valid_until', validUntilDate.toISOString().split('T')[0])
    }
  }, [dateDeclared, initial?.valid_until, setValue])

  // Load residents for dropdown
  const loadResidents = async (search?: string) => {
    setLoadingResidents(true)
    try {
      const response = await listResidents({ 
        search, 
        per_page: 50 
      })
      if (response.success && response.data?.data) {
        const options: ResidentOption[] = response.data.data.map((resident: any) => ({
          id: resident.id,
          value: resident.id,
          label: `${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim() + 
                 (resident.age ? ` (Age: ${resident.age})` : '') +
                 (resident.household?.head_name ? ` - ${resident.household.head_name}` : ''),
          first_name: resident.first_name,
          middle_name: resident.middle_name,
          last_name: resident.last_name,
          age: resident.age || 0,
          household: resident.household,
        }))
        setResidents(options)
      }
    } catch (error) {
      console.error('Error loading residents:', error)
    } finally {
      setLoadingResidents(false)
    }
  }

  // Load residents when modal opens
  useEffect(() => {
    if (show) {
      loadResidents()
      setError(null)
    }
  }, [show])

  // Handle resident selection
  const handleResidentChange = (option: ResidentOption | null) => {
    setSelectedResident(option)
    if (option) {
      setValue('resident_id', option.id.toString())
    } else {
      setValue('resident_id', '')
    }
  }

  // Reset form when initial values change
  useEffect(() => {
    if (show) {
      const defaultValues: SoloParentFormValues = {
        resident_id: initial?.resident_id || '',
        eligibility_reason: initial?.eligibility_reason || 'unmarried_parent',
        date_declared: initial?.date_declared || new Date().toISOString().split('T')[0],
        valid_until: initial?.valid_until || '',
        verification_date: initial?.verification_date || '',
        verified_by: initial?.verified_by || '',
      }
      reset(defaultValues)

      // Set selected resident if initial resident_id exists
      if (initial?.resident_id) {
        const resident = residents.find(r => r.id.toString() === initial.resident_id)
        if (resident) {
          setSelectedResident(resident)
        } else {
          // Load residents to find the initial one
          loadResidents()
        }
      } else {
        setSelectedResident(null)
      }
    }
  }, [initial, show, reset, residents])

  const handleFormSubmit = async (values: SoloParentFormValues) => {
    try {
      setError(null)
      await onSubmit(values)
      reset()
      setSelectedResident(null)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'An error occurred'
      setError(errorMessage)
    }
  }

  const eligibilityReasons = [
    { value: 'death_of_spouse', label: 'Death of Spouse' },
    { value: 'abandonment', label: 'Abandonment' },
    { value: 'legally_separated', label: 'Legally Separated' },
    { value: 'unmarried_parent', label: 'Unmarried Parent' },
    { value: 'spouse_incapacitated', label: 'Spouse Incapacitated' },
  ]

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit(handleFormSubmit)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            {initial ? 'Edit Solo Parent' : 'Register Solo Parent'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Resident *</Form.Label>
            <Select
              value={selectedResident}
              onChange={handleResidentChange}
              options={residents}
              getOptionLabel={(option) => option.label}
              getOptionValue={(option) => option.id.toString()}
              placeholder="Search for a resident..."
              isLoading={loadingResidents}
              isClearable
              isSearchable
              noOptionsMessage={() => "No residents found"}
              isDisabled={!!initial} // Disable if editing
              onInputChange={(newValue) => {
                if (newValue.length >= 2) {
                  loadResidents(newValue)
                }
              }}
              styles={{
                control: (provided) => ({
                  ...provided,
                  borderColor: errors.resident_id ? '#dc3545' : provided.borderColor,
                }),
              }}
            />
            {errors.resident_id && (
              <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                {errors.resident_id.message}
              </div>
            )}
            {initial && (
              <Form.Text className="text-muted">
                Resident cannot be changed when editing.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="modal-form-group">
            <Form.Label className="modal-form-label">Eligibility Reason *</Form.Label>
            <Form.Select
              {...register('eligibility_reason')}
              isInvalid={!!errors.eligibility_reason}
              className="modal-form-control"
            >
              {eligibilityReasons.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.eligibility_reason?.message}
            </Form.Control.Feedback>
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="modal-form-group">
                <Form.Label className="modal-form-label">Date Declared *</Form.Label>
                <Form.Control
                  type="date"
                  {...register('date_declared')}
                  isInvalid={!!errors.date_declared}
                  className="modal-form-control"
                  max={new Date().toISOString().split('T')[0]}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.date_declared?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="modal-form-group">
                <Form.Label className="modal-form-label">Valid Until *</Form.Label>
                <Form.Control
                  type="date"
                  {...register('valid_until')}
                  isInvalid={!!errors.valid_until}
                  className="modal-form-control"
                  min={dateDeclared || undefined}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.valid_until?.message}
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Typically 1 year from date declared
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="modal-form-group">
                <Form.Label className="modal-form-label">Verification Date</Form.Label>
                <Form.Control
                  type="date"
                  {...register('verification_date')}
                  isInvalid={!!errors.verification_date}
                  className="modal-form-control"
                  max={new Date().toISOString().split('T')[0]}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.verification_date?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="modal-form-group">
                <Form.Label className="modal-form-label">Verified By (User ID)</Form.Label>
                <Form.Control
                  type="number"
                  {...register('verified_by')}
                  isInvalid={!!errors.verified_by}
                  className="modal-form-control"
                  placeholder="Optional"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.verified_by?.message}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={onHide} className="btn-brand-secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting} className="btn-brand-primary">
            {isSubmitting ? (initial ? 'Updating...' : 'Registering...') : (initial ? 'Update' : 'Register')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}

