import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col } from 'react-bootstrap'
import { type Official, type CreateOfficialData, POSITION_OPTIONS, OFFICIAL_POSITION_OPTIONS, SK_POSITION_OPTIONS } from '../../services/officials.service'
import { usePuroks } from '../../context/PurokContext'

interface OfficialFormProps {
  show: boolean
  onHide: () => void
  official?: Official | null
  onSubmit: (data: CreateOfficialData) => Promise<void>
  loading: boolean
  category?: 'official' | 'sk' | 'tanod' | 'bhw' | 'staff' // Category prop to determine form layout
}

export default function OfficialForm({
  show,
  onHide,
  official,
  onSubmit,
  loading,
  category = 'official' // Default to 'official' for backward compatibility
}: OfficialFormProps) {
  const { puroks } = usePuroks()
  const isOfficialCategory = category === 'official'
  const isSKCategory = category === 'sk'
  const isEnhancedCategory = isOfficialCategory || isSKCategory // Both official and SK use enhanced fields

  const [formData, setFormData] = useState<CreateOfficialData>({
    name: '',
    position: '',
    term_start: '',
    term_end: '',
    contact: '',
    active: true,
    ...(isEnhancedCategory && {
      first_name: '',
      middle_name: '',
      last_name: '',
      suffix: '',
      sex: '',
      birthdate: '',
      email: '',
      address: '',
      purok_id: undefined
    })
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [computedAge, setComputedAge] = useState<number | null>(null)

  const isEditing = !!official

  // Determine position options based on category
  let positionOptions = POSITION_OPTIONS
  if (isOfficialCategory) {
    positionOptions = OFFICIAL_POSITION_OPTIONS
  } else if (isSKCategory) {
    positionOptions = SK_POSITION_OPTIONS
  }

  // Calculate age from birthdate (for SK category) - defined before useEffect
  const calculateAge = (birthdate: string): number | null => {
    if (!birthdate) return null
    try {
      const birth = new Date(birthdate)
      const today = new Date()
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    } catch {
      return null
    }
  }

  useEffect(() => {
    if (official) {
      // Convert ISO date strings to yyyy-MM-dd format for HTML date inputs
      const formatDateForInput = (dateString: string | undefined): string => {
        if (!dateString) return ''
        try {
          const date = new Date(dateString)
          // Check if date is valid
          if (isNaN(date.getTime())) return ''
          // Return in yyyy-MM-dd format
          return date.toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      // Load enhanced fields if available for official/SK categories
      const baseData: any = {
        user_id: official.user_id,
        name: official.name,
        position: official.position,
        term_start: formatDateForInput(official.term_start),
        term_end: formatDateForInput(official.term_end),
        contact: official.contact || '',
        active: official.active
      }

      // Load enhanced fields if category supports them
      if (isEnhancedCategory) {
        baseData.first_name = (official as any).first_name || ''
        baseData.middle_name = (official as any).middle_name || ''
        baseData.last_name = (official as any).last_name || ''
        baseData.suffix = (official as any).suffix || ''
        baseData.sex = (official as any).sex || ''
        baseData.birthdate = formatDateForInput((official as any).birthdate)
        baseData.email = (official as any).email || ''
        baseData.address = (official as any).address || ''
        baseData.purok_id = (official as any).purok_id || undefined

        // Calculate age for SK if birthdate exists
        if (isSKCategory && baseData.birthdate) {
          const age = calculateAge(baseData.birthdate)
          setComputedAge(age)
        }
      }

      setFormData(baseData)
      // Set preview to existing photo URL if available
      setPhotoPreview(official.photo_url || null)
    } else {
      // Reset form with category-appropriate fields
      setFormData({
        name: '',
        position: '',
        term_start: '',
        term_end: '',
        contact: '',
        active: true,
        ...(isEnhancedCategory && {
          first_name: '',
          middle_name: '',
          last_name: '',
          suffix: '',
          sex: '',
          birthdate: '',
          email: '',
          address: '',
          purok_id: undefined
        })
      })
      setPhotoPreview(null)
      setComputedAge(null)
    }
    setErrors({})
  }, [official, show, category])

  const handleInputChange = (field: keyof CreateOfficialData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculate age for SK category when birthdate changes
    if (isSKCategory && field === 'birthdate') {
      const age = calculateAge(value)
      setComputedAge(age)

      // Validate SK age requirement (15-30)
      if (age !== null && (age < 15 || age > 30)) {
        setErrors(prev => ({ ...prev, birthdate: `SK members must be between 15 and 30 years old. Current age: ${age}` }))
      } else if (age !== null) {
        setErrors(prev => {
          const newErrors = { ...prev }
          delete newErrors.birthdate
          return newErrors
        })
      }
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        setErrors(prev => ({ ...prev, photo: 'Please select a JPEG, PNG, or WEBP image file' }))
        e.target.value = '' // Clear the input
        setPhotoPreview(null) // Clear preview on error
        return
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        setErrors(prev => ({ ...prev, photo: 'Image size must be less than 5MB' }))
        e.target.value = '' // Clear the input
        setPhotoPreview(null) // Clear preview on error
        return
      }

      // Clear any previous errors
      setErrors(prev => ({ ...prev, photo: '' }))

      // Update form data first
      setFormData(prev => ({ ...prev, photo: file }))

      // Create preview immediately using FileReader
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result
        if (result && typeof result === 'string') {
          // Set the preview to the data URL
          setPhotoPreview(result)
        } else {
          setErrors(prev => ({ ...prev, photo: 'Failed to load image preview' }))
          setPhotoPreview(null)
        }
      }
      reader.onerror = () => {
        setErrors(prev => ({ ...prev, photo: 'Failed to load image preview' }))
        setPhotoPreview(null)
      }
      reader.readAsDataURL(file)
    } else {
      // If no file selected and not editing, clear preview
      if (!official) {
        setPhotoPreview(null)
      } else {
        // If editing and file cleared, show original photo again
        setPhotoPreview(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const newErrors: { [key: string]: string } = {}

    // For enhanced categories (official/SK), validate first_name and last_name instead of name
    if (isEnhancedCategory) {
      if (!formData.first_name?.trim()) {
        newErrors.first_name = 'First name is required'
      }
      if (!formData.last_name?.trim()) {
        newErrors.last_name = 'Last name is required'
      }

      // SK age validation
      if (isSKCategory && formData.birthdate) {
        const age = calculateAge(formData.birthdate)
        if (age === null || age < 15 || age > 30) {
          newErrors.birthdate = `SK members must be between 15 and 30 years old. Current age: ${age || 'N/A'}`
        }
      }
    } else {
      // For other categories, validate name
      if (!formData.name?.trim()) {
        newErrors.name = 'Name is required'
      }
    }

    if (!formData.position) {
      newErrors.position = 'Position is required'
    }

    if (formData.term_start && formData.term_end) {
      const startDate = new Date(formData.term_start)
      const endDate = new Date(formData.term_end)
      if (endDate < startDate) {
        newErrors.term_end = 'End date must be after start date'
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      // Prepare form data for submission
      await onSubmit(formData)
      // Clear photo preview after successful submission
      setPhotoPreview(null)
      onHide()
    } catch (error) {
      console.error('Form submission error:', error)
      // Don't clear preview on error so user can see what they selected
    }
  }

  const handleClose = () => {
    setErrors({})
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title className="modal-title-custom text-brand-primary">
          {isEditing
            ? (isSKCategory ? 'Edit SK Member' : isOfficialCategory ? 'Edit Official' : 'Edit Personnel')
            : (isSKCategory ? 'Add New SK Member' : isOfficialCategory ? 'Add New Official' : 'Add New Personnel')
          }
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="modal-body-custom">
          <Row>
            <Col md={8}>
              {isEnhancedCategory ? (
                <>
                  {/* Personal Information Section */}
                  <div className="mb-4">
                    <h6 className="text-brand-primary mb-3 border-bottom pb-2">Personal Information</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">First Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.first_name || ''}
                            onChange={(e) => handleInputChange('first_name', e.target.value)}
                            isInvalid={!!errors.first_name}
                            className="modal-form-control"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.first_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Middle Name</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.middle_name || ''}
                            onChange={(e) => handleInputChange('middle_name', e.target.value)}
                            className="modal-form-control"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Last Name *</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.last_name || ''}
                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                            isInvalid={!!errors.last_name}
                            className="modal-form-control"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.last_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Suffix</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Jr., Sr., II, III"
                            value={formData.suffix || ''}
                            onChange={(e) => handleInputChange('suffix', e.target.value)}
                            className="modal-form-control"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Sex *</Form.Label>
                          <Form.Select
                            value={formData.sex || ''}
                            onChange={(e) => handleInputChange('sex', e.target.value)}
                            className="modal-form-control"
                          >
                            <option value="">Select Sex</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">
                            Birthdate {isSKCategory && '*'}
                            {isSKCategory && computedAge !== null && (
                              <span className="text-brand-muted ms-2">(Age: {computedAge})</span>
                            )}
                          </Form.Label>
                          <Form.Control
                            type="date"
                            value={formData.birthdate || ''}
                            onChange={(e) => handleInputChange('birthdate', e.target.value)}
                            isInvalid={!!errors.birthdate}
                            className="modal-form-control"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.birthdate}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Contact & Location Section */}
                  <div className="mb-4">
                    <h6 className="text-brand-primary mb-3 border-bottom pb-2">Contact & Location</h6>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Contact Number *</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Phone number"
                            value={formData.contact || ''}
                            onChange={(e) => handleInputChange('contact', e.target.value)}
                            className="modal-form-control"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Email</Form.Label>
                          <Form.Control
                            type="email"
                            placeholder="email@example.com"
                            value={formData.email || ''}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className="modal-form-control"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Address</Form.Label>
                          <Form.Control
                            type="text"
                            placeholder="Street address"
                            value={formData.address || ''}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            className="modal-form-control"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">Purok</Form.Label>
                          <Form.Select
                            value={formData.purok_id || ''}
                            onChange={(e) => handleInputChange('purok_id', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="modal-form-control"
                          >
                            <option value="">Select Purok</option>
                            {puroks.map((purok) => (
                              <option key={purok.id} value={purok.id}>
                                {purok.name}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Position & Term Section */}
                  <div className="mb-4">
                    <h6 className="text-brand-primary mb-3 border-bottom pb-2">
                      {isSKCategory ? 'SK Position & Term' : 'Position & Term'}
                    </h6>
                    <Row>
                      <Col md={12}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">
                            {isSKCategory ? 'SK Position *' : isOfficialCategory ? 'Barangay Official Position *' : 'Position *'}
                          </Form.Label>
                          <Form.Select
                            value={formData.position}
                            onChange={(e) => handleInputChange('position', e.target.value)}
                            isInvalid={!!errors.position}
                            className="modal-form-control"
                          >
                            <option value="">Select Position</option>
                            {positionOptions.map((position) => (
                              <option key={position} value={position}>
                                {position}
                              </option>
                            ))}
                          </Form.Select>
                          <Form.Control.Feedback type="invalid">
                            {errors.position}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">
                            {isSKCategory ? 'SK Term Start' : 'Term Start'}
                          </Form.Label>
                          <Form.Control
                            type="date"
                            value={formData.term_start || ''}
                            onChange={(e) => handleInputChange('term_start', e.target.value)}
                            className="modal-form-control"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="modal-form-group">
                          <Form.Label className="modal-form-label">
                            {isSKCategory ? 'SK Term End' : 'Term End'}
                          </Form.Label>
                          <Form.Control
                            type="date"
                            value={formData.term_end || ''}
                            onChange={(e) => handleInputChange('term_end', e.target.value)}
                            isInvalid={!!errors.term_end}
                            className="modal-form-control"
                          />
                          <Form.Control.Feedback type="invalid">
                            {errors.term_end}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>

                  {/* Status Section */}
                  <div className="mb-3">
                    <Form.Group className="modal-form-group">
                      <Form.Check
                        type="switch"
                        id="active-switch"
                        label={isSKCategory ? 'Active SK Member' : 'Active Official'}
                        checked={formData.active}
                        onChange={(e) => handleInputChange('active', e.target.checked)}
                      />
                    </Form.Group>
                  </div>
                </>
              ) : (
                <>
                  {/* Simple form for other categories (tanod, bhw, staff) */}
                  <Row>
                    <Col md={6}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.name || ''}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          isInvalid={!!errors.name}
                          className="modal-form-control"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Position *</Form.Label>
                        <Form.Select
                          value={formData.position}
                          onChange={(e) => handleInputChange('position', e.target.value)}
                          isInvalid={!!errors.position}
                          className="modal-form-control"
                        >
                          <option value="">Select Position</option>
                          {positionOptions.map((position) => (
                            <option key={position} value={position}>
                              {position}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.position}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Term Start</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.term_start || ''}
                          onChange={(e) => handleInputChange('term_start', e.target.value)}
                          className="modal-form-control"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="modal-form-group">
                        <Form.Label className="modal-form-label">Term End</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.term_end || ''}
                          onChange={(e) => handleInputChange('term_end', e.target.value)}
                          isInvalid={!!errors.term_end}
                          className="modal-form-control"
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.term_end}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Contact Information</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Phone number or email"
                      value={formData.contact || ''}
                      onChange={(e) => handleInputChange('contact', e.target.value)}
                      className="modal-form-control"
                    />
                  </Form.Group>
                  <Form.Group className="modal-form-group">
                    <Form.Check
                      type="switch"
                      id="active-switch-simple"
                      label="Active"
                      checked={formData.active}
                      onChange={(e) => handleInputChange('active', e.target.checked)}
                    />
                  </Form.Group>
                </>
              )}
            </Col>

            <Col md={4}>
              <Form.Group className="modal-form-group">
                <Form.Label className="modal-form-label">Photo</Form.Label>
                <div className="text-center">
                  {/* Image preview area */}
                  <div className="mb-3" style={{ minHeight: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-surface)', borderRadius: '8px', padding: '10px' }}>
                    {(photoPreview || official?.photo_url) ? (
                      <img
                        src={photoPreview || official?.photo_url || ''}
                        alt="Photo"
                        className="rounded"
                        style={{
                          maxHeight: '200px',
                          maxWidth: '100%',
                          width: 'auto',
                          height: 'auto',
                          objectFit: 'contain',
                          border: photoPreview ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
                          boxShadow: photoPreview ? '0 4px 12px rgba(37, 99, 235, 0.3)' : '0 2px 4px rgba(0, 0, 0, 0.1)',
                          display: 'block'
                        }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          const imageUrl = photoPreview || official?.photo_url || '';
                          console.error('Failed to load image:', {
                            url: imageUrl,
                            isDataUrl: imageUrl.startsWith('data:'),
                            photoPath: official?.photo_path
                          });
                          // Only hide if it's not a data URL (preview)
                          if (!imageUrl.startsWith('data:')) {
                            target.style.display = 'none';
                            setErrors(prev => ({ ...prev, photo: `Failed to load image from: ${imageUrl}` }))
                          }
                        }}
                        onLoad={() => {
                          // Clear any errors when image loads successfully
                          if (errors.photo) {
                            setErrors(prev => ({ ...prev, photo: '' }))
                          }
                        }}
                      />
                    ) : (
                      <div className="text-center text-brand-muted" style={{ padding: '40px' }}>
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
                        <small>No photo selected</small>
                      </div>
                    )}
                  </div>

                  {photoPreview && (
                    <div className="alert alert-info mb-2 py-1 px-2" style={{ fontSize: '0.85rem' }}>
                      <i className="fas fa-info-circle me-1"></i>
                      New photo selected
                    </div>
                  )}

                  <Form.Control
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handlePhotoChange}
                    isInvalid={!!errors.photo}
                    className="modal-form-control"
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.photo}
                  </Form.Control.Feedback>
                  <Form.Text className="text-brand-muted d-block mt-1">
                    JPG, PNG, WEBP up to 5MB
                  </Form.Text>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            style={{
              color: '#1E293B',
              backgroundColor: '#F1F5F9',
              border: '1px solid #E2E8F0',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.75rem',
              fontWeight: '500',
              minWidth: '100px',
              opacity: loading ? 0.6 : 1
            }}
          >
            <i className="fas fa-times me-2"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="btn-brand-primary">
            <i className="fas fa-save me-2"></i>
            {loading
              ? 'Saving...'
              : (isEditing
                ? (isSKCategory ? 'Update SK Member' : isOfficialCategory ? 'Update Official' : 'Update Personnel')
                : (isSKCategory ? 'Add SK Member' : isOfficialCategory ? 'Add Official' : 'Add Personnel')
              )
            }
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
