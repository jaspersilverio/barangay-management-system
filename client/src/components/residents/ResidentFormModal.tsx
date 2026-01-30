import { Modal, Button, Form, Row, Col, Alert, Card } from 'react-bootstrap'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, useMemo } from 'react'
import Select from 'react-select'
import { getHouseholdsForResidentForm, getHousehold, type HouseholdOption } from '../../services/households.service'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

// Schema for resident form - supports three modes:
// 1. Unassigned (household_id = null)
// 2. Assign to existing household (household_id = existing)
// 3. Create new household as head (create_household = true, with household details)
const createSchema = () => z.object({
  // Household assignment mode
  assignment_mode: z.enum(['unassigned', 'existing', 'new_household']),
  
  // For existing household assignment
  household_id: z.union([z.string(), z.number()]).optional().nullable(),
  
  // For new household creation
  new_household_address: z.string().optional(),
  new_household_property_type: z.string().optional(),
  new_household_contact: z.string().optional(),
  new_household_purok_id: z.union([z.string(), z.number()]).optional(),
  
  // For unassigned residents
  purok_id: z.union([z.string(), z.number()]).optional().nullable(),
  
  // Resident fields - A. Personal Information
  first_name: z.string().min(1, 'First name is required'),
  middle_name: z.string().optional().nullable(),
  last_name: z.string().min(1, 'Last name is required'),
  suffix: z.string().max(10, 'Suffix cannot exceed 10 characters').optional().nullable(),
  sex: z.enum(['male', 'female', 'other']),
  birthdate: z.string().min(1, 'Birthdate is required'),
  place_of_birth: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  religion: z.string().optional().nullable(),
  // B. Contact & Identity
  contact_number: z.string().optional().nullable(),
  email: z.string().email('Please enter a valid email address').optional().nullable().or(z.literal('')),
  valid_id_type: z.string().optional().nullable(),
  valid_id_number: z.string().optional().nullable(),
  // C. Civil Status & Relationship
  civil_status: z.enum(['single', 'married', 'widowed', 'divorced', 'separated']),
  relationship_to_head: z.string().optional().nullable(),
  // D. Socio-Economic Info
  occupation_status: z.enum(['employed', 'unemployed', 'student', 'retired', 'other']),
  employer_workplace: z.string().optional().nullable(),
  educational_attainment: z.string().optional().nullable(),
  // E. Special Classifications
  is_pwd: z.boolean().default(false),
  is_pregnant: z.boolean().default(false),
  is_solo_parent: z.boolean().default(false),
  // F. Resident Status & Notes
  resident_status: z.enum(['active', 'deceased', 'transferred', 'inactive']).default('active'),
  remarks: z.string().optional().nullable(),
}).refine((data) => {
  // If assigning to existing household, household_id is required
  if (data.assignment_mode === 'existing') {
    return data.household_id && data.household_id !== '' && data.household_id !== null
  }
  return true
}, {
  message: 'Please select a household',
  path: ['household_id']
}).refine((data) => {
  // If assigning to existing household, relationship_to_head is required
  if (data.assignment_mode === 'existing' && data.household_id && data.household_id !== '' && data.household_id !== null) {
    return data.relationship_to_head && data.relationship_to_head.trim() !== ''
  }
  return true
}, {
  message: 'Relationship to head is required when assigning to a household',
  path: ['relationship_to_head']
}).refine((data) => {
  // If creating new household, each household field is required (validated separately so the right field shows the error)
  if (data.assignment_mode !== 'new_household') return true
  return data.new_household_address != null && String(data.new_household_address).trim() !== ''
}, {
  message: 'Full address / sitio / street is required',
  path: ['new_household_address']
}).refine((data) => {
<<<<<<< HEAD
  // If unassigned, purok_id is required
  if (data.assignment_mode === 'unassigned') {
    return data.purok_id && data.purok_id !== '' && data.purok_id !== null
  }
  return true
}, {
  message: 'Purok is required when registering a resident without a household',
  path: ['purok_id']
=======
  if (data.assignment_mode !== 'new_household') return true
  return data.new_household_property_type != null && String(data.new_household_property_type).trim() !== ''
}, {
  message: 'Property type is required',
  path: ['new_household_property_type']
}).refine((data) => {
  if (data.assignment_mode !== 'new_household') return true
  return data.new_household_contact != null && String(data.new_household_contact).trim() !== ''
}, {
  message: 'Contact number is required',
  path: ['new_household_contact']
}).refine((data) => {
  if (data.assignment_mode !== 'new_household') return true
  const pid = data.new_household_purok_id
  return pid != null && pid !== '' && String(pid).trim() !== ''
}, {
  message: 'Purok is required',
  path: ['new_household_purok_id']
>>>>>>> 8f292bde1f8efdaf11f1461f77e583ccc69feb7a
})

export type ResidentFormValues = z.infer<ReturnType<typeof createSchema>>

type Props = {
  show: boolean
  initial?: Partial<ResidentFormValues & { photo_url?: string | null }>
  onSubmit: (values: ResidentFormValues & { photo?: File }) => Promise<void>
  onHide: () => void
}

export default function ResidentFormModal({ show, initial, onSubmit, onHide }: Props) {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const [households, setHouseholds] = useState<HouseholdOption[]>([])
  const [loadingHouseholds, setLoadingHouseholds] = useState(false)
  const [selectedHousehold, setSelectedHousehold] = useState<HouseholdOption | null>(null)
  const [selectedSex, setSelectedSex] = useState<'male' | 'female' | 'other'>('male')
  const [assignmentMode, setAssignmentMode] = useState<'unassigned' | 'existing' | 'new_household'>('unassigned')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)

  const isPurokLeader = user?.role === 'purok_leader'
  const assignedPurokId = user?.assigned_purok_id

  const schema = createSchema()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting }, setValue, watch } = useForm<ResidentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      assignment_mode: 'unassigned',
      household_id: null,
      new_household_address: '',
      new_household_property_type: '',
      new_household_contact: '',
      new_household_purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : '',
      purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : null,
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: null,
      sex: 'male',
      birthdate: '',
      place_of_birth: null,
      nationality: 'Filipino',
      religion: null,
      contact_number: null,
      email: null,
      valid_id_type: null,
      valid_id_number: null,
      civil_status: 'single',
      relationship_to_head: null,
      occupation_status: 'other',
      employer_workplace: null,
      educational_attainment: null,
      is_pwd: false,
      is_pregnant: false,
      is_solo_parent: false,
      resident_status: 'active',
      remarks: null,
      ...initial,
    },
  })

  const watchedAssignmentMode = watch('assignment_mode')
  const watchedBirthdate = watch('birthdate')

  // Auto-compute age from birthdate
  const computedAge = useMemo(() => {
    if (!watchedBirthdate) return null
    const birthDate = new Date(watchedBirthdate)
    if (isNaN(birthDate.getTime())) return null
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age >= 0 ? age : null
  }, [watchedBirthdate])

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

  // Handle assignment mode change
  const handleAssignmentModeChange = (mode: 'unassigned' | 'existing' | 'new_household') => {
    setAssignmentMode(mode)
    setValue('assignment_mode', mode)
    if (mode === 'unassigned') {
      setValue('household_id', null)
      setValue('relationship_to_head', null)
      setSelectedHousehold(null)
      // Reset purok_id to default for purok leaders
      setValue('purok_id', isPurokLeader && assignedPurokId ? String(assignedPurokId) : null)
    } else if (mode === 'existing') {
      setValue('new_household_address', '')
      setValue('new_household_property_type', '')
      setValue('new_household_contact', '')
    } else if (mode === 'new_household') {
      setValue('household_id', null)
      setValue('relationship_to_head', 'Head')
      setSelectedHousehold(null)
    }
  }

  // Handle household selection
  const handleHouseholdChange = async (option: HouseholdOption | null) => {
    setSelectedHousehold(option)
    if (option) {
      setValue('household_id', option.id)
      // Fetch household to get purok_id
      try {
        const householdResponse = await getHousehold(option.id)
        if (householdResponse.success && householdResponse.data?.purok_id) {
          setValue('purok_id', String(householdResponse.data.purok_id))
        }
      } catch (error) {
        console.error('Error fetching household purok:', error)
      }
    } else {
      setValue('household_id', null)
      setValue('purok_id', null)
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

  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setPhotoError(null)
    
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setPhotoError('Please select a JPEG, PNG, or WEBP image file')
        e.target.value = '' // Clear the input
        setPhotoPreview(null)
        setPhotoFile(null)
        return
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setPhotoError('Image size must be less than 5MB')
        e.target.value = '' // Clear the input
        setPhotoPreview(null)
        setPhotoFile(null)
        return
      }

      // Update photo file state
      setPhotoFile(file)

      // Create preview using FileReader
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (result && typeof result === 'string') {
          setPhotoPreview(result)
        } else {
          setPhotoError('Failed to load image preview')
          setPhotoPreview(null)
        }
      }
      reader.onerror = () => {
        setPhotoError('Failed to load image preview')
        setPhotoPreview(null)
      }
      reader.readAsDataURL(file)
    } else {
      setPhotoFile(null)
      setPhotoPreview(null)
    }
  }

  // Reset form and set initial values when modal opens/closes or initial changes
  useEffect(() => {
    if (show) {
      const defaultValues: Partial<ResidentFormValues> = {
        assignment_mode: initial?.household_id ? 'existing' : 'unassigned',
        household_id: initial?.household_id || null,
        new_household_address: '',
        new_household_property_type: '',
        new_household_contact: '',
        new_household_purok_id: isPurokLeader && assignedPurokId ? String(assignedPurokId) : '',
        first_name: '',
        middle_name: '',
        last_name: '',
        suffix: null,
        sex: 'male' as const,
        birthdate: '',
        place_of_birth: null,
        nationality: 'Filipino',
        religion: null,
        contact_number: null,
        email: null,
        valid_id_type: null,
        valid_id_number: null,
        civil_status: 'single' as const,
        relationship_to_head: null,
        occupation_status: 'other' as const,
        employer_workplace: null,
        educational_attainment: null,
        is_pwd: false,
        is_pregnant: false,
        resident_status: 'active' as const,
        remarks: null,
        ...initial,
      }
      
      reset(defaultValues)
      
      // Set sex state
      setSelectedSex(defaultValues.sex || 'male')
      
      // Set assignment mode
      const mode = initial?.household_id ? 'existing' : 'unassigned'
      setAssignmentMode(mode)
      
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
      setAssignmentMode('unassigned')
      setPhotoFile(null)
      setPhotoPreview(null)
      setPhotoError(null)
    }
  }, [show, initial, reset, households, isPurokLeader, assignedPurokId])

  // Update household selection when households load and we have initial data
  useEffect(() => {
    if (initial?.household_id && households.length > 0) {
      const household = households.find(h => h.id === Number(initial.household_id))
      if (household) {
        setSelectedHousehold(household)
      }
    }
  }, [households, initial?.household_id])

  // Load photo preview when initial changes (for editing)
  useEffect(() => {
    if (show && initial && (initial as any).photo_url && !photoFile) {
      // Only show existing photo if no new file is selected
      setPhotoPreview((initial as any).photo_url)
    } else if (!show) {
      // Clear photo preview when modal closes
      setPhotoPreview(null)
      setPhotoFile(null)
      setPhotoError(null)
    }
  }, [show, initial, photoFile])

  return (
    <Modal show={show} onHide={onHide} centered size="xl" fullscreen="lg-down">
      <Form onSubmit={handleSubmit(async (values) => {
        // Helper to convert empty strings to null for optional fields
        const cleanOptionalField = (value: any): any => {
          return value === '' || value === undefined ? null : value
        }
        
        // Clean up optional fields - convert empty strings to null
        const cleanedValues: ResidentFormValues & { photo?: File } = {
          ...values,
          suffix: cleanOptionalField(values.suffix),
          middle_name: cleanOptionalField(values.middle_name),
          place_of_birth: cleanOptionalField(values.place_of_birth),
          nationality: cleanOptionalField(values.nationality),
          religion: cleanOptionalField(values.religion),
          contact_number: cleanOptionalField(values.contact_number),
          email: cleanOptionalField(values.email),
          valid_id_type: cleanOptionalField(values.valid_id_type),
          valid_id_number: cleanOptionalField(values.valid_id_number),
          relationship_to_head: cleanOptionalField(values.relationship_to_head),
          employer_workplace: cleanOptionalField(values.employer_workplace),
          educational_attainment: cleanOptionalField(values.educational_attainment),
          remarks: cleanOptionalField(values.remarks),
          photo: photoFile || undefined
        }
        
        await onSubmit(cleanedValues)
        reset()
        setSelectedHousehold(null)
        setAssignmentMode('unassigned')
        setPhotoFile(null)
        setPhotoPreview(null)
        setPhotoError(null)
      })} encType="multipart/form-data">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            {initial ? 'Edit Resident' : 'Register Resident'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {/* A. Personal Information */}
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h6 className="mb-0 fw-bold">A. Personal Information</h6>
            </Card.Header>
            <Card.Body>
              {/* Photo Upload Section */}
              <Row className="g-3 mb-3">
                <Col md={12}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Photo (Optional)</Form.Label>
                    <div className="d-flex align-items-start gap-3">
                      <div style={{ position: 'relative' }}>
                        {photoPreview || (initial as any)?.photo_url ? (
                          <div style={{ position: 'relative', display: 'inline-block' }}>
                            <img
                              src={photoPreview || (initial as any)?.photo_url}
                              alt="Resident photo preview"
                              style={{
                                width: '120px',
                                height: '120px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                border: '2px solid #dee2e6',
                                cursor: 'pointer'
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '2px solid white'
                              }}
                              onClick={() => {
                                setPhotoPreview(null)
                                setPhotoFile(null)
                                setPhotoError(null)
                                const fileInput = document.getElementById('resident-photo-input') as HTMLInputElement
                                if (fileInput) fileInput.value = ''
                              }}
                            >
                              <i className="fas fa-times" style={{ fontSize: '10px' }}></i>
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              width: '120px',
                              height: '120px',
                              border: '2px dashed #dee2e6',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: '#f8f9fa',
                              cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onClick={() => document.getElementById('resident-photo-input')?.click()}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#0d6efd'
                              e.currentTarget.style.backgroundColor = '#e7f1ff'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#dee2e6'
                              e.currentTarget.style.backgroundColor = '#f8f9fa'
                            }}
                          >
                            <div className="text-center p-2">
                              <i className="fas fa-user fa-2x text-muted mb-1 d-block"></i>
                              <div className="text-muted small">No photo</div>
                            </div>
                          </div>
                        )}
                        <input
                          type="file"
                          id="resident-photo-input"
                          accept="image/jpeg,image/jpg,image/png,image/webp"
                          onChange={handlePhotoChange}
                          style={{ display: 'none' }}
                        />
                      </div>
                      <div className="flex-grow-1">
                        <Button
                          type="button"
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => document.getElementById('resident-photo-input')?.click()}
                          className="mb-2"
                        >
                          <i className="fas fa-upload me-1"></i>
                          {photoPreview || (initial as any)?.photo_url ? 'Change Photo' : 'Choose Photo'}
                        </Button>
                        {photoError && (
                          <div className="text-danger small mb-2 d-block">{photoError}</div>
                        )}
                        <Form.Text className="text-muted small d-block">
                          <i className="fas fa-info-circle me-1"></i>
                          Supported formats: JPEG, PNG, WEBP. Maximum size: 5MB.
                        </Form.Text>
                      </div>
                    </div>
                  </Form.Group>
                </Col>
              </Row>

              <Row className="g-3">
                <Col md={4}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Last Name *</Form.Label>
                    <Form.Control 
                      {...register('last_name')} 
                      isInvalid={!!errors.last_name}
                      className="modal-form-control"
                      placeholder="Enter last name"
                    />
                    <Form.Control.Feedback type="invalid">{errors.last_name?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">First Name *</Form.Label>
                    <Form.Control 
                      {...register('first_name')} 
                      isInvalid={!!errors.first_name}
                      className="modal-form-control"
                      placeholder="Enter first name"
                    />
                    <Form.Control.Feedback type="invalid">{errors.first_name?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Middle Name (Optional)</Form.Label>
                    <Form.Control 
                      {...register('middle_name')}
                      className="modal-form-control"
                      placeholder="Enter middle name (optional)"
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Suffix (Optional)</Form.Label>
                    <Form.Control 
                      {...register('suffix')}
                      className="modal-form-control"
                      placeholder="Jr., Sr., II, III (optional)"
                      isInvalid={!!errors.suffix}
                    />
                    <Form.Control.Feedback type="invalid">{errors.suffix?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Sex *</Form.Label>
                    <Form.Select 
                      value={selectedSex} 
                      onChange={handleSexChange} 
                      isInvalid={!!errors.sex}
                      className="modal-form-control"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.sex?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Date of Birth *</Form.Label>
                    <Form.Control 
                      type="date" 
                      {...register('birthdate')} 
                      isInvalid={!!errors.birthdate}
                      className="modal-form-control"
                    />
                    <Form.Control.Feedback type="invalid">{errors.birthdate?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={2}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Age</Form.Label>
                    <Form.Control 
                      type="text"
                      value={computedAge !== null ? `${computedAge} years old` : '---'}
                      readOnly
                      className="modal-form-control"
                      style={{ backgroundColor: '#f8f9fa', fontWeight: '500' }}
                    />
                    <Form.Text className="text-muted small">Auto-computed</Form.Text>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Civil Status *</Form.Label>
                    <Form.Select 
                      {...register('civil_status')} 
                      isInvalid={!!errors.civil_status}
                      className="modal-form-control"
                    >
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
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Place of Birth</Form.Label>
                    <Form.Control 
                      {...register('place_of_birth')}
                      className="modal-form-control"
                      placeholder="City/Municipality, Province"
                      isInvalid={!!errors.place_of_birth}
                    />
                    <Form.Control.Feedback type="invalid">{errors.place_of_birth?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Nationality</Form.Label>
                    <Form.Control 
                      {...register('nationality')}
                      className="modal-form-control"
                      placeholder="Filipino"
                      isInvalid={!!errors.nationality}
                    />
                    <Form.Control.Feedback type="invalid">{errors.nationality?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Religion</Form.Label>
                    <Form.Control 
                      {...register('religion')}
                      className="modal-form-control"
                      placeholder="Optional"
                      isInvalid={!!errors.religion}
                    />
                    <Form.Control.Feedback type="invalid">{errors.religion?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* B. Contact & Identity */}
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h6 className="mb-0 fw-bold">B. Contact & Identity</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Contact Number</Form.Label>
                    <Form.Control 
                      {...register('contact_number')}
                      className="modal-form-control"
                      placeholder="09XX-XXX-XXXX"
                      isInvalid={!!errors.contact_number}
                    />
                    <Form.Control.Feedback type="invalid">{errors.contact_number?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Email</Form.Label>
                    <Form.Control 
                      type="email"
                      {...register('email')}
                      className="modal-form-control"
                      placeholder="email@example.com"
                      isInvalid={!!errors.email}
                    />
                    <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Valid ID Type</Form.Label>
                    <Form.Select 
                      {...register('valid_id_type')}
                      className="modal-form-control"
                      isInvalid={!!errors.valid_id_type}
                    >
                      <option value="">Select ID type</option>
                      <option value="Philippine Passport">Philippine Passport</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="SSS ID">SSS ID</option>
                      <option value="GSIS ID">GSIS ID</option>
                      <option value="PhilHealth ID">PhilHealth ID</option>
                      <option value="TIN ID">TIN ID</option>
                      <option value="Postal ID">Postal ID</option>
                      <option value="Voter's ID">Voter's ID</option>
                      <option value="National ID">National ID</option>
                      <option value="Senior Citizen ID">Senior Citizen ID</option>
                      <option value="PWD ID">PWD ID</option>
                      <option value="Other">Other</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.valid_id_type?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Valid ID Number</Form.Label>
                    <Form.Control 
                      {...register('valid_id_number')}
                      className="modal-form-control"
                      placeholder="Enter ID number"
                      isInvalid={!!errors.valid_id_number}
                    />
                    <Form.Control.Feedback type="invalid">{errors.valid_id_number?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* C. Address & Household Assignment */}
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-success text-white">
              <h6 className="mb-0 fw-bold">C. Address & Household Assignment</h6>
            </Card.Header>
            <Card.Body>
              {/* Household Assignment Mode - Only show when creating new resident */}
              {!initial && (
                <Row className="g-3 mb-3">
                  <Col md={12}>
                    <Form.Group className="modal-form-group">
                      <Form.Label className="modal-form-label fw-bold">Household Assignment *</Form.Label>
                      <div className="border rounded p-3 bg-light">
                        <Form.Check
                          type="radio"
                          label="Create new household (Head of Household)"
                          name="assignment_mode"
                          id="mode_new_household"
                          checked={assignmentMode === 'new_household'}
                          onChange={() => handleAssignmentModeChange('new_household')}
                          className="mb-2"
                        />
                        <Form.Check
                          type="radio"
                          label="Assign to existing household (Member)"
                          name="assignment_mode"
                          id="mode_existing"
                          checked={assignmentMode === 'existing'}
                          onChange={() => handleAssignmentModeChange('existing')}
                          className="mb-2"
                        />
                        <Form.Check
                          type="radio"
                          label="No household yet (temporary)"
                          name="assignment_mode"
                          id="mode_unassigned"
                          checked={assignmentMode === 'unassigned'}
                          onChange={() => handleAssignmentModeChange('unassigned')}
                        />
                      </div>
                      <input type="hidden" {...register('assignment_mode')} />
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {/* New Household Creation Fields */}
              {assignmentMode === 'new_household' && (
                <>
                  <Alert variant="warning" className="mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Creating New Household:</strong> This resident will be automatically marked as the head of the new household.
                  </Alert>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Purok *</Form.Label>
                        {isPurokLeader ? (
                          <>
                            <Form.Control
                              type="text"
                              value={puroks.find(p => p.id === assignedPurokId)?.name || 'Your Assigned Purok'}
                              disabled
                              className="modal-form-control"
                            />
                            <input type="hidden" {...register('new_household_purok_id')} defaultValue={assignedPurokId ? String(assignedPurokId) : ''} />
                          </>
                        ) : (
                          <>
                            <Form.Select
                              {...register('new_household_purok_id')}
                              isInvalid={!!errors.new_household_purok_id}
                              className="modal-form-control"
                            >
                              <option value="">Select purok</option>
                              {puroks.map((purok) => (
                                <option key={purok.id} value={purok.id}>
                                  {purok.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">{errors.new_household_purok_id?.message}</Form.Control.Feedback>
                          </>
                        )}
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Property Type *</Form.Label>
                        <Form.Select
                          {...register('new_household_property_type')}
                          isInvalid={!!errors.new_household_property_type}
                          className="modal-form-control"
                        >
                          <option value="">Select property type</option>
                          <option value="house">House</option>
                          <option value="apartment">Apartment</option>
                          <option value="condominium">Condominium</option>
                          <option value="shanty">Shanty</option>
                          <option value="commercial">Commercial</option>
                          <option value="other">Other</option>
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">{errors.new_household_property_type?.message}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Full Address / Sitio / Street *</Form.Label>
                        <Form.Control
                          placeholder="Enter complete address"
                          {...register('new_household_address')}
                          isInvalid={!!errors.new_household_address}
                          className="modal-form-control"
                        />
                        <Form.Control.Feedback type="invalid">{errors.new_household_address?.message}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={12}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Contact Number *</Form.Label>
                        <Form.Control
                          placeholder="Enter contact number"
                          {...register('new_household_contact')}
                          isInvalid={!!errors.new_household_contact}
                          className="modal-form-control"
                        />
                        <Form.Control.Feedback type="invalid">{errors.new_household_contact?.message}</Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <input type="hidden" {...register('relationship_to_head')} value="Head" />
                </>
              )}

              {/* Existing Household Selection */}
              {(assignmentMode === 'existing' || (initial && initial.household_id)) && (
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group className="modal-form-group">
                      <Form.Label className="modal-form-label">Select Existing Household *</Form.Label>
                      <Select
                        value={selectedHousehold}
                        onChange={handleHouseholdChange}
                        options={households}
                        getOptionLabel={(option) => option.label}
                        getOptionValue={(option) => option.id.toString()}
                        placeholder="Search for a household by head name, address, or purok..."
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
                          {errors.household_id.message}
                        </div>
                      )}
                    </Form.Group>
                  </Col>
                  {/* Purok field - auto-filled from household, disabled */}
                  <Col md={12}>
                    <Form.Group className="modal-form-group">
                      <Form.Label className="modal-form-label">Purok</Form.Label>
                      <Form.Select
                        {...register('purok_id')}
                        disabled
                        className="modal-form-control"
                        style={{ backgroundColor: '#f8f9fa' }}
                      >
                        <option value="">Select purok</option>
                        {puroks.map((purok) => (
                          <option key={purok.id} value={purok.id}>
                            {purok.name}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Automatically set from selected household
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              )}

              {/* Purok Selection for Unassigned Residents */}
              {assignmentMode === 'unassigned' && (
                <Row className="g-3">
                  <Col md={12}>
                    <Form.Group className="modal-form-group">
                      <Form.Label className="modal-form-label">Purok *</Form.Label>
                      {isPurokLeader ? (
                        <>
                          <Form.Control
                            type="text"
                            value={puroks.find(p => p.id === assignedPurokId)?.name || 'Your Assigned Purok'}
                            disabled
                            className="modal-form-control"
                          />
                          <Form.Text className="text-muted">
                            You can only manage residents in your assigned purok.
                          </Form.Text>
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
                          <Form.Text className="text-muted">
                            Required when registering a resident without a household
                          </Form.Text>
                        </>
                      )}
                    </Form.Group>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>

          {/* D. Relationship & Socio-Economic Info */}
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h6 className="mb-0 fw-bold">D. Relationship & Socio-Economic Information</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                {(assignmentMode === 'existing' || (initial && initial.household_id)) && (
                  <Col md={12}>
                    <Form.Group className="modal-form-group">
                      <Form.Label className="modal-form-label">Relationship to Head *</Form.Label>
                      <Form.Select 
                        {...register('relationship_to_head')} 
                        isInvalid={!!errors.relationship_to_head}
                        className="modal-form-control"
                      >
                        <option value="">Select relationship</option>
                        <option value="Head">Head</option>
                        <option value="Spouse">Spouse</option>
                        <option value="Child">Child</option>
                        <option value="Parent">Parent</option>
                        <option value="Sibling">Sibling</option>
                        <option value="Other Relative">Other Relative</option>
                        <option value="Non-Relative">Non-Relative</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.relationship_to_head?.message}</Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Required when assigning to a household
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Occupation Status *</Form.Label>
                    <Form.Select 
                      {...register('occupation_status')} 
                      isInvalid={!!errors.occupation_status}
                      className="modal-form-control"
                    >
                      <option value="employed">Employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="student">Student</option>
                      <option value="retired">Retired</option>
                      <option value="other">Other</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.occupation_status?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Employer / Workplace</Form.Label>
                    <Form.Control 
                      {...register('employer_workplace')}
                      className="modal-form-control"
                      placeholder="Optional"
                      isInvalid={!!errors.employer_workplace}
                    />
                    <Form.Control.Feedback type="invalid">{errors.employer_workplace?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Educational Attainment</Form.Label>
                    <Form.Select 
                      {...register('educational_attainment')}
                      className="modal-form-control"
                      isInvalid={!!errors.educational_attainment}
                    >
                      <option value="">Select educational attainment</option>
                      <option value="No Formal Education">No Formal Education</option>
                      <option value="Elementary">Elementary</option>
                      <option value="High School">High School</option>
                      <option value="Senior High School">Senior High School</option>
                      <option value="Vocational">Vocational</option>
                      <option value="College Undergraduate">College Undergraduate</option>
                      <option value="College Graduate">College Graduate</option>
                      <option value="Postgraduate">Postgraduate</option>
                      <option value="Master's Degree">Master's Degree</option>
                      <option value="Doctorate">Doctorate</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.educational_attainment?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* E. Special Classifications */}
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-danger text-white">
              <h6 className="mb-0 fw-bold">E. Special Classifications</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group className="modal-form-group">
                    <div className="d-flex align-items-start gap-2">
                      <input
                        type="checkbox"
                        id="is_senior"
                        checked={computedAge !== null && computedAge >= 60}
                        disabled
                        className="form-check-input mt-1"
                        style={{ 
                          flexShrink: 0,
                          backgroundColor: computedAge !== null && computedAge >= 60 ? '#0d6efd' : '#f8f9fa',
                          borderColor: computedAge !== null && computedAge >= 60 ? '#0d6efd' : '#dee2e6',
                          cursor: 'default',
                          opacity: computedAge !== null && computedAge >= 60 ? 1 : 0.65
                        }}
                      />
                      <div className="flex-grow-1">
                        <label className="fw-semibold mb-1 d-block" htmlFor="is_senior">
                          Senior Citizen (age ≥ 60)
                        </label>
                        <Form.Text className="text-muted small d-block" style={{ lineHeight: '1.5', wordBreak: 'break-word' }}>
                          {computedAge !== null && computedAge >= 60 
                            ? '✓ Automatically validated by age' 
                            : computedAge !== null 
                              ? `Current age: ${computedAge} (requires 60+)` 
                              : 'Enter birthdate to validate'}
                        </Form.Text>
                      </div>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="modal-form-group">
                    <div className="d-flex align-items-start gap-2">
                      <input
                        type="checkbox"
                        id="is_pwd"
                        {...register('is_pwd')}
                        className="form-check-input mt-1"
                        style={{ flexShrink: 0, cursor: 'pointer' }}
                      />
                      <div className="flex-grow-1">
                        <label className="fw-semibold mb-0" style={{ cursor: 'pointer' }} htmlFor="is_pwd">
                          Person With Disability (PWD)
                        </label>
                      </div>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="modal-form-group">
                    <div className="d-flex align-items-start gap-2">
                      <input
                        type="checkbox"
                        id="is_solo_parent"
                        {...register('is_solo_parent')}
                        className="form-check-input mt-1"
                        style={{ flexShrink: 0, cursor: 'pointer' }}
                      />
                      <div className="flex-grow-1">
                        <label className="fw-semibold mb-0" style={{ cursor: 'pointer' }} htmlFor="is_solo_parent">
                          Solo Parent
                        </label>
                        <Form.Text className="text-muted small d-block" style={{ lineHeight: '1.5', wordBreak: 'break-word' }}>
                          Check this if the resident is a solo parent. A solo parent record will be automatically created.
                        </Form.Text>
                      </div>
                    </div>
                  </Form.Group>
                </Col>
                {selectedSex === 'female' && (
                  <Col md={12}>
                    <Form.Group className="modal-form-group">
                      <div className="d-flex align-items-start gap-2">
                        <input
                          type="checkbox"
                          id="is_pregnant"
                          {...register('is_pregnant')}
                          className="form-check-input mt-1"
                          style={{ flexShrink: 0, cursor: 'pointer' }}
                        />
                        <div className="flex-grow-1">
                          <label className="fw-semibold mb-0" style={{ cursor: 'pointer' }} htmlFor="is_pregnant">
                            Pregnant
                          </label>
                        </div>
                      </div>
                    </Form.Group>
                  </Col>
                )}
              </Row>
            </Card.Body>
          </Card>

          {/* F. Resident Status & Notes */}
          <Card className="mb-3 border-0 shadow-sm">
            <Card.Header className="bg-secondary text-white">
              <h6 className="mb-0 fw-bold">F. Resident Status & Notes</h6>
            </Card.Header>
            <Card.Body>
              <Row className="g-3">
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Resident Status</Form.Label>
                    <Form.Select 
                      {...register('resident_status')}
                      className="modal-form-control"
                      isInvalid={!!errors.resident_status}
                    >
                      <option value="active">Active</option>
                      <option value="deceased">Deceased</option>
                      <option value="transferred">Transferred</option>
                      <option value="inactive">Inactive</option>
                    </Form.Select>
                    <Form.Control.Feedback type="invalid">{errors.resident_status?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Remarks / Notes</Form.Label>
                    <Form.Control 
                      as="textarea"
                      rows={3}
                      {...register('remarks')}
                      className="modal-form-control"
                      placeholder="Optional notes or remarks about this resident..."
                      isInvalid={!!errors.remarks}
                    />
                    <Form.Control.Feedback type="invalid">{errors.remarks?.message}</Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={onHide} className="btn-brand-secondary">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={isSubmitting} className="btn-brand-primary">
            <i className="fas fa-save me-1"></i>
            {isSubmitting ? 'Saving...' : (initial ? 'Update Resident' : 'Register Resident')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
