import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Table, Badge, Pagination, Alert, Spinner, InputGroup } from 'react-bootstrap'
import { Plus, Search, Filter, Edit, Trash2, RotateCcw, Users as UsersIcon } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser, restoreUser, type User, type UserFilters } from '../services/users.service'
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
    
    return <Badge bg={variants[role] || 'secondary'}>{role.replace('_', ' ').toUpperCase()}</Badge>
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
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading users...</p>
      </div>
    )
  }

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3">
                         <div className="bg-primary bg-opacity-10 p-3 rounded">
               <UsersIcon className="h-6 w-6 text-primary" />
             </div>
            <div>
              <h2 className="mb-0">User Management</h2>
              <p className="text-muted mb-0">Manage system users and their roles</p>
            </div>
          </div>
        </Col>
        <Col xs="auto">
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            className="d-flex align-items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-4">
        <Card.Header>
          <div className="d-flex align-items-center gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <Search className="h-4 w-4" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Role</Form.Label>
                <Form.Select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="purok_leader">Purok Leader</option>
                  <option value="staff">Staff</option>
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
            <h5 className="mb-0">Users</h5>
            <span className="text-muted">
              Showing {users.length} of {total} users
            </span>
          </div>
        </Col>
      </Row>

      {/* Users Table */}
      <Card>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Assigned Purok</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-4 text-muted">
                                         <UsersIcon size={32} className="mx-auto mb-2 d-block" />
                    No users found matching the criteria
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <strong>{user.name}</strong>
                        <br />
                        <small className="text-muted">ID: {user.id}</small>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      {user.assigned_purok ? (
                        <Badge bg="info">{user.assigned_purok.name}</Badge>
                      ) : (
                        <span className="text-muted">Not assigned</span>
                      )}
                    </td>
                    <td>
                      {user.deleted_at ? (
                        <Badge bg="danger">Deleted</Badge>
                      ) : (
                        <Badge bg="success">Active</Badge>
                      )}
                    </td>
                    <td>
                      <small className="text-muted">
                        {formatDate(user.created_at)}
                      </small>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        {user.deleted_at ? (
                          <Button
                            size="sm"
                            variant="outline-success"
                            onClick={() => handleRestoreUser(user.id)}
                            title="Restore user"
                          >
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline-primary"
                              onClick={() => openEditModal(user)}
                              title="Edit user"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => openDeleteModal(user)}
                              title="Delete user"
                            >
                              <Trash2 className="h-3 w-3" />
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
    </Container>
  )
}
