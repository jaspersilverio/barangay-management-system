import { useState, useEffect } from 'react'
import { Row, Col, Card, Form, Button, Table, Badge, Pagination, Alert, InputGroup, Dropdown } from 'react-bootstrap'
import { Search, Users as UsersIcon, UserCheck, UserX, Shield, UserPlus, Signature, MoreVertical, Edit, Trash2, RotateCcw } from 'lucide-react'
import type { User, UserFilters } from '../services/users.service'
import { getUsers, createUser, updateUser, deleteUser, restoreUser } from '../services/users.service'
import UserFormModal from '../components/users/UserFormModal'
import DeleteConfirmModal from '../components/users/DeleteConfirmModal'
import SignatureManagementModal from '../components/users/SignatureManagementModal'
import { useAuth } from '../context/AuthContext'

export default function Users() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  // Separate input value from search query for smooth typing
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
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
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Check if current user can manage signature (captain or admin)
  const canManageSignature = currentUser?.role === 'captain' || currentUser?.role === 'admin'

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setFilters(prev => ({ ...prev, search: searchInput }))
      setCurrentPage(1) // Reset to first page when search changes
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    loadUsers()
  }, [debouncedSearch, filters.role, filters.purok_id, filters.per_page, currentPage])

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getUsers({
        ...filters,
        per_page: filters.per_page || 15
      })
      
      if (response.success) {
        // Set data immediately - no delays
        setUsers(response.data.data)
        setTotalPages(response.data.last_page)
        setTotal(response.data.total)
      } else {
        setError(response.message || 'Failed to load users')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load users')
    } finally {
      // Clear loading state immediately when data is ready
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

  // Calculate statistics
  const statistics = {
    total: total,
    active: users.filter(u => !u.deleted_at).length,
    deleted: users.filter(u => u.deleted_at).length,
    admin: users.filter(u => u.role === 'admin' && !u.deleted_at).length,
    purok_leader: users.filter(u => u.role === 'purok_leader' && !u.deleted_at).length,
    staff: users.filter(u => u.role === 'staff' && !u.deleted_at).length,
  }

  // Get user initials for avatar
  const getUserInitials = (name: string) => {
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

  // Get role color for avatar
  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: '#DC2626',
      purok_leader: '#2563EB',
      staff: '#6B7280',
      captain: '#059669'
    }
    return colors[role] || '#6B7280'
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="bg-primary bg-opacity-10 p-3 rounded">
              <UsersIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="mb-0 text-brand-primary">User Management</h2>
              <p className="text-brand-muted mb-0">Manage system users, roles, and permissions</p>
            </div>
          </div>
        </div>
        <div className="d-flex gap-2">
          {canManageSignature && (
            <Button 
              variant="outline-primary" 
              onClick={() => setShowSignatureModal(true)}
              disabled={loading}
              className="d-flex align-items-center gap-2"
            >
              <Signature className="h-4 w-4" />
              Manage Signature
            </Button>
          )}
          <Button 
            variant="primary" 
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className="btn-brand-primary d-flex align-items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="card-modern h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Total Users</p>
                  <h3 className="mb-0 text-brand-primary">{statistics.total}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <UsersIcon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-modern h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Active Users</p>
                  <h3 className="mb-0 text-success">{statistics.active}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-3 rounded">
                  <UserCheck className="h-5 w-5 text-success" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-modern h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Administrators</p>
                  <h3 className="mb-0 text-danger">{statistics.admin}</h3>
                </div>
                <div className="bg-danger bg-opacity-10 p-3 rounded">
                  <Shield className="h-5 w-5 text-danger" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-modern h-100">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1 small">Purok Leaders</p>
                  <h3 className="mb-0 text-info">{statistics.purok_leader}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-3 rounded">
                  <UsersIcon className="h-5 w-5 text-info" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filters Section */}
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-light">
          <div className="d-flex align-items-center gap-2">
            <Search className="h-4 w-4 text-muted" />
            <h6 className="mb-0">Filters & Search</h6>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="g-3">
            <Col md={5}>
              <Form.Group>
                <Form.Label className="small fw-medium text-muted">Search Users</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-white">
                    <Search className="h-4 w-4 text-muted" />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    disabled={loading}
                  />
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium text-muted">Filter by Role</Form.Label>
                <Form.Select
                  value={filters.role || ''}
                  onChange={(e) => handleFilterChange('role', e.target.value || undefined)}
                  disabled={loading}
                >
                  <option value="">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="purok_leader">Purok Leader</option>
                  <option value="staff">Staff</option>
                  <option value="captain">Captain</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label className="small fw-medium text-muted">Per Page</Form.Label>
                <Form.Select
                  value={filters.per_page || 15}
                  onChange={(e) => handleFilterChange('per_page', Number(e.target.value))}
                  disabled={loading}
                >
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchInput('')
                  setFilters({ search: '', role: '', purok_id: undefined, per_page: 15 })
                  setCurrentPage(1)
                }}
                disabled={loading}
                className="w-100"
              >
                Clear
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-4">
          <Alert.Heading>Error</Alert.Heading>
          {error}
        </Alert>
      )}

      {/* Results Summary */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0 text-brand-primary">Users List</h5>
          <small className="text-muted">
            Showing {users.length} of {total} users
            {filters.role && ` • Filtered by: ${filters.role.replace('_', ' ')}`}
          </small>
        </div>
      </div>

      {/* Users Table */}
      <Card className="shadow-sm">
        <Card.Body className="p-0">
          <div className="table-responsive">
            <Table className="mb-0" hover>
              <thead className="table-light">
                <tr>
                  <th style={{ width: '5%' }}>Avatar</th>
                  <th style={{ width: '20%' }}>User</th>
                  <th style={{ width: '20%' }}>Email</th>
                  <th style={{ width: '12%' }}>Role</th>
                  <th style={{ width: '15%' }}>Assigned Purok</th>
                  <th style={{ width: '10%' }}>Status</th>
                  <th style={{ width: '10%' }}>Created</th>
                  <th style={{ width: '8%' }} className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index}>
                        <td>
                          <div className="skeleton-badge" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '150px', height: '16px', marginBottom: '4px' }}></div>
                          <div className="skeleton-line" style={{ width: '100px', height: '12px' }}></div>
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
                          <div className="d-flex justify-content-center">
                            <div className="skeleton-button" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-5">
                      <div className="empty-state">
                        <UserX className="h-12 w-12 text-muted mb-3" style={{ opacity: 0.5 }} />
                        <h6 className="text-muted mb-2">No users found</h6>
                        <p className="text-muted small mb-0">Try adjusting your search criteria or filters</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} style={{ verticalAlign: 'middle' }}>
                      <td>
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                          style={{
                            width: '40px',
                            height: '40px',
                            backgroundColor: getRoleColor(user.role),
                            fontSize: '14px'
                          }}
                        >
                          {getUserInitials(user.name)}
                        </div>
                      </td>
                      <td>
                        <div>
                          <strong className="fw-medium text-brand-primary">{user.name}</strong>
                          <br />
                          <small className="text-muted">ID: {user.id}</small>
                        </div>
                      </td>
                      <td>
                        <span className="text-brand-secondary">{user.email}</span>
                      </td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>
                        {user.assigned_purok ? (
                          <Badge bg="info" className="rounded-pill">{user.assigned_purok.name}</Badge>
                        ) : (
                          <span className="text-muted small">Not assigned</span>
                        )}
                      </td>
                      <td>
                        {user.deleted_at ? (
                          <Badge bg="danger" className="rounded-pill">
                            <UserX className="h-3 w-3 me-1" />
                            Deleted
                          </Badge>
                        ) : (
                          <Badge bg="success" className="rounded-pill">
                            <UserCheck className="h-3 w-3 me-1" />
                            Active
                          </Badge>
                        )}
                      </td>
                      <td>
                        <small className="text-muted">
                          {formatDate(user.created_at)}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex justify-content-center">
                          <Dropdown>
                            <Dropdown.Toggle 
                              variant="outline-secondary" 
                              size="sm"
                              className="border-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              {user.deleted_at ? (
                                <Dropdown.Item onClick={() => handleRestoreUser(user.id)}>
                                  <RotateCcw className="h-4 w-4 me-2" />
                                  Restore User
                                </Dropdown.Item>
                              ) : (
                                <>
                                  <Dropdown.Item onClick={() => openEditModal(user)}>
                                    <Edit className="h-4 w-4 me-2" />
                                    Edit
                                  </Dropdown.Item>
                                  <Dropdown.Divider />
                                  <Dropdown.Item 
                                    onClick={() => openDeleteModal(user)}
                                    className="text-danger"
                                  >
                                    <Trash2 className="h-4 w-4 me-2" />
                                    Delete
                                  </Dropdown.Item>
                                </>
                              )}
                            </Dropdown.Menu>
                          </Dropdown>
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
        <Card className="mt-4 shadow-sm">
          <Card.Body className="py-3">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <div>
                <span className="text-muted small">
                  Showing page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  {' • '}
                  <strong>{users.length}</strong> of <strong>{total}</strong> users
                </span>
              </div>
              <Pagination className="mb-0">
                <Pagination.Prev 
                  disabled={currentPage === 1 || loading}
                  onClick={() => handlePageChange(currentPage - 1)}
                />
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  return (
                    <Pagination.Item
                      key={pageNum}
                      active={pageNum === currentPage}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </Pagination.Item>
                  )
                })}
                <Pagination.Next 
                  disabled={currentPage === totalPages || loading}
                  onClick={() => handlePageChange(currentPage + 1)}
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

      <SignatureManagementModal
        show={showSignatureModal}
        onHide={() => setShowSignatureModal(false)}
        onSignatureUpdated={() => {
          // Signature updated - could refresh data if needed
        }}
      />
    </div>
  )
}
