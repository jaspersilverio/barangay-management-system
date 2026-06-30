import { useEffect, useState } from 'react'
import { Row, Col, Card, Form, Table, Button, Alert } from 'react-bootstrap'
import { Download, Filter } from 'lucide-react'
import api from '../../services/api'
import { exportReportsCsv, getReports } from '../../services/reports.service'

type CertificateMode = 'cert_requests' | 'cert_issued'

export default function CertificatesReport() {
  const [mode, setMode] = useState<CertificateMode>('cert_requests')
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getReports({
        type: mode,
        search: search || undefined,
        status: status || undefined,
      })
      setColumns(res.columns || [])
      setRows(res.data || [])
    } catch {
      setError('Failed to load certificate report.')
      setColumns([])
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, search, status])

  const handleExportCsv = async () => {
    try {
      await exportReportsCsv({
        type: mode,
        search: search || undefined,
        status: status || undefined,
      })
    } catch {
      setError('Failed to export certificate report.')
    }
  }

  const handleExportPdf = async () => {
    try {
      const endpoint = '/pdf/export/issued-certificates'
      const res = await api.get(endpoint, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `certificates-${mode}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch {
      setError('Failed to export certificate PDF.')
    }
  }

  return (
    <div>
      {/* Filters */}
      <Card className="mb-3">
        <Card.Header>
          <div className="d-flex align-items-center gap-2">
            <Filter className="h-4 w-4 text-brand-primary" />
            <span className="text-brand-primary">Filters</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Certificate Type</Form.Label>
                <Form.Select value={mode} onChange={(e) => setMode(e.target.value as CertificateMode)}>
                  <option value="cert_requests">Requests</option>
                  <option value="cert_issued">Issued</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Control type="text" placeholder="Any" value={status} onChange={(e) => setStatus(e.target.value)} />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Export Buttons */}
      <Row className="mb-3">
        <Col>
          <div className="d-flex gap-2 align-items-center">
            <Button variant="outline-primary" onClick={handleExportPdf}>
              <Download size={16} className="me-2" />
              Export PDF
            </Button>
            <Button variant="outline-success" onClick={handleExportCsv}>
              <Download size={16} className="me-2" />
              Export CSV
            </Button>
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                {columns.map((c, i) => (
                  <th key={`${c}-${i}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="text-center py-4 text-muted">
                    Loading certificate report...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={Math.max(1, columns.length)} className="text-center py-4 text-muted">
                    No data available.
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row)
                      .slice(0, columns.length)
                      .map((v, j) => (
                        <td key={`${i}-${j}`}>{v ?? '-'}</td>
                      ))}
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
