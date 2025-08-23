import React, { useState, useEffect } from 'react'
import { Row, Col, Card, Button, Table, Badge, Alert, Spinner } from 'react-bootstrap'
import { Download, BarChart3, Users, Home, MapPin, Phone } from 'lucide-react'
import { getPuroksReport, exportReport, type PurokReport } from '../../services/reports.service'

export default function PuroksReport() {
  const [puroks, setPuroks] = useState<PurokReport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

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

  const handleExport = async (type: 'pdf' | 'excel') => {
    try {
      setExporting(true)
      const response = await exportReport({
        type,
        reportType: 'puroks'
      })
      
      if (response.success) {
        // TODO: Handle actual file download when backend is implemented
        alert(`${type.toUpperCase()} export started: ${response.data.message}`)
      } else {
        setError(response.message || `Failed to export ${type}`)
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || `Failed to export ${type}`)
    } finally {
      setExporting(false)
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
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading puroks report...</p>
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
              className="d-flex align-items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
            <Button
              variant="outline-success"
              onClick={() => handleExport('excel')}
              disabled={exporting}
              className="d-flex align-items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export Excel
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
              <p className="text-muted mb-0">Total Households</p>
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
              <p className="text-muted mb-0">Total Residents</p>
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
              <p className="text-muted mb-0">Male Residents</p>
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
              <p className="text-muted mb-0">Female Residents</p>
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
              <p className="text-muted mb-0">Children (&lt;18)</p>
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
              <p className="text-muted mb-0">Seniors (60+)</p>
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
              <p className="text-muted mb-0">PWDs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Puroks Summary Table */}
      <Row className="mb-3">
        <Col>
          <h5 className="mb-0">Puroks Summary</h5>
        </Col>
      </Row>

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Purok</th>
                <th>Captain</th>
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
                  <td colSpan={7} className="text-center py-4 text-muted">
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
                        <small className="text-muted">ID: {purok.id}</small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{purok.captain || 'N/A'}</strong>
                        <br />
                        <small className="text-muted">
                          <Phone className="h-3 w-3" /> {purok.contact || 'N/A'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="primary">{purok.household_count} households</Badge>
                        <Badge bg="success">{purok.resident_count} residents</Badge>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="info">{purok.male_count} Male</Badge>
                        <Badge bg="pink">{purok.female_count} Female</Badge>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <Badge bg="warning">{purok.child_count} Children</Badge>
                        <Badge bg="danger">{purok.senior_count} Seniors</Badge>
                        <Badge bg="secondary">{purok.pwd_count} PWDs</Badge>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex flex-column gap-1">
                        <small className="text-muted">
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

      {/* Population Distribution Chart Placeholder */}
      <Row className="mt-4">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header>
              <h6 className="mb-0">Population Distribution by Purok</h6>
            </Card.Header>
            <Card.Body>
              <div className="text-center py-4 text-muted">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 d-block" />
                <p>Chart visualization will be implemented with Chart.js or similar library</p>
                <small>This will show bar charts comparing population, households, and vulnerable groups across puroks</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
