import React, { useState, useEffect } from 'react'
import { Table, Button, Badge, Form, InputGroup, Dropdown } from 'react-bootstrap'
import { type Official } from '../../services/officials.service'

interface OfficialListProps {
  officials: Official[]
  loading: boolean
  onEdit: (official: Official) => void
  onDelete: (id: number) => void
  onToggleActive: (id: number) => void
  onSearch: (search: string) => void
  onFilterPosition: (position: string) => void
  onFilterStatus: (active: boolean | null) => void
  canManage?: boolean
  /** When false, Delete action is hidden (e.g. staff can manage but not delete) */
  canDelete?: boolean
  /** Position options for the filter dropdown; must match the Add/Edit modal for this category */
  positionOptions?: string[]
  /** Hide position filter (for appointed officials: tanod, bhw, staff) */
  hidePositionFilter?: boolean
}

export default function OfficialList({
  officials,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onSearch,
  onFilterPosition,
  onFilterStatus,
  canManage = false,
  canDelete = false,
  positionOptions = [],
  hidePositionFilter = false
}: OfficialListProps) {
  // Separate input value from search query for smooth typing
  const [searchInput, setSearchInput] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null)

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onSearch(searchInput)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput]) // Remove onSearch from dependencies to avoid infinite loop

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Search is already handled by debounce effect
  }

  const handlePositionFilter = (position: string) => {
    setSelectedPosition(position)
    onFilterPosition(position)
  }

  const handleStatusFilter = (status: boolean | null) => {
    setSelectedStatus(status)
    onFilterStatus(status)
  }

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge bg="success" className="rounded-pill">Active</Badge>
    ) : (
      <Badge bg="secondary" className="rounded-pill">Inactive</Badge>
    )
  }

  const getPositionColor = (position: string) => {
    if (!position) return 'secondary'
    if (position.startsWith('Barangay Captain')) return 'primary'
    if (position.startsWith('Barangay Kagawad')) return 'info'
    if (position.startsWith('Barangay Secretary')) return 'warning'
    if (position.startsWith('Barangay Treasurer')) return 'success'
    if (position.startsWith('Barangay Administrator') || position.startsWith('Barangay Clerk')) return 'dark'
    if (position.startsWith('SK')) return 'danger'
    if (position.includes('Health Worker')) return 'info'
    if (position.includes('Tanod')) return 'dark'
    if (position.includes('Day Care')) return 'warning'
    return 'secondary'
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Filters */}
      <div className="p-4 border-bottom">
        <div className="row g-3">
          <div className="col-md-4">
            <Form onSubmit={handleSearch}>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search officials..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary">
                  🔍
                </Button>
              </InputGroup>
            </Form>
          </div>
          {!hidePositionFilter && (
          <div className="col-md-3">
            <Form.Select
              value={selectedPosition}
              onChange={(e) => handlePositionFilter(e.target.value)}
            >
              <option value="">All Positions</option>
              {positionOptions.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Form.Select>
          </div>
          )}
          <div className="col-md-3">
            <Form.Select
              value={selectedStatus === null ? '' : selectedStatus.toString()}
              onChange={(e) => handleStatusFilter(e.target.value === '' ? null : e.target.value === 'true')}
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Form.Select>
          </div>
          <div className="col-md-2">
            <Button
              variant="outline-secondary"
              onClick={() => {
                setSearchInput('')
                setSelectedPosition('')
                setSelectedStatus(null)
                onSearch('')
                onFilterPosition('')
                onFilterStatus(null)
              }}
            >
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="table-responsive">
        <Table className="mb-0">
          <thead className="table-light">
            <tr>
              <th>Photo</th>
              <th>Name</th>
              <th>Position</th>
              <th>Term Period</th>
              <th>Contact</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <>
                {[...Array(5)].map((_, index) => (
                  <tr key={index}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="skeleton-circle" style={{ width: '40px', height: '40px', marginRight: '12px' }}></div>
                        <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                      </div>
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-badge" style={{ width: '70px', height: '20px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div>
                    </td>
                    <td>
                      <div className="skeleton-button" style={{ width: '60px', height: '28px' }}></div>
                    </td>
                  </tr>
                ))}
              </>
            ) : officials.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-4 text-brand-muted">
                  No officials found
                </td>
              </tr>
            ) : (
              officials.map((official) => (
                <tr key={official.id}>
                  <td>
                    {official.photo_url ? (
                      <div
                        className="rounded-circle overflow-hidden"
                        style={{
                          width: '40px',
                          height: '40px',
                          minWidth: '40px',
                          minHeight: '40px',
                          maxWidth: '40px',
                          maxHeight: '40px',
                          display: 'inline-block',
                          backgroundColor: 'var(--color-border-light)'
                        }}
                      >
                        <img
                          key={`${official.id}-${official.updated_at || ''}`}
                          src={official.photo_url}
                          alt={official.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.error('Failed to load official photo in list:', {
                              url: official.photo_url,
                              photo_path: official.photo_path,
                              official_id: official.id
                            });
                            target.style.display = 'none';
                          }}
                          onLoad={() => {
                            // Photo loaded successfully
                          }}
                        />
                      </div>
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px', maxWidth: '40px', maxHeight: '40px', backgroundColor: 'var(--color-border-light)' }}>
                        <span style={{ fontSize: '20px' }}>👤</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <div>
                      <div className="fw-medium">{official.name}</div>
                      {official.user && (
                        <small className="text-brand-muted">{official.user.email}</small>
                      )}
                    </div>
                  </td>
                  <td>
                    <Badge bg={getPositionColor(official.position)} className="rounded-pill">
                      {official.position}
                    </Badge>
                  </td>
                  <td>
                    <small className="text-brand-muted">
                      {official.term_period || 'No term specified'}
                    </small>
                  </td>
                  <td>
                    {official.contact ? (
                      <small>{official.contact}</small>
                    ) : (
                      <small className="text-brand-muted">No contact</small>
                    )}
                  </td>
                  <td>
                    {getStatusBadge(official.active)}
                  </td>
                  <td>
                    {canManage ? (
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                          Actions
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => onEdit(official)}>
                            ✏️ Edit
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => onToggleActive(official.id)}>
                            {official.active ? '🔴 Deactivate' : '🟢 Activate'}
                          </Dropdown.Item>
                          {canDelete && (
                            <>
                              <Dropdown.Divider />
                              <Dropdown.Item
                                onClick={() => onDelete(official.id)}
                                className="text-danger"
                              >
                                🗑️ Delete
                              </Dropdown.Item>
                            </>
                          )}
                        </Dropdown.Menu>
                      </Dropdown>
                    ) : (
                      <span className="text-muted small">View Only</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </div>
    </div>
  )
}
