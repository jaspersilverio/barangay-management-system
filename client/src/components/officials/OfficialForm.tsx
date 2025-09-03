import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col, Alert, Image } from 'react-bootstrap'
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
      setFormData({
        user_id: official.user_id,
        name: official.name,
        position: official.position,
        term_start: official.term_start || '',
        term_end: official.term_end || '',
        contact: official.contact || '',
        active: official.active
      })
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
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'Please select an image file' }))
        return
      }
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setErrors(prev => ({ ...prev, photo: 'Image size must be less than 2MB' }))
        return
      }

      setFormData(prev => ({ ...prev, photo: file }))
      setErrors(prev => ({ ...prev, photo: '' }))

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
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
      await onSubmit(formData)
      onHide()
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleClose = () => {
    setErrors({})
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {isEditing ? 'Edit Official' : 'Add New Official'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Row>
            <Col md={8}>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      isInvalid={!!errors.name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Position *</Form.Label>
                    <Form.Select
                      value={formData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      isInvalid={!!errors.position}
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
                  <Form.Group className="mb-3">
                    <Form.Label>Term Start</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.term_start}
                      onChange={(e) => handleInputChange('term_start', e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Term End</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.term_end}
                      onChange={(e) => handleInputChange('term_end', e.target.value)}
                      isInvalid={!!errors.term_end}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.term_end}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group className="mb-3">
                <Form.Label>Contact Information</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Phone number or email"
                  value={formData.contact}
                  onChange={(e) => handleInputChange('contact', e.target.value)}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="switch"
                  id="active-switch"
                  label="Active Official"
                  checked={formData.active}
                  onChange={(e) => handleInputChange('active', e.target.checked)}
                />
              </Form.Group>
            </Col>

            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Photo</Form.Label>
                <div className="text-center">
                  {photoPreview ? (
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      className="img-fluid rounded mb-2"
                      style={{ maxHeight: '200px', maxWidth: '100%' }}
                    />
                  ) : (
                    <div className="border rounded p-4 text-muted mb-2">
                      <div>📷</div>
                      <small>No photo selected</small>
                    </div>
                  )}
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    isInvalid={!!errors.photo}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.photo}
                  </Form.Control.Feedback>
                  <Form.Text className="text-muted">
                    JPG, PNG, GIF up to 2MB
                  </Form.Text>
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? 'Saving...' : (isEditing ? 'Update Official' : 'Add Official')}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
