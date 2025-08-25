import React, { useState, useEffect } from 'react'
import { Modal, Form, Button, Alert, Spinner } from 'react-bootstrap'
import type { User, CreateUserPayload, UpdateUserPayload, Role, PurokOption } from '../../services/users.service'
import { getRoles, getPuroks } from '../../services/users.service'

interface UserFormModalProps {
  show: boolean
  onHide: () => void
  user?: User | null
  onSubmit: (payload: CreateUserPayload | UpdateUserPayload) => Promise<void>
  loading: boolean
}

export default function UserFormModal({ show, onHide, user, onSubmit, loading }: UserFormModalProps) {
  const [formData, setFormData] = useState<CreateUserPayload>({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    assigned_purok_id: undefined,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [roles, setRoles] = useState<Role[]>([])
  const [puroks, setPuroks] = useState<PurokOption[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const isEdit = !!user

  useEffect(() => {
    if (show) {
      loadFormData()
    }
  }, [show, user])

  const loadFormData = async () => {
    try {
      setLoadingData(true)
      
      // Load roles and puroks
      const [rolesRes, puroksRes] = await Promise.all([
        getRoles(),
        getPuroks()
      ])
      
      if (rolesRes.success) setRoles(rolesRes.data)
      if (puroksRes.success) setPuroks(puroksRes.data)

      // Set form data
      if (user) {
        setFormData({
          name: user.name,
          email: user.email,
          password: '', // Don't prefill password
          role: user.role,
          assigned_purok_id: user.assigned_purok_id || undefined,
        })
      } else {
        setFormData({
          name: '',
          email: '',
          password: '',
          role: 'staff',
          assigned_purok_id: undefined,
        })
      }
      
      setErrors({})
    } catch (error) {
      console.error('Error loading form data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleInputChange = (field: keyof CreateUserPayload, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!isEdit && !formData.password.trim()) {
      newErrors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (!formData.role) {
      newErrors.role = 'Role is required'
    }

    if (formData.role === 'purok_leader' && !formData.assigned_purok_id) {
      newErrors.assigned_purok_id = 'Purok assignment is required for purok leaders'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const payload = isEdit 
        ? { ...formData, password: formData.password || undefined }
        : formData
      
      await onSubmit(payload)
      onHide()
    } catch (error) {
      console.error('Error submitting form:', error)
    }
  }

  const getRoleLabel = (roleValue: string) => {
    const role = roles.find(r => r.value === roleValue)
    return role ? role.label : roleValue
  }

  if (loadingData) {
    return (
      <Modal show={show} onHide={onHide} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Loading...</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p className="mt-2">Loading form data...</p>
        </Modal.Body>
      </Modal>
    )
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{isEdit ? 'Edit User' : 'Create New User'}</Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Name *</Form.Label>
            <Form.Control
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              isInvalid={!!errors.name}
              placeholder="Enter full name"
            />
            <Form.Control.Feedback type="invalid">
              {errors.name}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email *</Form.Label>
            <Form.Control
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              isInvalid={!!errors.email}
              placeholder="Enter email address"
            />
            <Form.Control.Feedback type="invalid">
              {errors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>{isEdit ? 'Password (leave blank to keep current)' : 'Password *'}</Form.Label>
            <Form.Control
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              isInvalid={!!errors.password}
              placeholder={isEdit ? "Enter new password or leave blank" : "Enter password"}
            />
            <Form.Control.Feedback type="invalid">
              {errors.password}
            </Form.Control.Feedback>
            {isEdit && (
              <Form.Text className="text-muted">
                Leave password blank to keep the current password
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Role *</Form.Label>
            <Form.Select
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              isInvalid={!!errors.role}
            >
              {roles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.role}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Assigned Purok</Form.Label>
            <Form.Select
              value={formData.assigned_purok_id || ''}
              onChange={(e) => handleInputChange('assigned_purok_id', e.target.value ? Number(e.target.value) : undefined)}
              isInvalid={!!errors.assigned_purok_id}
            >
              <option value="">Select a purok (optional)</option>
              {puroks.map((purok) => (
                <option key={purok.id} value={purok.id}>
                  {purok.name}
                </option>
              ))}
            </Form.Select>
            <Form.Control.Feedback type="invalid">
              {errors.assigned_purok_id}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              Required for Purok Leader role
            </Form.Text>
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="primary" 
            disabled={loading}
            className="d-flex align-items-center gap-2"
          >
            {loading && <Spinner animation="border" size="sm" />}
            {isEdit ? 'Update User' : 'Create User'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
