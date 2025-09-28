import React, { useState, useMemo, useCallback } from 'react'
import { Card, Button, Table, Row, Col, Form, Pagination, ToastContainer, Toast } from 'react-bootstrap'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listResidents, deleteResident, createResident, updateResident } from '../../services/residents.service'
import ResidentFormModal from '../../components/residents/ResidentFormModal'
import ConfirmModal from '../../components/modals/ConfirmModal'
import { usePuroks } from '../../context/PurokContext'
import { useAuth } from '../../context/AuthContext'

const ResidentListPage = React.memo(() => {
  const { puroks } = usePuroks()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const role = user?.role
  const assignedPurokId = user?.assigned_purok_id ?? null

  const [search, setSearch] = useState('')
  const [purokId, setPurokId] = useState<string>('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({ show: false, message: '', variant: 'success' })
  const [showForm, setShowForm] = useState(false)
  const [showDelete, setShowDelete] = useState<null | number>(null)
  const [editingId, setEditingId] = useState<null | number>(null)

  const canManage = role === 'admin' || role === 'purok_leader' || role === 'staff'

  const effectivePurokId = useMemo(() => {
    if (role === 'admin') return purokId
    if (role === 'purok_leader') return assignedPurokId ? String(assignedPurokId) : ''
    return purokId
  }, [purokId, role, assignedPurokId])

  // React Query for fetching residents
  const { data: residentsData, isLoading, isError, error } = useQuery({
    queryKey: ['residents', { search, page, purok_id: effectivePurokId }],
    queryFn: () => listResidents({ 
      search, 
      page, 
      purok_id: effectivePurokId || undefined 
    }),
    placeholderData: (previousData) => previousData,
  })

  // React Query for delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteResident,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residents'] })
      setToast({ show: true, message: 'Resident deleted', variant: 'success' })
      setShowDelete(null)
    },
    onError: (e: any) => {
      setToast({ show: true, message: e?.response?.data?.message || 'Delete failed', variant: 'danger' })
      setShowDelete(null)
    },
  })

  const items = useMemo(() => {
    if (!residentsData?.data?.data) return []
    return (residentsData as any).data.data
  }, [residentsData])

  const totalPages = useMemo(() => {
    return (residentsData as any)?.data?.last_page ?? 1
  }, [residentsData])

  const handleDelete = useCallback(() => {
    if (showDelete == null) return
    deleteMutation.mutate(showDelete)
  }, [showDelete, deleteMutation])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1) // Reset to first page when searching
  }, [])

  const handlePurokChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setPurokId(e.target.value)
    setPage(1) // Reset to first page when changing purok
  }, [])

  const handlePageChange = useCallback((pageNumber: number) => {
    setPage(pageNumber)
  }, [])

  const handleShowForm = useCallback(() => {
    setShowForm(true)
  }, [])

  const handleHideForm = useCallback(() => {
    setShowForm(false)
    setEditingId(null)
  }, [])

  const handleEdit = useCallback((id: number) => {
    setEditingId(id)
    setShowForm(true)
  }, [])

  const handleShowDelete = useCallback((id: number) => {
    setShowDelete(id)
  }, [])

  const handleHideDelete = useCallback(() => {
    setShowDelete(null)
  }, [])

  if (isError) {
    return (
      <Card className="shadow rounded-3 p-4">
        <Card.Body className="text-center">
          <p className="text-danger">Failed to load residents: {error?.message}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Card.Body>
      </Card>
    )
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0">Residents</h2>
          <p className="text-muted mb-0">Manage resident information and records</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <Button 
              variant="primary" 
              size="lg"
              onClick={handleShowForm} 
              disabled={isLoading}
              className="btn-primary-custom btn-action-add"
            >
              <i className="fas fa-plus me-2"></i>
              Add Resident
            </Button>
          )}
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
                  onChange={handleSearchChange}
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
                    onChange={handlePurokChange} 
                    disabled={isLoading}
                    className="form-select-custom"
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
                  <th>Sex</th>
                  <th>Civil Status</th>
                  <th>Age</th>
                  <th>Relationship</th>
                  <th>Occupation</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5">
                      <div className="loading-state">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-2 text-muted">Loading residents...</p>
                      </div>
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-5">
                      <div className="empty-state">
                        <i className="fas fa-users text-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-muted mb-0">No residents found</p>
                        <small className="text-muted">Try adjusting your search criteria</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((resident: any) => (
                    <tr key={resident.id} className="table-row">
                      <td className="fw-medium">{`${resident.first_name} ${resident.middle_name || ''} ${resident.last_name}`.trim()}</td>
                      <td><span className="badge bg-info">{resident.household?.purok?.name || '-'}</span></td>
                      <td>{resident.household?.head_name || '-'}</td>
                      <td><span className="text-capitalize">{resident.sex}</span></td>
                      <td><span className="text-capitalize">{resident.civil_status || '-'}</span></td>
                      <td>{resident.age || '-'}</td>
                      <td><span className="text-capitalize">{resident.relationship_to_head}</span></td>
                      <td><span className="text-capitalize">{resident.occupation_status}</span></td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/residents/${resident.id}`}
                            className="btn-action btn-action-view"
                          >
                            <i className="fas fa-eye"></i>
                            View
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleEdit(resident.id)}
                                className="btn-action btn-action-edit"
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleShowDelete(resident.id)}
                                disabled={deleteMutation.isPending}
                                className="btn-action btn-action-delete"
                              >
                                <i className="fas fa-trash"></i>
                                Delete
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="pagination-card">
          <Card.Body className="p-3">
            <div className="d-flex justify-content-between align-items-center">
              <div className="pagination-info">
                <span className="text-muted">
                  Showing page {page} of {totalPages}
                </span>
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev
                  disabled={page <= 1 || isLoading}
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  className="pagination-btn"
                />
                <Pagination.Item active className="pagination-item">{page}</Pagination.Item>
                <Pagination.Next
                  disabled={page >= totalPages || isLoading}
                  onClick={() => handlePageChange(page + 1)}
                  className="pagination-btn"
                />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      )}

      <ConfirmModal
        show={showDelete != null}
        title="Delete Resident"
        body="Are you sure you want to delete this resident?"
        confirmText="Delete"
        onConfirm={handleDelete}
        onHide={handleHideDelete}
      />

      <ResidentFormModal
        show={showForm}
        initial={(() => {
          if (!editingId) return undefined
          const r = items.find((i: any) => i.id === editingId)
          if (!r) return undefined
          return {
            household_id: r.household_id,
            first_name: r.first_name,
            middle_name: r.middle_name || '',
            last_name: r.last_name,
            sex: r.sex,
            birthdate: r.birthdate,
            civil_status: r.civil_status || 'single',
            relationship_to_head: r.relationship_to_head,
            occupation_status: r.occupation_status,
            is_pwd: !!r.is_pwd,
          }
        })()}
        onSubmit={async (values) => {
          try {
            // Handle optional purok_id for purok leaders
            const payload = {
              household_id: Number(values.household_id),
              first_name: values.first_name,
              middle_name: values.middle_name || undefined,
              last_name: values.last_name,
              sex: values.sex,
              birthdate: values.birthdate,
              civil_status: values.civil_status,
              relationship_to_head: values.relationship_to_head,
              occupation_status: values.occupation_status,
              is_pwd: !!values.is_pwd,
              // purok_id is handled by backend based on household
            }

            if (editingId) {
              await updateResident(editingId, payload)
              setToast({ show: true, message: 'Resident updated', variant: 'success' })
            } else {
              await createResident(payload)
              setToast({ show: true, message: 'Resident created', variant: 'success' })
            }
            setShowForm(false)
            setEditingId(null)
            queryClient.invalidateQueries({ queryKey: ['residents'] })
          } catch (e: any) {
            setToast({ show: true, message: e?.response?.data?.message || 'Save failed', variant: 'danger' })
          }
        }}
        onHide={handleHideForm}
      />

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast bg={toast.variant} onClose={() => setToast((t) => ({ ...t, show: false }))} show={toast.show} delay={2500} autohide>
          <Toast.Body className="text-white">{toast.message}</Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
})

ResidentListPage.displayName = 'ResidentListPage'

export default ResidentListPage
