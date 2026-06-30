import React, { useEffect, useMemo, useState } from 'react'
import { Row, Col, Card, Form, Table, Button, Alert } from 'react-bootstrap'
import { Download, Filter } from 'lucide-react'
import api from '../../services/api'
import { exportReportsCsv, getReports, type UnifiedReportType } from '../../services/reports.service'

const EMPTY_EXTRA_PARAMS: Record<string, string | undefined> = Object.freeze({})

type UnifiedReportPanelProps = {
  type: UnifiedReportType
  title: string
  pdfEndpoint: string
  extraParams?: Record<string, string | undefined>
  selector?: React.ReactNode
}

export default function UnifiedReportPanel({
  type,
  title,
  pdfEndpoint,
  extraParams,
  selector,
}: UnifiedReportPanelProps) {
  const [columns, setColumns] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, unknown>[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const stableExtraParams = extraParams ?? EMPTY_EXTRA_PARAMS

  const params = useMemo(
    () => ({
      type,
      search: search || undefined,
      status: status || undefined,
      ...stableExtraParams,
    }),
    [type, search, status, stableExtraParams]
  )

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await getReports(params)
      setColumns(res.columns || [])
      setRows(res.data || [])
    } catch {
      setError(`Failed to load ${title.toLowerCase()} report.`)
      setColumns([])
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const handleExportCsv = async () => {
    try {
      await exportReportsCsv(params)
    } catch {
      setError(`Failed to export ${title.toLowerCase()} CSV.`)
    }
  }

  const handleExportPdf = async () => {
    try {
      const query = new URLSearchParams()
      if (search) query.set('search', search)
      if (status) query.set('status', status)
      Object.entries(stableExtraParams).forEach(([k, v]) => {
        if (v) query.set(k, v)
      })

      const qs = query.toString()
      const separator = pdfEndpoint.includes('?') ? '&' : '?'
      const url = qs ? `${pdfEndpoint}${separator}${qs}` : pdfEndpoint

      const res = await api.get(url, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(blobUrl)
    } catch {
      setError(`Failed to export ${title.toLowerCase()} PDF.`)
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
            {selector && <Col md={3}>{selector}</Col>}
            <Col md={selector ? 5 : 6}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Status</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Any"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                />
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
                    Loading {title.toLowerCase()} report...
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

