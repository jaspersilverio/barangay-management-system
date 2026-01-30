import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Form, Button, Alert } from 'react-bootstrap'
import { Syringe, Filter, Download, Plus } from 'lucide-react'
import { getVaccinations, getVaccinationStatistics, COMMON_VACCINES, VACCINATION_STATUSES, AGE_GROUPS } from '../services/vaccination.service'
import { exportVaccinationsToPdf } from '../services/pdf.service'
import { exportVaccinationsCsv } from '../services/reports.service'
import { usePuroks } from '../context/PurokContext'
import { useDashboard } from '../context/DashboardContext'
import VaccinationTable from '../components/vaccinations/VaccinationTable'
import AddVaccinationModal from '../components/vaccinations/AddVaccinationModal'
import type { Vaccination, VaccinationFilters, VaccinationStatistics } from '../types'

export default function VaccinationsPage() {
  const { puroks } = usePuroks()
  const { refreshData: refreshDashboard } = useDashboard()
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [statistics, setStatistics] = useState<VaccinationStatistics | null>(null)
  const [loading, setLoading] = useState(true) // Start with true for immediate skeleton display
  const [error, setError] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingVaccination, setEditingVaccination] = useState<Vaccination | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null)

  // Separate input value from search query for smooth typing
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

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

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }))
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const loadVaccinations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getVaccinations(filters)
      if (response.success) {
        // Set data immediately - no delays
        setVaccinations(response.data.data)
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        })
      } else {
        setError('Failed to load vaccinations')
      }
    } catch (err) {
      console.error('Error loading vaccinations:', err)
      setError('Failed to load vaccinations')
    } finally {
      // Clear loading state immediately when data is ready
      setLoading(false)
    }
  }, [filters])

  const loadStatistics = useCallback(async () => {
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
  }, [filters.purok_id, filters.date_from, filters.date_to])

  useEffect(() => {
    loadVaccinations()
    loadStatistics()
  }, [loadVaccinations, loadStatistics])

  const handleFilterChange = (key: keyof VaccinationFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }))
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleVaccinationSuccess = async () => {
    loadVaccinations()
    loadStatistics()
    setEditingVaccination(null)
    // Refresh dashboard data to reflect new vaccination statistics
    await refreshDashboard()
  }

  const handleVaccinationRefresh = async () => {
    loadVaccinations()
    loadStatistics()
    // Refresh dashboard data to reflect updated vaccination statistics
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

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      setExporting(true)
      setExportType(type)
      setError(null)

      // Build filter params
      const params: any = {}
      if (filters.purok_id) params.purok_id = filters.purok_id
      if (filters.status) params.status = filters.status
      if (filters.vaccine_name) params.vaccine_name = filters.vaccine_name
      if (filters.date_from) params.date_from = filters.date_from
      if (filters.date_to) params.date_to = filters.date_to
      if (filters.age_group) params.age_group = filters.age_group
      if (debouncedSearch) params.search = debouncedSearch

      if (type === 'pdf') {
        await exportVaccinationsToPdf(params)
      } else {
        // CSV export
        await exportVaccinationsCsv(params)
      }
    } catch (err: any) {
      console.error('Export error:', err)
      setError(err?.response?.data?.message || `Failed to export ${type.toUpperCase()}`)
    } finally {
      setExporting(false)
      setExportType(null)
    }
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-0 text-brand-primary">
            <Syringe size={24} className="me-2" />
            Vaccination Records
          </h1>
          <p className="text-brand-muted mb-0">Manage and track vaccination records across all residents</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)} className="btn-brand-primary">
          <Plus size={16} className="me-2" />
          Add Vaccination
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="text-center">
              <Card.Body>
                <h3 className="text-brand-primary mb-1">{statistics.total_vaccinations}</h3>
                <p className="text-brand-muted mb-0">Total Vaccinations</p>
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

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex align-items-center">
            <Filter size={20} className="me-2" />
            <h5 className="mb-0 text-brand-primary">Filters</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search by vaccine, resident name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                >
                  <option value="">All Statuses</option>
                  {VACCINATION_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Vaccine</Form.Label>
                <Form.Select
                  value={filters.vaccine_name || ''}
                  onChange={(e) => handleFilterChange('vaccine_name', e.target.value || undefined)}
                >
                  <option value="">All Vaccines</option>
                  {COMMON_VACCINES.map((vaccine) => (
                    <option key={vaccine} value={vaccine}>
                      {vaccine}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Purok</Form.Label>
                <Form.Select
                  value={filters.purok_id || ''}
                  onChange={(e) => handleFilterChange('purok_id', e.target.value ? parseInt(e.target.value) : undefined)}
                >
                  <option value="">All Puroks</option>
                  {puroks.map((purok) => (
                    <option key={purok.id} value={purok.id}>
                      {purok.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Age Group</Form.Label>
                <Form.Select
                  value={filters.age_group || ''}
                  onChange={(e) => handleFilterChange('age_group', e.target.value || undefined)}
                >
                  <option value="">All Ages</option>
                  {AGE_GROUPS.map((group) => (
                    <option key={group.value} value={group.value}>
                      {group.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value || undefined)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label>Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value || undefined)}
                />
              </Form.Group>
            </Col>
            <Col md={3} className="d-flex align-items-end">
              <Button variant="outline-secondary" onClick={clearFilters} className="me-2">
                Clear Filters
              </Button>
              <div className="btn-group">
                <Button
                  variant="outline-primary"
                  onClick={() => handleExport('pdf')}
                  disabled={exporting}
                >
                  <Download size={16} className="me-2" />
                  {exporting && exportType === 'pdf' ? 'Exporting PDF...' : 'Export PDF'}
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                >
                  <Download size={16} className="me-2" />
                  {exporting && exportType === 'csv' ? 'Exporting CSV...' : 'Export CSV'}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Results */}
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-brand-primary">Vaccination Records</h5>
            <div className="text-brand-muted">
              {pagination.total > 0 && (
                <span>
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} records
                </span>
              )}
            </div>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-3">
              {error}
            </Alert>
          )}

          <VaccinationTable
            vaccinations={vaccinations}
            onEdit={handleEditVaccination}
            onRefresh={handleVaccinationRefresh}
            loading={loading}
          />

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination">
                  <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                    >
                      Previous
                    </button>
                  </li>

                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Vaccination Modal */}
      <AddVaccinationModal
        show={showAddModal}
        onHide={handleCloseModal}
        onSuccess={handleVaccinationSuccess}
        vaccination={editingVaccination}
      />
    </div>
  )
}
