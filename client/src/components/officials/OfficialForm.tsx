import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col } from 'react-bootstrap'
import { type Official, type CreateOfficialData, POSITION_OPTIONS } from '../../services/officials.service'

interface OfficialFormProps {
  show: boolean
  onHide: () => void
  official?: Official | null
  onSubmit: (data: CreateOfficialData) => Promise<void>
  loading: boolean
}

export default function OfficialForm({
  show,
  onHide,
  official,
  onSubmit,
  loading
}: OfficialFormProps) {
  const [formData, setFormData] = useState<CreateOfficialData>({
    name: '',
    position: '',
    term_start: '',
    term_end: '',
    contact: '',
    active: true
  })
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const isEditing = !!official

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

      setFormData({
        user_id: official.user_id,
        name: official.name,
        position: official.position,
        term_start: formatDateForInput(official.term_start),
        term_end: formatDateForInput(official.term_end),
        contact: official.contact || '',
        active: official.active
        // Note: photo is not included here - it will be added when user selects a new file
      })
      // Set preview to existing photo URL if available
      setPhotoPreview(official.photo_url || null)
    } else {
      setFormData({
        name: '',
        position: '',
        term_start: '',
        term_end: '',
        contact: '',
        active: true
      })
      setPhotoPreview(null)
    }
    setErrors({})
  }, [official, show])

  const handleInputChange = (field: keyof CreateOfficialData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
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
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
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
      // Debug: Log what we're sending
      console.log('Submitting form data:', {
        hasPhoto: !!formData.photo,
        photoType: formData.photo?.constructor?.name,
        isEditing: !!official,
        formDataKeys: Object.keys(formData)
      })
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
          {isEditing ? 'Edit Official' : 'Add New Official'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body className="modal-body-custom">
          <Row>
            <Col md={8}>
              <Row>
                <Col md={6}>
                  <Form.Group className="modal-form-group">
                    <Form.Label className="modal-form-label">Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
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
                      {POSITION_OPTIONS.map((position) => (
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
                      value={formData.term_start}
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
                      value={formData.term_end}
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
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                  className="modal-form-control"
                />
              </Form.Group>

              <Form.Group className="modal-form-group">
                <Form.Check
                  type="switch"
                  id="active-switch"
                  label="Active Official"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                  className="form-check-input"
                />
              </Form.Group>
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
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={handleClose} disabled={loading} className="btn-brand-secondary">
            <i className="fas fa-times me-2"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="btn-brand-primary">
            <i className="fas fa-save me-2"></i>
            {loading ? 'Saving...' : (isEditing ? 'Update Official' : 'Add Official')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
