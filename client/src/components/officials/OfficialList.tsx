import React, { useState } from 'react'
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
}

export default function OfficialList({
  officials,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onSearch,
  onFilterPosition,
  onFilterStatus
}: OfficialListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<boolean | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchTerm)
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
    const colors: { [key: string]: string } = {
      'Barangay Captain': 'primary',
      'Barangay Kagawad': 'info',
      'Barangay Secretary': 'warning',
      'Barangay Treasurer': 'success',
      'Barangay SK Chairman': 'danger',
      'Barangay SK Kagawad': 'danger',
      'Barangay Health Worker': 'info',
      'Barangay Tanod': 'dark',
      'Barangay Day Care Worker': 'warning',
      'Other': 'secondary'
    }
    return colors[position] || 'secondary'
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
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button type="submit" variant="outline-secondary">
                  🔍
                </Button>
              </InputGroup>
            </Form>
          </div>
          <div className="col-md-3">
            <Form.Select
              value={selectedPosition}
              onChange={(e) => handlePositionFilter(e.target.value)}
            >
              <option value="">All Positions</option>
              <option value="Barangay Captain">Barangay Captain</option>
              <option value="Barangay Kagawad">Barangay Kagawad</option>
              <option value="Barangay Secretary">Barangay Secretary</option>
              <option value="Barangay Treasurer">Barangay Treasurer</option>
              <option value="Barangay SK Chairman">Barangay SK Chairman</option>
              <option value="Barangay SK Kagawad">Barangay SK Kagawad</option>
              <option value="Barangay Health Worker">Barangay Health Worker</option>
              <option value="Barangay Tanod">Barangay Tanod</option>
              <option value="Barangay Day Care Worker">Barangay Day Care Worker</option>
              <option value="Other">Other</option>
            </Form.Select>
          </div>
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
                setSearchTerm('')
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
                      <img
                        key={`${official.id}-${official.updated_at || ''}`}
                        src={official.photo_url}
                        alt={official.name}
                        width={40}
                        height={40}
                        className="rounded-circle"
                        style={{ objectFit: 'cover', display: 'block' }}
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
                          console.log('Official photo loaded in list:', official.photo_url);
                        }}
                      />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', backgroundColor: 'var(--color-border-light)' }}>
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
                        <Dropdown.Divider />
                        <Dropdown.Item 
                          onClick={() => onDelete(official.id)}
                          className="text-danger"
                        >
                          🗑️ Delete
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
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
