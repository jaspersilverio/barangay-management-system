import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Container, Row, Col, Card, Tab, Nav, Button, Alert, Spinner } from 'react-bootstrap'
import { ArrowLeft, User, Syringe } from 'lucide-react'
import { getResident } from '../../services/residents.service'
import { getResidentVaccinations } from '../../services/vaccination.service'
import VaccinationTable from '../../components/vaccinations/VaccinationTable'
import AddVaccinationModal from '../../components/vaccinations/AddVaccinationModal'
import type { Resident, Vaccination } from '../../types'

export default function ResidentProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [resident, setResident] = useState<Resident | null>(null)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [loading, setLoading] = useState(true)
  const [vaccinationsLoading, setVaccinationsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddVaccination, setShowAddVaccination] = useState(false)
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null)

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
      console.error('Error loading vaccinations:', err)
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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString()
    } catch {
      return dateString
    }
  }

  const calculateAge = (birthdate: string) => {
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

  return (
    <div className="page-container page-sub">
      {/* Header */}
      <div className="d-flex align-items-center mb-4">
        <Button 
          variant="outline-secondary" 
          onClick={() => navigate('/residents')}
          className="me-3"
        >
          <ArrowLeft size={16} />
        </Button>
        <div>
          <h1 className="h3 mb-0">{resident.first_name} {resident.last_name}</h1>
          <p className="text-muted mb-0">Resident Profile</p>
        </div>
      </div>

      <Row>
        {/* Resident Information Card */}
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <User size={20} className="me-2" />
                Personal Information
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <strong>Full Name:</strong>
                <div>{resident.first_name} {resident.middle_name} {resident.last_name}</div>
              </div>
              
              <div className="mb-3">
                <strong>Age:</strong>
                <div>{calculateAge(resident.birthdate)} years old</div>
              </div>
              
              <div className="mb-3">
                <strong>Birthdate:</strong>
                <div>{formatDate(resident.birthdate)}</div>
              </div>
              
              <div className="mb-3">
                <strong>Sex:</strong>
                <div className="text-capitalize">{resident.sex}</div>
              </div>
              
              <div className="mb-3">
                <strong>Relationship to Head:</strong>
                <div>{resident.relationship_to_head}</div>
              </div>
              
              <div className="mb-3">
                <strong>Occupation Status:</strong>
                <div className="text-capitalize">{resident.occupation_status}</div>
              </div>
              
              {resident.is_pwd && (
                <div className="mb-3">
                  <span className="badge bg-warning">Person with Disability</span>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Main Content */}
        <Col lg={8}>
          <Card>
            <Card.Header>
              <Tab.Container defaultActiveKey="vaccinations">
                <Nav variant="tabs" className="border-0">
                  <Nav.Item>
                    <Nav.Link eventKey="vaccinations">
                      <Syringe size={16} className="me-2" />
                      Vaccinations
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="details">
                      <User size={16} className="me-2" />
                      Details
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Tab.Container>
            </Card.Header>
            <Card.Body>
              <Tab.Container defaultActiveKey="vaccinations">
                <Tab.Content>
                  {/* Vaccinations Tab */}
                  <Tab.Pane eventKey="vaccinations">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Vaccination Records</h5>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => setShowAddVaccination(true)}
                      >
                        <Syringe size={16} className="me-2" />
                        Add Vaccination
                      </Button>
                    </div>
                    
                    <VaccinationTable
                      vaccinations={vaccinations}
                      onEdit={handleEditVaccination}
                      onRefresh={loadVaccinations}
                      loading={vaccinationsLoading}
                    />
                  </Tab.Pane>

                  {/* Details Tab */}
                  <Tab.Pane eventKey="details">
                    <Row>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Created:</strong>
                          <div>{formatDate(resident.created_at)}</div>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div className="mb-3">
                          <strong>Last Updated:</strong>
                          <div>{formatDate(resident.updated_at)}</div>
                        </div>
                      </Col>
                    </Row>
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Add/Edit Vaccination Modal */}
      <AddVaccinationModal
        show={showAddVaccination}
        onHide={handleCloseModal}
        onSuccess={handleVaccinationSuccess}
        residentId={resident.id}
        vaccination={editingVaccination}
        residentName={`${resident.first_name} ${resident.last_name}`}
      />
    </div>
  )
}
