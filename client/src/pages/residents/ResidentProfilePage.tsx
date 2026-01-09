import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Tab, Nav, Button, Alert, Spinner, Badge } from 'react-bootstrap'
import { ArrowLeft, User, Syringe, Home, Mail, Phone, IdCard, Briefcase, GraduationCap, FileText, MapPin } from 'lucide-react'
import { getResident, updateResident } from '../../services/residents.service'
import { getResidentVaccinations } from '../../services/vaccination.service'
import VaccinationTable from '../../components/vaccinations/VaccinationTable'
import AddVaccinationModal from '../../components/vaccinations/AddVaccinationModal'
import ResidentFormModal, { type ResidentFormValues } from '../../components/residents/ResidentFormModal'
import { useAuth } from '../../context/AuthContext'
import type { Resident, Vaccination } from '../../types'

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [resident, setResident] = useState<Resident | null>(null)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [vaccinationsLoading, setVaccinationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddVaccination, setShowAddVaccination] = useState(false)
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const canManage = user?.role === 'admin' || user?.role === 'purok_leader' || user?.role === 'staff'

  useEffect(() => {
    if (id) {
      loadResident()
      loadVaccinations()
    }
  }, [id])

  const loadResident = async () => {
    if (!id) return

    try {
      setLoading(true)
      const response = await getResident(id)
      if (response.success) {
        setResident(response.data)
      } else {
        setError('Failed to load resident information')
      }
    } catch (err) {
      console.error('Error loading resident:', err)
      setError('Failed to load resident information')
    } finally {
      setLoading(false)
    }
  }

  const loadVaccinations = async () => {
    if (!id) return

    try {
      setVaccinationsLoading(true)
      const response = await getResidentVaccinations(parseInt(id))
      if (response.success) {
        setVaccinations(response.data)
      }
    } catch (err) {
      console.error('Error loading vaccinations', err)
    } finally {
      setVaccinationsLoading(false)
    }
  }

  const handleVaccinationSuccess = () => {
    loadVaccinations()
    setEditingVaccination(null)
  }

  const handleEditVaccination = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination)
    setShowAddVaccination(true)
  }

  const handleCloseModal = () => {
    setShowAddVaccination(false)
    setEditingVaccination(null)
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    } catch {
      return dateString
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return dateString
    }
  }

  const calculateAge = (birthdate: string | undefined) => {
    if (!birthdate) return 'Unknown'
    try {
      const today = new Date()
      const birth = new Date(birthdate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      
      return age
    } catch {
      return 'Unknown'
    }
  }

  const formatFullName = (resident: Resident) => {
    const lastName = resident.last_name || ''
    const firstName = resident.first_name || ''
    const middleName = resident.middle_name || ''
    const suffix = resident.suffix || ''
    
    let name = lastName
    if (firstName || middleName || suffix) {
      name += ','
      if (firstName) name += ' ' + firstName
      if (middleName) name += ' ' + middleName
      if (suffix) name += ' ' + suffix
    }
    return name.trim() || `${firstName} ${lastName}`.trim()
  }

  const getResidentStatusBadge = (status: string | undefined) => {
    if (!status) return <Badge bg="success">Active</Badge>
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge bg="success">Active</Badge>
      case 'deceased':
        return <Badge bg="dark">Deceased</Badge>
      case 'transferred':
        return <Badge bg="warning" text="dark">Transferred</Badge>
      case 'inactive':
        return <Badge bg="secondary">Inactive</Badge>
      default:
        return <Badge bg="success">Active</Badge>
    }
  }

  if (loading) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading resident information...</p>
        </div>
      </Container>
    )
  }

  if (error || !resident) {
    return (
      <Container className="py-4">
        <Alert variant="danger">
          {error || 'Resident not found'}
        </Alert>
        <Button variant="outline-primary" onClick={() => navigate('/residents')}>
          <ArrowLeft size={16} className="me-2" />
          Back to Residents
        </Button>
      </Container>
    )
  }

  const fullName = formatFullName(resident)
  const age = calculateAge(resident.birthdate)

  return (
    <div className="page-container page-sub">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex align-items-center">
          <Button 
            variant="outline-secondary" 
            onClick={() => navigate('/residents')}
            className="me-3"
          >
            <ArrowLeft size={16} />
          </Button>
          <div className="flex-grow-1">
            <h1 className="h3 mb-1 text-brand-primary">{fullName}</h1>
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <span className="text-muted">Resident Profile</span>
              {resident.is_head_of_household && (
                <Badge bg="primary" className="rounded-pill">Head of Household</Badge>
              )}
              {getResidentStatusBadge(resident.resident_status)}
            </div>
          </div>
          {canManage && (
            <Button 
              variant="primary"
              onClick={() => setShowEditModal(true)}
              className="btn-brand-primary"
            >
              <i className="fas fa-edit me-2"></i>
              Edit Resident
            </Button>
          )}
        </div>
      </div>

      <Row className="g-4">
        {/* Left Column - Photo and Quick Info */}
        <Col lg={4}>
          {/* Photo Card */}
          <Card className="mb-4 shadow-sm">
            <Card.Body className="text-center p-4">
              {resident.photo_url ? (
                <img
                  src={resident.photo_url}
                  alt={fullName}
                  className="rounded-circle mb-3"
                  style={{
                    width: '200px',
                    height: '200px',
                    objectFit: 'cover',
                    border: '4px solid #dee2e6'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
              ) : null}
              {!resident.photo_url && (
                <div
                  className="rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center"
                  style={{
                    width: '200px',
                    height: '200px',
                    backgroundColor: '#e9ecef',
                    fontSize: '80px',
                    color: '#6c757d'
                  }}
                >
                  <i className="fas fa-user"></i>
                </div>
              )}
              <h4 className="mb-1">{fullName}</h4>
              <p className="text-muted mb-3">
                {age !== 'Unknown' ? `${age} years old` : 'Age unknown'}
              </p>
              
              {/* Quick Info */}
              <div className="text-start">
                <div className="mb-2">
                  <small className="text-muted d-block">Sex</small>
                  <strong className="text-capitalize">{resident.sex || 'N/A'}</strong>
                </div>
                <div className="mb-2">
                  <small className="text-muted d-block">Civil Status</small>
                  <strong className="text-capitalize">{resident.civil_status || 'N/A'}</strong>
                </div>
                {resident.household && (
                  <div className="mb-2">
                    <small className="text-muted d-block">Purok</small>
                    <strong>{resident.household.purok?.name || 'N/A'}</strong>
                  </div>
                )}
              </div>
            </Card.Body>
          </Card>

          {/* Classifications Card */}
          {(resident.is_pwd || resident.is_senior || resident.is_solo_parent || resident.is_pregnant) && (
            <Card className="mb-4 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h6 className="mb-0">
                  <i className="fas fa-tags me-2"></i>
                  Classifications
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-column gap-2">
                  {resident.is_senior && (
                    <div className="d-flex align-items-center">
                      <Badge bg="warning" text="dark" className="me-2">Senior Citizen</Badge>
                      <small className="text-muted">Age 60 and above</small>
                    </div>
                  )}
                  {resident.is_pwd && (
                    <div className="d-flex align-items-center">
                      <Badge bg="danger" className="me-2">PWD</Badge>
                      <small className="text-muted">Person with Disability</small>
                    </div>
                  )}
                  {resident.is_solo_parent && (
                    <div className="d-flex align-items-center">
                      <Badge bg="info" className="me-2">Solo Parent</Badge>
                      <small className="text-muted">Single parent with dependents</small>
                    </div>
                  )}
                  {resident.is_pregnant && (
                    <div className="d-flex align-items-center">
                      <Badge bg="success" className="me-2">Pregnant</Badge>
                      <small className="text-muted">Expecting mother</small>
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        {/* Right Column - Detailed Information */}
        <Col lg={8}>
          <Tab.Container defaultActiveKey="personal">
            <Card className="shadow-sm">
              <Card.Header className="bg-white border-bottom">
                <Nav variant="tabs" className="border-0">
                  <Nav.Item>
                    <Nav.Link eventKey="personal" className="text-brand-primary">
                      <User size={16} className="me-2" />
                      Personal Information
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="household" className="text-brand-primary">
                      <Home size={16} className="me-2" />
                      Household
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="vaccinations" className="text-brand-primary">
                      <Syringe size={16} className="me-2" />
                      Vaccinations
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Header>
              <Card.Body className="p-4">
                <Tab.Content>
                  {/* Personal Information Tab */}
                  <Tab.Pane eventKey="personal">
                    <Row className="g-4">
                      {/* A. Personal Information */}
                      <Col md={12}>
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Header className="bg-primary text-white">
                            <h6 className="mb-0 fw-bold">A. Personal Information</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Full Name</label>
                                  <div className="info-value">{fullName}</div>
                                </div>
                              </Col>
                              <Col md={3}>
                                <div className="info-item">
                                  <label className="info-label">Sex</label>
                                  <div className="info-value text-capitalize">{resident.sex || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={3}>
                                <div className="info-item">
                                  <label className="info-label">Age</label>
                                  <div className="info-value">
                                    {age !== 'Unknown' ? `${age} years old` : 'N/A'}
                                  </div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Birthdate</label>
                                  <div className="info-value">{formatDate(resident.birthdate)}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Place of Birth</label>
                                  <div className="info-value">{resident.place_of_birth || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Nationality</label>
                                  <div className="info-value">{resident.nationality || 'Filipino'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Religion</label>
                                  <div className="info-value">{resident.religion || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Civil Status</label>
                                  <div className="info-value text-capitalize">{resident.civil_status || 'N/A'}</div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* B. Contact & Identity */}
                      <Col md={12}>
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Header className="bg-info text-white">
                            <h6 className="mb-0 fw-bold">B. Contact & Identity</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <Phone size={14} className="me-1" />
                                    Contact Number
                                  </label>
                                  <div className="info-value">{resident.contact_number || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <Mail size={14} className="me-1" />
                                    Email Address
                                  </label>
                                  <div className="info-value">
                                    {resident.email ? (
                                      <a href={`mailto:${resident.email}`}>{resident.email}</a>
                                    ) : 'N/A'}
                                  </div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <IdCard size={14} className="me-1" />
                                    Valid ID Type
                                  </label>
                                  <div className="info-value">{resident.valid_id_type || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <IdCard size={14} className="me-1" />
                                    Valid ID Number
                                  </label>
                                  <div className="info-value font-monospace small">
                                    {resident.valid_id_number || 'N/A'}
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* C. Address & Household Assignment */}
                      <Col md={12}>
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Header className="bg-success text-white">
                            <h6 className="mb-0 fw-bold">C. Address & Household Assignment</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Household Role</label>
                                  <div className="info-value">
                                    {resident.is_head_of_household ? (
                                      <Badge bg="success" className="rounded-pill">Head</Badge>
                                    ) : resident.relationship_to_head ? (
                                      <Badge bg="secondary" className="rounded-pill">{resident.relationship_to_head}</Badge>
                                    ) : (
                                      <Badge bg="warning" text="dark" className="rounded-pill">Unassigned</Badge>
                                    )}
                                  </div>
                                </div>
                              </Col>
                              {resident.household && (
                                <>
                                  <Col md={6}>
                                    <div className="info-item">
                                      <label className="info-label">Purok</label>
                                      <div className="info-value">
                                        <Badge bg="info" className="rounded-pill">
                                          {resident.household.purok?.name || 'N/A'}
                                        </Badge>
                                      </div>
                                    </div>
                                  </Col>
                                  <Col md={12}>
                                    <div className="info-item">
                                      <label className="info-label">
                                        <MapPin size={14} className="me-1" />
                                        Household Address
                                      </label>
                                      <div className="info-value">{resident.household.address || 'N/A'}</div>
                                    </div>
                                  </Col>
                                  <Col md={6}>
                                    <div className="info-item">
                                      <label className="info-label">Head of Household</label>
                                      <div className="info-value">
                                        {resident.is_head_of_household ? (
                                          <span className="text-primary fw-semibold">Self (Head)</span>
                                        ) : (
                                          resident.household.head_name || 'N/A'
                                        )}
                                      </div>
                                    </div>
                                  </Col>
                                </>
                              )}
                              {!resident.household && (
                                <Col md={12}>
                                  <Alert variant="warning" className="mb-0">
                                    <i className="fas fa-exclamation-triangle me-2"></i>
                                    This resident is not assigned to any household.
                                  </Alert>
                                </Col>
                              )}
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* D. Relationship & Socio-Economic Info */}
                      <Col md={12}>
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Header className="bg-warning text-dark">
                            <h6 className="mb-0 fw-bold">D. Relationship & Socio-Economic Information</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Relationship to Head</label>
                                  <div className="info-value">
                                    {resident.relationship_to_head || (resident.is_head_of_household ? 'Head' : 'N/A')}
                                  </div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Occupation Status</label>
                                  <div className="info-value text-capitalize">{resident.occupation_status || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <Briefcase size={14} className="me-1" />
                                    Employer / Workplace
                                  </label>
                                  <div className="info-value">{resident.employer_workplace || 'N/A'}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <GraduationCap size={14} className="me-1" />
                                    Educational Attainment
                                  </label>
                                  <div className="info-value">{resident.educational_attainment || 'N/A'}</div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* E. Special Classifications */}
                      {(resident.is_pwd || resident.is_senior || resident.is_solo_parent || resident.is_pregnant) && (
                        <Col md={12}>
                          <Card className="border-0 shadow-sm mb-3">
                            <Card.Header className="bg-danger text-white">
                              <h6 className="mb-0 fw-bold">E. Special Classifications</h6>
                            </Card.Header>
                            <Card.Body>
                              <Row className="g-3">
                                <Col md={6}>
                                  <div className="d-flex align-items-center">
                                    <input
                                      type="checkbox"
                                      checked={resident.is_senior || false}
                                      disabled
                                      className="form-check-input me-2"
                                      style={{ cursor: 'not-allowed' }}
                                    />
                                    <label className="fw-semibold mb-0">Senior Citizen</label>
                                    {resident.is_senior && (
                                      <Badge bg="warning" text="dark" className="ms-2">Age 60+</Badge>
                                    )}
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="d-flex align-items-center">
                                    <input
                                      type="checkbox"
                                      checked={resident.is_pwd || false}
                                      disabled
                                      className="form-check-input me-2"
                                      style={{ cursor: 'not-allowed' }}
                                    />
                                    <label className="fw-semibold mb-0">Person With Disability (PWD)</label>
                                    {resident.is_pwd && (
                                      <Badge bg="danger" className="ms-2">PWD</Badge>
                                    )}
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="d-flex align-items-center">
                                    <input
                                      type="checkbox"
                                      checked={resident.is_solo_parent || false}
                                      disabled
                                      className="form-check-input me-2"
                                      style={{ cursor: 'not-allowed' }}
                                    />
                                    <label className="fw-semibold mb-0">Solo Parent</label>
                                    {resident.is_solo_parent && (
                                      <Badge bg="info" className="ms-2">Solo Parent</Badge>
                                    )}
                                  </div>
                                </Col>
                                <Col md={6}>
                                  <div className="d-flex align-items-center">
                                    <input
                                      type="checkbox"
                                      checked={resident.is_pregnant || false}
                                      disabled
                                      className="form-check-input me-2"
                                      style={{ cursor: 'not-allowed' }}
                                    />
                                    <label className="fw-semibold mb-0">Pregnant</label>
                                    {resident.is_pregnant && (
                                      <Badge bg="success" className="ms-2">Pregnant</Badge>
                                    )}
                                  </div>
                                </Col>
                              </Row>
                            </Card.Body>
                          </Card>
                        </Col>
                      )}

                      {/* F. Resident Status & Notes */}
                      <Col md={12}>
                        <Card className="border-0 shadow-sm mb-3">
                          <Card.Header className="bg-secondary text-white">
                            <h6 className="mb-0 fw-bold">F. Resident Status & Notes</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Resident Status</label>
                                  <div className="info-value">
                                    {getResidentStatusBadge(resident.resident_status)}
                                  </div>
                                </div>
                              </Col>
                              <Col md={12}>
                                <div className="info-item">
                                  <label className="info-label">
                                    <FileText size={14} className="me-1" />
                                    Remarks / Notes
                                  </label>
                                  <div className="info-value">
                                    {resident.remarks ? (
                                      <div className="border rounded p-3 bg-light" style={{ whiteSpace: 'pre-wrap' }}>
                                        {resident.remarks}
                                      </div>
                                    ) : (
                                      <span className="text-muted">No remarks</span>
                                    )}
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>

                      {/* System Information */}
                      <Col md={12}>
                        <Card className="border-0 shadow-sm">
                          <Card.Header className="bg-dark text-white">
                            <h6 className="mb-0 fw-bold">System Information</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row className="g-3">
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Registered On</label>
                                  <div className="info-value">{formatDateTime(resident.created_at)}</div>
                                </div>
                              </Col>
                              <Col md={6}>
                                <div className="info-item">
                                  <label className="info-label">Last Updated</label>
                                  <div className="info-value">{formatDateTime(resident.updated_at)}</div>
                                </div>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Tab.Pane>

                  {/* Household Tab */}
                  <Tab.Pane eventKey="household">
                    {resident.household ? (
                      <Card className="border-0 shadow-sm">
                        <Card.Header className="bg-success text-white">
                          <h6 className="mb-0 fw-bold">Household Information</h6>
                        </Card.Header>
                        <Card.Body>
                          <Row className="g-3">
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Household ID</label>
                                <div className="info-value">#{resident.household.id}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Purok</label>
                                <div className="info-value">
                                  <Badge bg="info" className="rounded-pill">
                                    {resident.household.purok?.name || 'N/A'}
                                  </Badge>
                                </div>
                              </div>
                            </Col>
                            <Col md={12}>
                              <div className="info-item">
                                <label className="info-label">
                                  <MapPin size={14} className="me-1" />
                                  Address
                                </label>
                                <div className="info-value">{resident.household.address || 'N/A'}</div>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="info-item">
                                <label className="info-label">Head of Household</label>
                                <div className="info-value">
                                  {resident.is_head_of_household ? (
                                    <span className="text-primary fw-semibold">Self (Head)</span>
                                  ) : (
                                    resident.household.head_name || 'N/A'
                                  )}
                                </div>
                              </div>
                            </Col>
                            <Col md={12}>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  onClick={() => navigate(`/households/${resident.household?.id}`)}
                                >
                                  <Home size={16} className="me-2" />
                                  View Household Details
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ) : (
                      <Alert variant="warning">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        This resident is not assigned to any household.
                      </Alert>
                    )}
                  </Tab.Pane>

                  {/* Vaccinations Tab */}
                  <Tab.Pane eventKey="vaccinations">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Vaccination Records</h5>
                      {canManage && (
                        <Button 
                          variant="primary" 
                          size="sm"
                          onClick={() => setShowAddVaccination(true)}
                          className="btn-brand-primary"
                        >
                          <Syringe size={16} className="me-2" />
                          Add Vaccination
                        </Button>
                      )}
                    </div>
                    
                    <VaccinationTable
                      vaccinations={vaccinations}
                      onEdit={canManage ? handleEditVaccination : () => {}}
                      onRefresh={loadVaccinations}
                      loading={vaccinationsLoading}
                    />
                  </Tab.Pane>
                </Tab.Content>
              </Card.Body>
            </Card>
          </Tab.Container>
        </Col>
      </Row>

      {/* Add/Edit Vaccination Modal */}
      {canManage && (
        <AddVaccinationModal
          show={showAddVaccination}
          onHide={handleCloseModal}
          onSuccess={handleVaccinationSuccess}
          residentId={resident.id}
          vaccination={editingVaccination}
          residentName={fullName}
        />
      )}

      {/* Edit Resident Modal */}
      {canManage && (
        <ResidentFormModal
          show={showEditModal}
          initial={{
            household_id: resident.household_id || null,
            first_name: resident.first_name,
            middle_name: resident.middle_name || '',
            last_name: resident.last_name,
            suffix: resident.suffix || null,
            sex: resident.sex,
            birthdate: resident.birthdate || '',
            place_of_birth: resident.place_of_birth || null,
            nationality: resident.nationality || null,
            religion: resident.religion || null,
            contact_number: resident.contact_number || null,
            email: resident.email || null,
            valid_id_type: resident.valid_id_type || null,
            valid_id_number: resident.valid_id_number || null,
            civil_status: resident.civil_status || 'single',
            relationship_to_head: resident.relationship_to_head || null,
            occupation_status: resident.occupation_status,
            employer_workplace: resident.employer_workplace || null,
            educational_attainment: resident.educational_attainment || null,
            is_pwd: !!resident.is_pwd,
            is_pregnant: !!resident.is_pregnant,
            resident_status: resident.resident_status || 'active',
            remarks: resident.remarks || null,
            photo_url: resident.photo_url || null,
          }}
          onSubmit={async (values: ResidentFormValues & { photo?: File }) => {
            try {
              const payload: any = {
                household_id: values.household_id ? Number(values.household_id) : null,
                first_name: values.first_name,
                middle_name: values.middle_name || undefined,
                last_name: values.last_name,
                suffix: values.suffix || undefined,
                sex: values.sex,
                birthdate: values.birthdate,
                place_of_birth: values.place_of_birth || undefined,
                nationality: values.nationality || undefined,
                religion: values.religion || undefined,
                contact_number: values.contact_number || undefined,
                email: values.email || undefined,
                valid_id_type: values.valid_id_type || undefined,
                valid_id_number: values.valid_id_number || undefined,
                civil_status: values.civil_status,
                relationship_to_head: values.relationship_to_head || undefined,
                occupation_status: values.occupation_status,
                employer_workplace: values.employer_workplace || undefined,
                educational_attainment: values.educational_attainment || undefined,
                is_pwd: !!values.is_pwd,
                is_pregnant: !!values.is_pregnant,
                resident_status: values.resident_status || 'active',
                remarks: values.remarks || undefined,
                photo: values.photo || undefined,
              }

              await updateResident(resident.id, payload)
              setShowEditModal(false)
              // Reload resident data
              await loadResident()
            } catch (error: any) {
              console.error('Error updating resident:', error)
              throw error
            }
          }}
          onHide={() => setShowEditModal(false)}
        />
      )}
    </div>
  )
}
