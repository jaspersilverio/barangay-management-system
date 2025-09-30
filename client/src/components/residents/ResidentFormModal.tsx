import { Modal, Button, Form, Row, Col } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import Select from 'react-select'
import { getHouseholdsForResidentForm, type HouseholdOption } from '../../services/households.service'

// Schema for resident form
const schema = z.object({
  household_id: z.union([z.string(), z.number()]),
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, 'Last name is required'),
  sex: z.enum(['male', 'female', 'other']),
  birthdate: z.string().min(1, 'Birthdate is required'),
  civil_status: z.enum(['single', 'married', 'widowed', 'divorced', 'separated']),
  relationship_to_head: z.string().min(1, 'Relationship is required'),
  occupation_status: z.enum(['employed', 'unemployed', 'student', 'retired', 'other']),
  is_pwd: z.boolean().default(false),
  is_pregnant: z.boolean().default(false),
})

export type ResidentFormValues = z.infer<typeof schema>

type Props = {
  show: boolean
  initial?: Partial<ResidentFormValues>
  onSubmit: (values: ResidentFormValues) => Promise<void>
  onHide: () => void
}

export default function ResidentFormModal({ show, initial, onSubmit, onHide }: Props) {
  const [households, setHouseholds] = useState<HouseholdOption[]>([])
  const [loadingHouseholds, setLoadingHouseholds] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdOption | null>(null)
  const [selectedSex, setSelectedSex] = useState<'male' | 'female' | 'other'>('male')

  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue } = useForm<ResidentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      household_id: '',
      first_name: '',
      middle_name: '',
      last_name: '',
      sex: 'male',
      birthdate: '',
      civil_status: 'single',
      relationship_to_head: '',
      occupation_status: 'other',
      is_pwd: false,
      is_pregnant: false,
    },
  })

  // Load households for dropdown
  const loadHouseholds = async (search?: string) => {
    setLoadingHouseholds(true)
    try {
      const response = await getHouseholdsForResidentForm({ search })
      if (response.success) {
        setHouseholds(response.data)
      }
    } catch (error) {
      console.error('Error loading households:', error)
    } finally {
      setLoadingHouseholds(false)
    }
  }

  // Load households when modal opens
  useEffect(() => {
    if (show) {
      loadHouseholds()
    }
  }, [show])

  // Handle household selection
  const handleHouseholdChange = (option: HouseholdOption | null) => {
    setSelectedHousehold(option)
    if (option) {
      setValue('household_id', option.id)
    } else {
      setValue('household_id', '')
    }
  }

  // Handle sex selection
  const handleSexChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sex = e.target.value as 'male' | 'female' | 'other'
    setSelectedSex(sex)
    setValue('sex', sex)

    // Reset pregnant status if not female
    if (sex !== 'female') {
      setValue('is_pregnant', false)
    }
  }

  // Reset form and set initial values when modal opens/closes or initial changes
  useEffect(() => {
    if (show) {
        const defaultValues = {
          household_id: '',
          first_name: '',
          middle_name: '',
          last_name: '',
          sex: 'male' as const,
          birthdate: '',
          relationship_to_head: '',
          occupation_status: 'other' as const,
          is_pwd: false,
          is_pregnant: false,
          ...initial,
        }
      
      reset(defaultValues)
      
      // Set sex state
      setSelectedSex(defaultValues.sex)
      
      // Set household selection if editing
      if (initial?.household_id && households.length > 0) {
        const household = households.find(h => h.id === Number(initial.household_id))
        if (household) {
          setSelectedHousehold(household)
        }
      } else {
        setSelectedHousehold(null)
      }
    } else {
      // Reset form when modal closes
      reset()
      setSelectedHousehold(null)
      setSelectedSex('male')
    }
  }, [show, initial, reset, households])

  // Update household selection when households load and we have initial data
  useEffect(() => {
    if (initial?.household_id && households.length > 0) {
      const household = households.find(h => h.id === Number(initial.household_id))
      if (household) {
        setSelectedHousehold(household)
      }
    }
  }, [households, initial?.household_id])

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Form onSubmit={handleSubmit(async (values) => {
        const payload = {
          ...values,
          household_id: Number(values.household_id),
        }
        await onSubmit(payload as any)
        reset()
        setSelectedHousehold(null)
      })}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom">
            {initial ? 'Edit Resident' : 'Add Resident'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Row className="g-3">
            <Col md={12}>
              <Form.Group className="modal-form-group">
                <Form.Label className="modal-form-label">Household *</Form.Label>
                <Select
                  value={selectedHousehold}
                  onChange={handleHouseholdChange}
                  options={households}
                  getOptionLabel={(option) => option.label}
                  getOptionValue={(option) => option.id.toString()}
                  placeholder="Search for a household..."
                  isLoading={loadingHouseholds}
                  isClearable
                  isSearchable
                  noOptionsMessage={() => "No households found"}
                  onInputChange={(newValue) => {
                    if (newValue.length >= 2) {
                      loadHouseholds(newValue)
                    }
                  }}
                                     styles={{
                     control: (provided) => ({
                       ...provided,
                       borderColor: errors.household_id ? '#dc3545' : provided.borderColor,
                     }),
                   }}
                />
                {errors.household_id && (
                  <div className="text-danger mt-1" style={{ fontSize: '0.875rem' }}>
                    Household is required
                  </div>
                )}
                <Form.Text className="text-muted">
                  Search by head of household name, address, or purok
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Purok</Form.Label>
                <Form.Control
                  type="text"
                  value={selectedHousehold?.purok_name || 'Select a household to see purok'}
                  disabled
                />
                <Form.Text className="text-muted">
                  Purok is determined by the selected household
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Birthdate</Form.Label>
                <Form.Control type="date" {...register('birthdate')} isInvalid={!!errors.birthdate} />
                <Form.Control.Feedback type="invalid">{errors.birthdate?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control {...register('first_name')} isInvalid={!!errors.first_name} />
                <Form.Control.Feedback type="invalid">{errors.first_name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Middle Name</Form.Label>
                <Form.Control {...register('middle_name')} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control {...register('last_name')} isInvalid={!!errors.last_name} />
                <Form.Control.Feedback type="invalid">{errors.last_name?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Row className="g-3">
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Sex</Form.Label>
                <Form.Select 
                  value={selectedSex} 
                  onChange={handleSexChange} 
                  isInvalid={!!errors.sex}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.sex?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Civil Status</Form.Label>
                <Form.Select {...register('civil_status')} isInvalid={!!errors.civil_status}>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="widowed">Widowed</option>
                  <option value="divorced">Divorced</option>
                  <option value="separated">Separated</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.civil_status?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Occupation Status</Form.Label>
                <Form.Select {...register('occupation_status')} isInvalid={!!errors.occupation_status}>
                  <option value="employed">Employed</option>
                  <option value="unemployed">Unemployed</option>
                  <option value="student">Student</option>
                  <option value="retired">Retired</option>
                  <option value="other">Other</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">{errors.occupation_status?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          
          
          <Row className="g-3">
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label>Relationship to Head</Form.Label>
                <Form.Control {...register('relationship_to_head')} isInvalid={!!errors.relationship_to_head} />
                <Form.Control.Feedback type="invalid">{errors.relationship_to_head?.message}</Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Person with Disability (PWD)"
              {...register('is_pwd')}
            />
          </Form.Group>
          
          {/* Pregnant checkbox - only show when female is selected */}
          {selectedSex === 'female' && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Pregnant"
                {...register('is_pregnant')}
              />
            </Form.Group>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={onHide} className="btn-cancel">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting} className="btn-submit">
            <i className="fas fa-save me-1"></i>
            {isSubmitting ? 'Saving...' : (initial ? 'Update' : 'Create')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
