import { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { Shield, Plus } from 'lucide-react'
import { getVaccinations, getVaccinationStatistics, COMMON_VACCINES, VACCINATION_STATUSES, AGE_GROUPS } from '../services/vaccination.service'
import { usePuroks } from '../context/PurokContext'
import { useDashboard } from '../context/DashboardContext'
import VaccinationTable from '../components/vaccinations/VaccinationTable'
import AddVaccinationModal from '../components/vaccinations/AddVaccinationModal'
import type { Vaccination, VaccinationFilters, VaccinationStatistics } from '../types'

export default function ImmunizationPage() {
  const { puroks } = usePuroks()
  const { refreshData: refreshDashboard } = useDashboard()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [statistics, setStatistics] = useState<VaccinationStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null)

  // Filters
  const [filters, setFilters] = useState<VaccinationFilters>({
    search: '',
    status: '',
    vaccine_name: '',
    purok_id: undefined,
    age_group: undefined,
    date_from: '',
    date_to: '',
    per_page: 15,
    page: 1
  })

  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  })

  useEffect(() => {
    loadVaccinations()
    loadStatistics()
  }, [filters])

  const loadVaccinations = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getVaccinations(filters)
      if (response.success) {
        setVaccinations(response.data.data)
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        })
      } else {
        setError('Failed to load immunization records')
      }
    } catch (err) {
      console.error('Error loading immunizations:', err)
      setError('Failed to load immunization records')
    } finally {
      setLoading(false)
    }
  }

  const loadStatistics = async () => {
    try {
      const response = await getVaccinationStatistics({
        purok_id: filters.purok_id,
        date_from: filters.date_from,
        date_to: filters.date_to
      })
      if (response.success) {
        setStatistics(response.data)
      }
    } catch (err) {
      console.error('Error loading statistics:', err)
    }
  }

  const handleFilterChange = (key: keyof VaccinationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleVaccinationSuccess = async () => {
    loadVaccinations()
    loadStatistics()
    setEditingVaccination(null)
    await refreshDashboard()
  }

  const handleVaccinationRefresh = async () => {
    loadVaccinations()
    loadStatistics()
    await refreshDashboard()
  }

  const handleEditVaccination = (vaccination: Vaccination) => {
    setEditingVaccination(vaccination)
    setShowAddModal(true)
  }

  const handleCloseModal = () => {
    setShowAddModal(false)
    setEditingVaccination(null)
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      vaccine_name: '',
      purok_id: undefined,
      age_group: undefined,
      date_from: '',
      date_to: '',
      per_page: 15,
      page: 1
    })
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-brand-primary">
            <Shield size={24} className="me-2" />
            Immunization Records
          </h1>
          <p className="text-brand-muted mb-0">Manage and track immunization records across all residents</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="btn-brand-primary">
          <Plus size={16} className="me-2" />
          Add Immunization
        </Button>
      </div>

      {statistics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-brand-primary mb-1">{statistics.total_vaccinations}</h3>
                <p className="text-brand-muted mb-0">Total Immunizations</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-success mb-1">{statistics.by_status.Completed || 0}</h3>
                <p className="text-brand-muted mb-0">Completed</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-warning mb-1">{statistics.by_status.Pending || 0}</h3>
                <p className="text-brand-muted mb-0">Pending</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-info mb-1">{statistics.by_status.Scheduled || 0}</h3>
                <p className="text-brand-muted mb-0">Scheduled</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card className="card-modern">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Filters</h5>
            <Button variant="outline-secondary" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <option value="">All Statuses</option>
                  {VACCINATION_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Vaccine</Form.Label>
                <Form.Select
                  value={filters.vaccine_name}
                  onChange={(e) => handleFilterChange('vaccine_name', e.target.value)}
                >
                  <option value="">All Vaccines</option>
                  {COMMON_VACCINES.map(vaccine => (
                    <option key={vaccine} value={vaccine}>{vaccine}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>Purok</Form.Label>
                <Form.Select
                  value={filters.purok_id || ''}
                  onChange={(e) => handleFilterChange('purok_id', e.target.value || undefined)}
                >
                  <option value="">All Puroks</option>
                  {puroks.map((purok) => (
                    <option key={purok.id} value={purok.id}>{purok.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Age Group</Form.Label>
                <Form.Select
                  value={filters.age_group || ''}
                  onChange={(e) => handleFilterChange('age_group', e.target.value || undefined)}
                >
                  <option value="">All Ages</option>
                  {AGE_GROUPS.map(group => (
                    <option key={group.value} value={group.value}>{group.label}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="card-modern mt-4">
        <Card.Body>
          <VaccinationTable
            vaccinations={vaccinations}
            onEdit={handleEditVaccination}
            onRefresh={handleVaccinationRefresh}
            loading={loading}
          />

          {pagination.total > 0 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-brand-muted">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} records
              </div>
              <div>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.current_page === 1}
                  onClick={() => handlePageChange(pagination.current_page - 1)}
                  className="me-2"
                >
                  Previous
                </Button>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  disabled={pagination.current_page === pagination.last_page}
                  onClick={() => handlePageChange(pagination.current_page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>

      <AddVaccinationModal
        show={showAddModal}
        onHide={handleCloseModal}
        onSuccess={handleVaccinationSuccess}
        residentId={undefined}
        vaccination={editingVaccination}
        residentName={undefined}
      />
    </div>
  )
}

