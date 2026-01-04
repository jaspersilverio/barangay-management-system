import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Button, Table, Badge, Pagination, Alert, Spinner } from 'react-bootstrap'
import { Download, Filter, FileBarChart, Calendar, MapPin } from 'lucide-react'
import { usePuroks } from '../../context/PurokContext'

interface IncidentReport {
  id: number
  case_number: string
  incident_date: string
  incident_location: string
  description: string
  status: string
  complainant_name: string
  respondent_name: string
}

interface ReportFilters {
  date_from: string
  date_to: string
  purok_id?: number
  status?: string
  per_page: number
}

export default function IncidentsReportPage() {
  const { puroks } = usePuroks()
  const [incidents, setIncidents] = useState<IncidentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<ReportFilters>({
    date_from: '',
    date_to: '',
    purok_id: undefined,
    status: '',
    per_page: 15
  })

  useEffect(() => {
    loadReport()
  }, [filters, currentPage])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // TODO: Implement API call to fetch incidents report
      // For now, using placeholder data
      // Set data immediately - no artificial delays
      setIncidents([])
      setTotalPages(1)
      setTotal(0)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load incidents report')
    } finally {
      // Clear loading state immediately when data is ready
      setLoading(false)
    }
  }

  const handleFilterChange = (field: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }))
    setCurrentPage(1)
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      // TODO: Implement export functionality
      // await exportIncidentsReport(filters)
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to export report')
    } finally {
      setExporting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: string; label: string }> = {
      'Open': { variant: 'warning', label: 'Open' },
      'Ongoing': { variant: 'info', label: 'Ongoing' },
      'Resolved': { variant: 'success', label: 'Resolved' }
    }
    const config = statusConfig[status] || { variant: 'secondary', label: status }
    return <Badge bg={config.variant}>{config.label}</Badge>
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="page-container page-sub">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Incidents Report</h2>
          <p className="text-brand-muted mb-0">Generate comprehensive reports on incidents and cases</p>
        </div>
        <div className="page-actions">
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={exporting || loading}
            className="btn-brand-primary"
          >
            <Download size={18} className="me-2" />
            {exporting ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="filters-card mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="form-label-custom">
                  <Calendar size={16} className="me-2" />
                  Date From
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="form-label-custom">
                  <Calendar size={16} className="me-2" />
                  Date To
                </Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="form-label-custom">
                  <MapPin size={16} className="me-2" />
                  Purok
                </Form.Label>
                <Form.Select
                  value={filters.purok_id || ''}
                  onChange={(e) => handleFilterChange('purok_id', e.target.value ? Number(e.target.value) : undefined)}
                  className="form-control-custom"
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
            <Col md={3}>
              <Form.Group>
                <Form.Label className="form-label-custom">
                  <Filter size={16} className="me-2" />
                  Status
                </Form.Label>
                <Form.Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
                  className="form-control-custom"
                >
                  <option value="">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Resolved">Resolved</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Report Table */}
      <Card className="data-table-card">
        <Card.Body>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="loading-state">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
              <p className="mt-3 text-muted">Loading incidents report...</p>
            </div>
          ) : incidents.length === 0 ? (
            <div className="empty-state">
              <FileBarChart size={48} className="text-muted mb-3" />
              <p className="text-muted">No incidents found for the selected filters.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover className="mb-0">
                  <thead>
                    <tr>
                      <th>Case Number</th>
                      <th>Incident Date</th>
                      <th>Location</th>
                      <th>Complainant</th>
                      <th>Respondent</th>
                      <th>Status</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((incident) => (
                      <tr key={incident.id}>
                        <td>
                          <strong>{incident.case_number}</strong>
                        </td>
                        <td>{formatDate(incident.incident_date)}</td>
                        <td>{incident.incident_location}</td>
                        <td>{incident.complainant_name || 'N/A'}</td>
                        <td>{incident.respondent_name || 'N/A'}</td>
                        <td>{getStatusBadge(incident.status)}</td>
                        <td>
                          <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                            {incident.description}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="pagination-info">
                    Showing {((currentPage - 1) * filters.per_page) + 1} to {Math.min(currentPage * filters.per_page, total)} of {total} incidents
                  </div>
                  <Pagination className="mb-0">
                    <Pagination.First
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                    />
                    <Pagination.Prev
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    />
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => {
                        return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2
                      })
                      .map((page, index, array) => {
                        if (index > 0 && page - array[index - 1] > 1) {
                          return (
                            <React.Fragment key={page}>
                              <Pagination.Ellipsis />
                              <Pagination.Item
                                active={page === currentPage}
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </Pagination.Item>
                            </React.Fragment>
                          )
                        }
                        return (
                          <Pagination.Item
                            key={page}
                            active={page === currentPage}
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Pagination.Item>
                        )
                      })}
                    <Pagination.Next
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    />
                    <Pagination.Last
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

