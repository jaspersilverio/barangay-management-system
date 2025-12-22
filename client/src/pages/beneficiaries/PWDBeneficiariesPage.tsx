import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination } from 'react-bootstrap'
import { listResidents } from '../../services/residents.service'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function PWDBeneficiariesPage() {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const navigate = useNavigate()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [search, setSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [residentsData, setResidentsData] = useState<any>(null)

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  const loadResidents = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listResidents({ 
        search, 
        page, 
        purok_id: effectivePurokId || undefined,
        pwds: true, // Filter for PWD only
        per_page: 15 
      })
      setResidentsData(data)
    } catch (err) {
      console.error('Error loading PWD beneficiaries:', err)
    } finally {
      setIsLoading(false)
    }
  }, [search, page, effectivePurokId])

  useEffect(() => {
    loadResidents()
  }, [loadResidents])

  const items = useMemo(() => {
    if (!residentsData?.data?.data) return []
    return residentsData.data.data
  }, [residentsData])

  const totalPages = useMemo(() => {
    return residentsData?.data?.last_page ?? 1
  }, [residentsData])

  const total = useMemo(() => {
    return residentsData?.data?.total ?? 0
  }, [residentsData])

  const calculateAge = (birthdate: string) => {
    const today = new Date()
    const birth = new Date(birthdate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  return (
    <div className="page-container page-sub">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">PWD Beneficiaries</h2>
          <p className="text-brand-muted mb-0">Manage Persons with Disabilities (PWD) beneficiaries</p>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <Card.Body className="p-3">
          <Row className="align-items-end g-3">
            <Col md={4}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Search</Form.Label>
                <Form.Control
                  placeholder="Name, relationship, or occupation"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  disabled={isLoading}
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>
            {role === 'admin' && (
              <Col md={4}>
                <Form.Group className="mb-0">
                  <Form.Label className="form-label-custom">Purok</Form.Label>
                  <Form.Select 
                    value={purokId} 
                    onChange={(e) => {
                      setPurokId(e.target.value)
                      setPage(1)
                    }}
                    disabled={isLoading}
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
            )}
          </Row>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card className="data-table-card">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="data-table" striped hover>
              <thead className="table-header">
                <tr>
                  <th>Name</th>
                  <th>Purok</th>
                  <th>Household</th>
                  <th>Age</th>
                  <th>Sex</th>
                  <th>Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td><div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div></td>
                        <td><div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '40px', height: '16px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '60px', height: '16px' }}></div></td>
                        <td><div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div></td>
                        <td>
                          <div className="action-buttons">
                            <div className="skeleton-button" style={{ width: '60px', height: '28px' }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      No PWD beneficiaries found
                    </td>
                  </tr>
                ) : (
                  items.map((resident: any) => (
                    <tr key={resident.id} className="table-row">
                      <td>
                        <strong>
                          {resident.first_name} {resident.middle_name || ''} {resident.last_name}
                        </strong>
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {resident.household?.purok?.name || 'N/A'}
                        </span>
                      </td>
                      <td>{resident.household?.head_name || 'N/A'}</td>
                      <td>{calculateAge(resident.birthdate)}</td>
                      <td>{resident.sex === 'male' ? 'Male' : resident.sex === 'female' ? 'Female' : 'Other'}</td>
                      <td>{resident.household?.contact || 'N/A'}</td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="btn-action btn-action-view"
                            onClick={() => navigate(`/residents/${resident.id}`)}
                          >
                            View
                          </Button>
                        </div>
                      </td>
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
                Showing {((page - 1) * 15) + 1} to {Math.min(page * 15, total)} of {total} PWD beneficiaries
              </div>
              <Pagination className="mb-0">
                <Pagination.First onClick={() => setPage(1)} disabled={page === 1} />
                <Pagination.Prev onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) {
                      return (
                        <React.Fragment key={p}>
                          <Pagination.Ellipsis />
                          <Pagination.Item active={p === page} onClick={() => setPage(p)}>
                            {p}
                          </Pagination.Item>
                        </React.Fragment>
                      )
                    }
                    return (
                      <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
                        {p}
                      </Pagination.Item>
                    )
                  })}
                <Pagination.Next onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                <Pagination.Last onClick={() => setPage(totalPages)} disabled={page === totalPages} />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

