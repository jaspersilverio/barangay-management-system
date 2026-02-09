import { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Badge, Alert } from 'react-bootstrap'
import { Download, BarChart3, Users, Home, MapPin, Phone } from 'lucide-react'
import { getPuroksReport, exportPuroksCsv, type PurokReport } from '../../services/reports.service'
import api from '../../services/api'

export default function PuroksReport() {
  const [puroks, setPuroks] = useState<PurokReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportType, setExportType] = useState<'pdf' | 'csv' | null>(null)

  useEffect(() => {
    loadReport()
  }, [])

  const loadReport = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getPuroksReport()
      
      if (response.success) {
        setPuroks(response.data)
      } else {
        setError(response.message || 'Failed to load puroks report')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load puroks report')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (type: 'pdf' | 'csv') => {
    try {
      setExporting(true)
      setExportType(type)
      setError(null)

      if (type === 'csv') {
        // CSV export - use dedicated CSV export function
        await exportPuroksCsv()
        setError(null)
      } else if (type === 'pdf') {
        // Call PDF export API
        const response = await api.get('/pdf/export/puroks', {
          responseType: 'blob',
        })

        // Create blob URL and trigger download
        const blob = new Blob([response.data], { type: 'application/pdf' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `puroks-summary-${new Date().toISOString().split('T')[0]}.pdf`
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

  const getTotalStats = () => {
    return puroks.reduce((acc, purok) => ({
      households: acc.households + purok.household_count,
      residents: acc.residents + purok.resident_count,
      males: acc.males + purok.male_count,
      females: acc.females + purok.female_count,
      seniors: acc.seniors + purok.senior_count,
      children: acc.children + purok.child_count,
      pwds: acc.pwds + purok.pwd_count,
    }), {
      households: 0,
      residents: 0,
      males: 0,
      females: 0,
      seniors: 0,
      children: 0,
      pwds: 0,
    })
  }

  if (loading) {
    return (
      <div className="row">
        {[...Array(6)].map((_, index) => (
          <div key={index} className="col-md-6 col-lg-4 mb-4">
            <div className="skeleton-card" style={{ height: '200px' }}>
              <div className="d-flex align-items-center mb-3">
                <div className="skeleton-circle" style={{ width: '40px', height: '40px', marginRight: '12px' }}></div>
                <div className="skeleton-line" style={{ width: '60%', height: '18px' }}></div>
              </div>
              <div className="skeleton-line" style={{ width: '100%', height: '16px', marginBottom: '10px' }}></div>
              <div className="skeleton-line" style={{ width: '80%', height: '16px', marginBottom: '10px' }}></div>
              <div className="skeleton-line" style={{ width: '90%', height: '16px', marginBottom: '15px' }}></div>
              <div className="d-flex justify-content-between">
                <div className="skeleton-badge" style={{ width: '80px', height: '24px' }}></div>
                <div className="skeleton-badge" style={{ width: '60px', height: '24px' }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const totalStats = getTotalStats()

  return (
    <div>
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

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Overall Summary Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <Home className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-1">{totalStats.households}</h3>
              <p className="text-brand-muted mb-0">Total Households</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <Users className="h-6 w-6 text-success" />
              </div>
              <h3 className="mb-1">{totalStats.residents}</h3>
              <p className="text-brand-muted mb-0">Total Residents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="bg-info bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <BarChart3 className="h-6 w-6 text-info" />
              </div>
              <h3 className="mb-1">{totalStats.males}</h3>
              <p className="text-brand-muted mb-0">Male Residents</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <div className="bg-pink bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <Users className="h-6 w-6 text-pink" />
              </div>
              <h3 className="mb-1">{totalStats.females}</h3>
              <p className="text-brand-muted mb-0">Female Residents</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Vulnerable Groups Summary */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-warning bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <Users className="h-6 w-6 text-warning" />
              </div>
              <h4 className="mb-1">{totalStats.children}</h4>
              <p className="text-brand-muted mb-0">Children (&lt;18)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-danger bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <Users className="h-6 w-6 text-danger" />
              </div>
              <h4 className="mb-1">{totalStats.seniors}</h4>
              <p className="text-brand-muted mb-0">Seniors (60+)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="bg-secondary bg-opacity-10 p-3 rounded-circle d-inline-block mb-3">
                <Users className="h-6 w-6 text-secondary" />
              </div>
              <h4 className="mb-1">{totalStats.pwds}</h4>
              <p className="text-brand-muted mb-0">PWDs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Puroks Summary Table */}
      <Row className="mb-3">
        <Col>
          <h5 className="mb-0 text-brand-primary">Puroks Summary</h5>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Purok</th>
                                    <th>Leader</th>
                <th>Contact</th>
                <th>Households</th>
                <th>Residents</th>
                <th>Demographics</th>
                <th>Vulnerable Groups</th>
              </tr>
            </thead>
            <tbody>
              {puroks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-brand-muted">
                    <BarChart3 className="h-8 w-8 mx-auto mb-2 d-block" />
                    No puroks data available
                  </td>
                </tr>
              ) : (
                puroks.map((purok) => (
                  <tr key={purok.id}>
                    <td>
                      <div>
                        <strong>{purok.name}</strong>
                        <br />
                        <small className="text-brand-muted">ID: {purok.id}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{purok.captain || 'N/A'}</strong>
                        <br />
                        <small className="text-brand-muted">
                          <Phone className="h-3 w-3" /> {purok.contact || 'N/A'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="primary" className="rounded-pill">{purok.household_count} households</Badge>
                        <Badge bg="success" className="rounded-pill">{purok.resident_count} residents</Badge>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="info" className="rounded-pill">{purok.male_count} Male</Badge>
                        <Badge bg="pink" className="rounded-pill">{purok.female_count} Female</Badge>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="warning" className="rounded-pill">{purok.child_count} Children</Badge>
                        <Badge bg="danger" className="rounded-pill">{purok.senior_count} Seniors</Badge>
                        <Badge bg="secondary" className="rounded-pill">{purok.pwd_count} PWDs</Badge>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <small className="text-brand-muted">
                          <MapPin className="h-3 w-3" /> {purok.name}
                        </small>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

    </div>
  )
}
