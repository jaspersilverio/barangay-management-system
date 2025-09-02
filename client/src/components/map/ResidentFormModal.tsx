import { useState, useEffect } from 'react'
import { Modal, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap'
import { type ResidentPayload, createResident, updateResident, getResident, searchResidents, linkResidentToHousehold } from '../../services/residents.service'

interface ResidentFormModalProps {
  show: boolean
  onHide: () => void
  householdId: number
  editingResidentId?: number | null
  onResidentSaved: () => void
}

interface SearchResult {
  id: number
  full_name: string
  age: number
  sex: string
  household_id: number | null
  household?: {
    id: number
    head_name: string
    address: string
    purok?: {
      id: number
      name: string
    }
  }
}

export default function ResidentFormModal({
  show,
  onHide,
  householdId,
  editingResidentId,
  onResidentSaved
}: ResidentFormModalProps) {
  const [formData, setFormData] = useState<ResidentPayload>({
    household_id: householdId,
    first_name: '',
    middle_name: '',
    last_name: '',
    sex: 'male',
    birthdate: '',
    relationship_to_head: '',
    occupation_status: 'employed',
    is_pwd: false
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Search functionality states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isLinking, setIsLinking] = useState(false)

  // Load resident data when editing
  useEffect(() => {
    if (show && editingResidentId) {
      loadResidentData()
      setShowForm(true) // Show form directly when editing
    } else if (show) {
      // Reset form for new resident
      setFormData({
        household_id: householdId,
        first_name: '',
        middle_name: '',
        last_name: '',
        sex: 'male',
        birthdate: '',
        relationship_to_head: '',
        occupation_status: 'employed',
        is_pwd: false
      })
      setError(null)
      setSuccess(null)
      setShowForm(false) // Start with search for new residents
      setSearchQuery('')
      setSearchResults([])
    }
  }, [show, editingResidentId, householdId])

  // Search residents when query changes
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300) // Debounce search

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setShowSearchResults(false)
    }
  }, [searchQuery])

  const performSearch = async () => {
    if (searchQuery.length < 2) return

    setIsSearching(true)
    try {
      const response = await searchResidents(searchQuery)
      if (response.success) {
        setSearchResults(response.data || [])
        setShowSearchResults(true)
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to search residents')
    } finally {
      setIsSearching(false)
    }
  }

  const handleLinkResident = async (resident: SearchResult) => {
    if (resident.household_id) {
      setError('This resident is already linked to a household.')
      return
    }

    setIsLinking(true)
    try {
      const response = await linkResidentToHousehold(resident.id, householdId)
      if (response.success) {
        setSuccess('Resident linked to household successfully!')
        setTimeout(() => {
          onResidentSaved()
          onHide()
        }, 1000)
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to link resident')
    } finally {
      setIsLinking(false)
    }
  }

  const handleShowForm = () => {
    setShowForm(true)
    setShowSearchResults(false)
    setSearchQuery('')
  }

  const loadResidentData = async () => {
    if (!editingResidentId) return

    setIsLoading(true)
    try {
      const response = await getResident(editingResidentId)
      if (response.success && response.data) {
        const resident = response.data
        setFormData({
          household_id: resident.household_id,
          first_name: resident.first_name,
          middle_name: resident.middle_name || '',
          last_name: resident.last_name,
          sex: resident.sex,
          birthdate: resident.birthdate,
          relationship_to_head: resident.relationship_to_head,
          occupation_status: resident.occupation_status,
          is_pwd: resident.is_pwd
        })
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to load resident data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (editingResidentId) {
        await updateResident(editingResidentId, formData)
        setSuccess('Resident updated successfully!')
      } else {
        await createResident(formData)
        setSuccess('Resident added successfully!')
      }

      // Reset form
      setFormData({
        household_id: householdId,
        first_name: '',
        middle_name: '',
        last_name: '',
        sex: 'male',
        birthdate: '',
        relationship_to_head: '',
        occupation_status: 'employed',
        is_pwd: false
      })

      // Notify parent component
      setTimeout(() => {
        onResidentSaved()
        onHide()
      }, 1000)
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to save resident')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof ResidentPayload, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {editingResidentId ? 'Edit Resident' : 'Add New Resident'}
        </Modal.Title>
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          {isLoading ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading resident data...</p>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
                  {success}
                </Alert>
              )}

              {/* Search Section - Only show for new residents */}
              {!editingResidentId && !showForm && (
                <div className="mb-4">
                  <h6 className="mb-3">🔍 Search for Existing Resident</h6>
                  <Form.Group className="mb-3 position-relative">
                    <Form.Label>Search if resident already registered</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Type resident name to search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setShowSearchResults(true)}
                    />
                    {isSearching && (
                      <div className="position-absolute top-50 end-0 translate-middle-y me-2">
                        <Spinner animation="border" size="sm" />
                      </div>
                    )}
                  </Form.Group>

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="border rounded p-2 mb-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {searchResults.map((resident) => (
                        <div
                          key={resident.id}
                          className="d-flex justify-content-between align-items-center p-2 border-bottom"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleLinkResident(resident)}
                        >
                          <div>
                            <strong>{resident.full_name}</strong>
                            <br />
                            <small className="text-muted">
                              Age: {resident.age} • {resident.sex}
                              {resident.household && (
                                <span className="text-warning"> • Already in household: {resident.household.head_name}</span>
                              )}
                            </small>
                          </div>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            disabled={resident.household_id !== null || isLinking}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLinkResident(resident)
                            }}
                          >
                            {isLinking ? (
                              <Spinner animation="border" size="sm" />
                            ) : (
                              'Link'
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* No Results Message */}
                  {showSearchResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="text-center p-3 border rounded">
                      <p className="text-muted mb-2">No residents found matching your search.</p>
                      <Button variant="primary" size="sm" onClick={handleShowForm}>
                        ➕ Add New Resident
                      </Button>
                    </div>
                  )}

                  {/* Add New Resident Button */}
                  {searchQuery.length < 2 && (
                    <div className="text-center">
                      <Button variant="outline-primary" onClick={handleShowForm}>
                        ➕ Add New Resident
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Form Section */}
              {showForm && (
                <>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.first_name}
                          onChange={(e) => handleInputChange('first_name', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.last_name}
                          onChange={(e) => handleInputChange('last_name', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Middle Name</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.middle_name || ''}
                          onChange={(e) => handleInputChange('middle_name', e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Sex *</Form.Label>
                        <Form.Select
                          value={formData.sex}
                          onChange={(e) => handleInputChange('sex', e.target.value)}
                          required
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Birthdate *</Form.Label>
                        <Form.Control
                          type="date"
                          value={formData.birthdate}
                          onChange={(e) => handleInputChange('birthdate', e.target.value)}
                          required
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Relationship to Head *</Form.Label>
                        <Form.Control
                          type="text"
                          value={formData.relationship_to_head}
                          onChange={(e) => handleInputChange('relationship_to_head', e.target.value)}
                          placeholder="e.g., Head, Spouse, Child, Parent"
                          required
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Occupation Status *</Form.Label>
                        <Form.Select
                          value={formData.occupation_status}
                          onChange={(e) => handleInputChange('occupation_status', e.target.value)}
                          required
                        >
                          <option value="employed">Employed</option>
                          <option value="unemployed">Unemployed</option>
                          <option value="student">Student</option>
                          <option value="retired">Retired</option>
                          <option value="other">Other</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Check
                          type="checkbox"
                          label="Person with Disability (PWD)"
                          checked={formData.is_pwd}
                          onChange={(e) => handleInputChange('is_pwd', e.target.checked)}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={isSaving || isLinking}>
            Cancel
          </Button>
          {showForm && (
            <Button 
              variant="primary" 
              type="submit" 
              disabled={isSaving || isLoading}
            >
              {isSaving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                editingResidentId ? 'Update Resident' : 'Add Resident'
              )}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  )
}
