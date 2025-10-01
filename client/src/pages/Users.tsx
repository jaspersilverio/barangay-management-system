import { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Button, Table, Badge, Pagination, Alert, InputGroup } from 'react-bootstrap'
import { Search } from 'lucide-react'
import type { User, UserFilters } from '../services/users.service'
import { getUsers, createUser, updateUser, deleteUser, restoreUser } from '../services/users.service'
import UserFormModal from '../components/users/UserFormModal'
import DeleteConfirmModal from '../components/users/DeleteConfirmModal'

export default function Users() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    purok_id: undefined,
    per_page: 15
  })

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [filters, currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getUsers({
        ...filters,
        per_page: filters.per_page || 15
      })
      
      if (response.success) {
        setUsers(response.data.data)
        setTotalPages(response.data.last_page)
        setTotal(response.data.total)
      } else {
        setError(response.message || 'Failed to load users')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key: keyof UserFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handleCreateUser = async (payload: any) => {
    try {
      setModalLoading(true)
      const response = await createUser(payload)
      
      if (response.success) {
        // Optimistic update
        setUsers(prev => [response.data, ...prev])
        setTotal(prev => prev + 1)
        setShowCreateModal(false)
      } else {
        throw new Error(response.message || 'Failed to create user')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create user')
      throw error
    } finally {
      setModalLoading(false)
    }
  }

  const handleUpdateUser = async (payload: any) => {
    if (!selectedUser) return
    
    try {
      setModalLoading(true)
      const response = await updateUser(selectedUser.id, payload)
      
      if (response.success) {
        // Optimistic update
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id ? response.data : user
        ))
        setShowEditModal(false)
        setSelectedUser(null)
      } else {
        throw new Error(response.message || 'Failed to update user')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to update user')
      throw error
    } finally {
      setModalLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!selectedUser) return
    
    try {
      setModalLoading(true)
      const response = await deleteUser(selectedUser.id)
      
      if (response.success) {
        // Optimistic update
        setUsers(prev => prev.map(user => 
          user.id === selectedUser.id 
            ? { ...user, deleted_at: new Date().toISOString() }
            : user
        ))
        setShowDeleteModal(false)
        setSelectedUser(null)
      } else {
        throw new Error(response.message || 'Failed to delete user')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to delete user')
      throw error
    } finally {
      setModalLoading(false)
    }
  }

  const handleRestoreUser = async (userId: number) => {
    try {
      const response = await restoreUser(userId)
      
      if (response.success) {
        // Optimistic update
        setUsers(prev => prev.map(user => 
          user.id === userId 
            ? { ...user, deleted_at: undefined }
            : user
        ))
      } else {
        setError(response.message || 'Failed to restore user')
      }
    } catch (error: any) {
      setError(error.message || 'Failed to restore user')
    }
  }

  const openEditModal = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const openDeleteModal = (user: User) => {
    setSelectedUser(user)
    setShowDeleteModal(true)
  }

  const getRoleBadge = (role: string) => {
    const variants: Record<string, string> = {
      admin: 'danger',
      purok_leader: 'primary',
      staff: 'secondary'
    }
    
    return <Badge bg={variants[role] || 'secondary'} className="rounded-pill">{role.replace('_', ' ').toUpperCase()}</Badge>
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
        <Table className="data-table" striped hover>
          <thead className="table-header">
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Purok</th>
              <th>Status</th>
              <th>Last Login</th>
              <th className="actions-column">Actions</th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, index) => (
              <tr key={index} className="table-row">
                <td>
                  <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="skeleton-line" style={{ width: '200px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                </td>
                <td>
                  <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div>
                </td>
                <td>
                  <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                </td>
                <td>
                  <div className="action-buttons">
                    <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                    <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                    <div className="skeleton-button" style={{ width: '50px', height: '28px' }}></div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">User Management</h2>
          <p className="text-brand-muted mb-0">Manage system users and their roles</p>
        </div>
        <div className="page-actions">
          <Button 
            variant="primary" 
            size="lg"
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className="btn-brand-primary"
          >
            <i className="fas fa-plus me-2"></i>
            Add User
          </Button>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <Card.Body className="p-3">
          <Row>
            <Col md={4}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <Search className="h-4 w-4" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    disabled={loading}
                    className="form-control-custom"
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Role</Form.Label>
                <Form.Select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                  disabled={loading}
                  className="form-select-custom"
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="purok_leader">Purok Leader</option>
                  <option value="staff">Staff</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-0">
                <Form.Label className="form-label-custom">Per Page</Form.Label>
                <Form.Select
                  value={filters.per_page || 15}
                  onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
                  disabled={loading}
                  className="form-select-custom"
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
            <h5 className="mb-0 text-brand-primary">Users</h5>
            <span className="text-brand-muted">
              Showing {users.length} of {total} users
            </span>
          </div>
        </Col>
      </Row>

      {/* Users Table */}
      <Card>
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="data-table" striped hover>
              <thead className="table-header">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Assigned Purok</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td>
                          <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '200px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px' }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div className="empty-state">
                        <i className="fas fa-users text-brand-muted mb-3" style={{ fontSize: '3rem' }}></i>
                        <p className="text-brand-muted mb-0">No users found</p>
                        <small className="text-brand-muted">Try adjusting your search criteria</small>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="table-row">
                      <td>
                        <div>
                          <strong className="fw-medium">{user.name}</strong>
                          <br />
                          <small className="text-brand-muted">ID: {user.id}</small>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        {user.assigned_purok ? (
                          <Badge bg="info" className="rounded-pill">{user.assigned_purok.name}</Badge>
                        ) : (
                          <span className="text-brand-muted">Not assigned</span>
                        )}
                      </td>
                      <td>
                        {user.deleted_at ? (
                          <Badge bg="danger" className="rounded-pill">Deleted</Badge>
                        ) : (
                          <Badge bg="success" className="rounded-pill">Active</Badge>
                        )}
                      </td>
                      <td>
                        <small className="text-brand-muted">
                          {formatDate(user.created_at)}
                        </small>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {user.deleted_at ? (
                            <Button
                              size="sm"
                              onClick={() => handleRestoreUser(user.id)}
                              className="btn-action btn-action-add"
                              title="Restore user"
                            >
                              <i className="fas fa-undo"></i>
                              Restore
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                onClick={() => openEditModal(user)}
                                className="btn-action btn-action-edit"
                                title="Edit user"
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => openDeleteModal(user)}
                                className="btn-action btn-action-delete"
                                title="Delete user"
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
                <span className="text-brand-muted">
                  Showing page {currentPage} of {totalPages}
                </span>
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev 
                  disabled={currentPage === 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                  className="pagination-btn"
                />
                <Pagination.Item active className="pagination-item">{currentPage}</Pagination.Item>
                <Pagination.Next 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
                  className="pagination-btn"
                />
              </Pagination>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Modals */}
      <UserFormModal
        show={showCreateModal}
        onHide={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        loading={modalLoading}
      />

      <UserFormModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onSubmit={handleUpdateUser}
        loading={modalLoading}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false)
          setSelectedUser(null)
        }}
        user={selectedUser}
        onConfirm={handleDeleteUser}
        loading={modalLoading}
      />
    </div>
  )
}
