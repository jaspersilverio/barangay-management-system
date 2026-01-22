import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Button, Table, Badge, Pagination, Alert } from 'react-bootstrap'
import { Download, Filter, Home } from 'lucide-react'
import { getHouseholdsReport, exportHouseholdsCsv, type HouseholdReport, type ReportFilters } from '../../services/reports.service'
import { usePuroks } from '../../context/PurokContext'
import api from '../../services/api'

export default function HouseholdsReport() {
  const { puroks } = usePuroks()
  const [households, setHouseholds] = useState<HouseholdReport[]>([])
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
    per_page: 15
  })

  useEffect(() => {
    loadReport()
  }, [filters, currentPage]) // These dependencies are fine as they're primitive values

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getHouseholdsReport({
        ...filters,
        per_page: filters.per_page || 15
      })

      if (response.success) {
        setHouseholds(response.data.data)
        setTotalPages(response.data.last_page)
        setTotal(response.data.total)
      } else {
        setError(response.message || 'Failed to load households report')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load households report')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      setExporting(true)
      setError(null)

      if (type === 'csv') {
        // CSV export - use dedicated CSV export function
        await exportHouseholdsCsv(filters)
        setError(null)
      } else if (type === 'pdf') {
        // Build query parameters
        const params = new URLSearchParams()
        if (filters.purok_id) params.append('purok_id', filters.purok_id.toString())
        if (filters.date_from) params.append('start_date', filters.date_from)
        if (filters.date_to) params.append('end_date', filters.date_to)

        // Call PDF export API
        const response = await api.get(`/pdf/export/households?${params.toString()}`, {
          responseType: 'blob',
        })

        // Create blob URL and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `households-report-${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)

        setError(null)
      }
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || `Failed to export ${type}`
      setError(errorMessage)
      console.error('Export error:', err)
    } finally {
      setExporting(false)
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '90px', height: '16px' }}></div></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '200px', height: '16px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></td>
                <td><div className="skeleton-badge" style={{ width: '60px', height: '20px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex align-items-center gap-2">
            <Filter className="h-4 w-4 text-brand-primary" />
            <span className="text-brand-primary">Filters</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date From</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_from || ''}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Date To</Form.Label>
                <Form.Control
                  type="date"
                  value={filters.date_to || ''}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Purok</Form.Label>
                <Form.Select
                  value={filters.purok_id || ''}
                  onChange={(e) => handleFilterChange('purok_id', e.target.value ? Number(e.target.value) : undefined)}
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
                <Form.Label>Per Page</Form.Label>
                <Form.Select
                  value={filters.per_page || 15}
                  onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Export Buttons */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="d-flex align-items-center gap-2 btn-brand-primary"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline-info"
              onClick={() => handleExport('csv')}
              disabled={exporting}
              className="d-flex align-items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </Col>
      </Row>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Results Summary */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 text-brand-primary">Households Report</h5>
            <span className="text-brand-muted">
              Showing {households.length} of {total} households
            </span>
          </div>
        </Col>
      </Row>

      {/* Table */}
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Household</th>
                <th>Address</th>
                <th>Purok</th>
                <th>Members</th>
                <th>Property Type</th>
                <th>Contact</th>
                <th>Registered</th>
              </tr>
            </thead>
            <tbody>
              {households.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-brand-muted">
                    <Home className="h-8 w-8 mx-auto mb-2 d-block" />
                    No households found matching the criteria
                  </td>
                </tr>
              ) : (
                households.map((household) => (
                  <tr key={household.id}>
                    <td>
                      <div>
                        <strong>{household.head_name}</strong>
                        <br />
                        <small className="text-brand-muted">ID: {household.id}</small>
                      </div>
                    </td>
                    <td>{household.address}</td>
                    <td>
                      <Badge bg="info" className="rounded-pill">{household.purok?.name}</Badge>
                    </td>
                    <td>
                      <Badge bg="primary" className="rounded-pill">{household.member_count} members</Badge>
                    </td>
                    <td>{household.property_type}</td>
                    <td>{household.contact}</td>
                    <td>{formatDate(household.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Row className="mt-4">
          <Col>
            <div className="d-flex justify-content-center">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 2)
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <Pagination.Ellipsis />
                      )}
                      <Pagination.Item
                        active={page === currentPage}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Pagination.Item>
                    </React.Fragment>
                  ))}

                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          </Col>
        </Row>
      )}
    </div>
  )
}
