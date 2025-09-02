import { useState, useEffect } from 'react'
import { Modal, Row, Col, Spinner, Alert } from 'react-bootstrap'
import { getResident } from '../../services/residents.service'

interface ResidentProfileModalProps {
  show: boolean
  onHide: () => void
  residentId: number
}

interface ResidentData {
  id: number
  household_id: number
  first_name: string
  middle_name?: string
  last_name: string
  full_name: string
  sex: string
  birthdate: string
  age: number
  relationship_to_head: string
  occupation_status: string
  is_pwd: boolean
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

export default function ResidentProfileModal({
  show,
  onHide,
  residentId
}: ResidentProfileModalProps) {
  const [resident, setResident] = useState<ResidentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (show && residentId) {
      loadResidentData()
    }
  }, [show, residentId])

  const loadResidentData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getResident(residentId)
      if (response.success && response.data) {
        setResident(response.data)
      }
    } catch (error: any) {
      setError(error?.response?.data?.message || 'Failed to load resident data')
    } finally {
      setIsLoading(false)
    }
  }

  const getSexLabel = (sex: string) => {
    return sex.charAt(0).toUpperCase() + sex.slice(1)
  }

  const getOccupationStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1)
  }

  const getAgeGroup = (age: number) => {
    if (age < 18) return 'Child'
    if (age < 60) return 'Adult'
    return 'Senior'
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Resident Profile</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading resident profile...</p>
          </div>
        ) : error ? (
          <Alert variant="danger">
            {error}
          </Alert>
        ) : resident ? (
          <div>
            {/* Header with name and photo placeholder */}
            <div className="text-center mb-4">
              <div 
                className="mx-auto mb-3 rounded-circle d-flex align-items-center justify-content-center"
                style={{
                  width: '80px',
                  height: '80px',
                  backgroundColor: '#e9ecef',
                  fontSize: '24px'
                }}
              >
                {resident.first_name.charAt(0)}{resident.last_name.charAt(0)}
              </div>
              <h4 className="mb-1">{resident.full_name}</h4>
              <p className="text-muted mb-0">
                {resident.age} years old • {getSexLabel(resident.sex)}
              </p>
            </div>

            {/* Personal Information */}
            <div className="card mb-3">
              <div className="card-header">
                <h6 className="mb-0">📋 Personal Information</h6>
              </div>
              <div className="card-body">
                <Row>
                  <Col md={6}>
                    <p><strong>Full Name:</strong> {resident.full_name}</p>
                    <p><strong>Sex:</strong> {getSexLabel(resident.sex)}</p>
                    <p><strong>Birthdate:</strong> {new Date(resident.birthdate).toLocaleDateString()}</p>
                    <p><strong>Age:</strong> {resident.age} years old ({getAgeGroup(resident.age)})</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Relationship to Head:</strong> {resident.relationship_to_head}</p>
                    <p><strong>Occupation Status:</strong> {getOccupationStatusLabel(resident.occupation_status)}</p>
                    <p><strong>PWD Status:</strong> 
                      <span className={`badge ms-2 ${resident.is_pwd ? 'bg-warning' : 'bg-success'}`}>
                        {resident.is_pwd ? 'Person with Disability' : 'No Disability'}
                      </span>
                    </p>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Household Information */}
            {resident.household && (
              <div className="card">
                <div className="card-header">
                  <h6 className="mb-0">🏠 Household Information</h6>
                </div>
                <div className="card-body">
                  <Row>
                    <Col md={6}>
                      <p><strong>Household Head:</strong> {resident.household.head_name}</p>
                      <p><strong>Address:</strong> {resident.household.address}</p>
                    </Col>
                    <Col md={6}>
                      <p><strong>Purok:</strong> {resident.household.purok?.name || 'Not assigned'}</p>
                      <p><strong>Household ID:</strong> #{resident.household.id}</p>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Alert variant="warning">
            No resident data found.
          </Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onHide}>
          Close
        </button>
      </Modal.Footer>
    </Modal>
  )
}
