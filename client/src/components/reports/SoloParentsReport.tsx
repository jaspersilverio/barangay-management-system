import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Button, Table, Badge, Pagination, Alert } from 'react-bootstrap'
import { Download, Filter } from 'lucide-react'
import { listSoloParents, type SoloParent } from '../../services/solo-parents.service'
import { exportSoloParentsCsv } from '../../services/reports.service'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

export default function SoloParentsReport() {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [soloParents, setSoloParents] = useState<SoloParent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState({
    search: '',
    purok_id: '',
    status: '',
    per_page: 15
  })

  const effectivePurokId = role === 'admin' ? filters.purok_id : (assignedPurokId ? String(assignedPurokId) : '')

  useEffect(() => {
    loadReport()
  }, [filters, currentPage])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await listSoloParents({
        search: filters.search || undefined,
        purok_id: effectivePurokId || undefined,
        status: filters.status || undefined,
        page: currentPage,
        per_page: filters.per_page || 15
      })

      if (response.success) {
        setSoloParents(response.data.data || [])
        setTotalPages(response.data.last_page || 1)
        setTotal(response.data.total || 0)
      } else {
        setError(response.message || 'Failed to load solo parents report')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load solo parents report')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      setExporting(true)
      setExportType(type)
      setError(null)

      if (type === 'csv') {
        // CSV export - use dedicated CSV export function
        await exportSoloParentsCsv({
          search: filters.search || undefined,
          purok_id: effectivePurokId || undefined,
          status: filters.status || undefined
        })
        setError(null)
      } else if (type === 'pdf') {
        // Build query parameters
        const params = new URLSearchParams()
        if (filters.search) params.append('search', filters.search)
        if (filters.purok_id) params.append('purok_id', filters.purok_id)
        if (filters.status) params.append('status', filters.status)

        // Call PDF export API
        const response = await api.get(`/pdf/export/solo-parents?${params.toString()}`, {
          responseType: 'blob',
        })

        // Create blob URL and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `solo-parents-report-${new Date().toISOString().split('T')[0]}.pdf`
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
      setExportType(null)
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge bg="success">Active</Badge>
      case 'expired':
        return <Badge bg="warning" text="dark">Expired</Badge>
      case 'inactive':
        return <Badge bg="secondary">Inactive</Badge>
      default:
        return <Badge bg="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></th>
              <th><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(10)].map((_, i) => (
              <tr key={i}>
                <td><div className="skeleton-line" style={{ width: '180px', height: '16px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></td>
                <td><div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div></td>
                <td><div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '40px', height: '16px' }}></div></td>
                <td><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></td>
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
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Resident name..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </Form.Group>
            </Col>
            {role === 'admin' && (
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Purok</Form.Label>
                  <Form.Select
                    value={filters.purok_id}
                    onChange={(e) => handleFilterChange('purok_id', e.target.value)}
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
            )}
            <Col md={role === 'admin' ? 3 : 4}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Inactive</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={role === 'admin' ? 3 : 5}>
              <Form.Group>
                <Form.Label>Per Page</Form.Label>
                <Form.Select
                  value={filters.per_page}
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

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Report Summary */}
      <Card className="mb-4">
        <Card.Body>
          <Row>
            <Col md={3}>
              <div className="text-center">
                <div className="h4 mb-0 text-brand-primary">{total}</div>
                <div className="text-muted">Total Solo Parents</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="h4 mb-0 text-success">
                  {soloParents.filter(sp => sp.computed_status === 'active').length}
                </div>
                <div className="text-muted">Active</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="h4 mb-0 text-warning">
                  {soloParents.filter(sp => sp.computed_status === 'expired').length}
                </div>
                <div className="text-muted">Expired</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="text-center">
                <div className="h4 mb-0 text-secondary">
                  {soloParents.filter(sp => sp.computed_status === 'inactive').length}
                </div>
                <div className="text-muted">Inactive</div>
              </div>
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

      {/* Report Table */}
      <Card>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="table" striped hover>
              <thead className="table-header">
                <tr>
                  <th>Resident Name</th>
                  <th>Eligibility Reason</th>
                  <th>Purok</th>
                  <th>Status</th>
                  <th>Dependent Children</th>
                  <th>Date Declared</th>
                  <th>Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {soloParents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No solo parents found
                    </td>
                  </tr>
                ) : (
                  soloParents.map((soloParent) => (
                    <tr key={soloParent.id}>
                      <td>
                        <strong>{soloParent.resident?.full_name || 'N/A'}</strong>
                        {soloParent.resident?.age && (
                          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Age: {soloParent.resident.age}
                          </div>
                        )}
                      </td>
                      <td>{soloParent.eligibility_reason_label}</td>
                      <td>
                        <Badge bg="primary">
                          {soloParent.resident?.household?.purok?.name || 'N/A'}
                        </Badge>
                      </td>
                      <td>{getStatusBadge(soloParent.computed_status)}</td>
                      <td>
                        <Badge bg="info">
                          {soloParent.dependent_children_count} {soloParent.dependent_children_count === 1 ? 'child' : 'children'}
                        </Badge>
                      </td>
                      <td>{formatDate(soloParent.date_declared)}</td>
                      <td>{formatDate(soloParent.valid_until)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top">
              <div className="pagination-info">
                Showing {((currentPage - 1) * (filters.per_page || 15)) + 1} to {Math.min(currentPage * (filters.per_page || 15), total)} of {total} solo parents
              </div>
              <Pagination className="mb-0">
                <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
                  .map((p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      return (
                        <React.Fragment key={p}>
                          <Pagination.Ellipsis />
                          <Pagination.Item active={p === currentPage} onClick={() => handlePageChange(p)}>
                            {p}
                          </Pagination.Item>
                        </React.Fragment>
                      )
                    }
                    return (
                      <Pagination.Item key={p} active={p === currentPage} onClick={() => handlePageChange(p)}>
                        {p}
                      </Pagination.Item>
                    )
                  })}
                <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

