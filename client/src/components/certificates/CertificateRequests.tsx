import { useState, useEffect } from 'react'
import { 
  Button, 
  Form, 
  InputGroup, 
  Modal, 
  Alert,
  Pagination
} from 'react-bootstrap'
import { 
  Plus, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { 
  getCertificateRequests, 
  createCertificateRequest,
  approveCertificateRequest,
  rejectCertificateRequest,
  releaseCertificateRequest,
  deleteCertificateRequest,
  type CertificateRequest as CertificateRequestType,
  type CertificateRequestForm
} from '../../services/certificate.service'
import { listResidents } from '../../services/residents.service'
import { useAuth } from '../../context/AuthContext'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import BadgeComponent from '../ui/Badge'
import ButtonComponent from '../ui/Button'

interface CertificateRequestsProps {
  certificateType?: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement' | 'solo_parent'
}

export default function CertificateRequests({ certificateType }: CertificateRequestsProps = {}) {
  const { user } = useAuth()
  const canApprove = user?.role === 'captain' || user?.role === 'admin'
  const [requests, setRequests] = useState<CertificateRequestType[]>([])
  const [residents, setResidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<CertificateRequestType | null>(null)
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'release' | 'delete'>('approve')
  const [remarks, setRemarks] = useState('')
  // Separate input value from search query for smooth typing
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState(certificateType || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formData, setFormData] = useState<CertificateRequestForm>({
    resident_id: 0,
    certificate_type: (certificateType as any) || 'barangay_clearance',
    purpose: '',
    additional_requirements: ''
  })
  const [residentSearchTerm, setResidentSearchTerm] = useState('')
  const [filteredResidents, setFilteredResidents] = useState<any[]>([])

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setCurrentPage(1) // Reset to first page when search changes
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    fetchRequests()
    fetchResidents()
  }, [currentPage, debouncedSearch, statusFilter, typeFilter])

  useEffect(() => {
    if (residents.length > 0) {
      const filtered = residents.filter(resident =>
        resident.full_name?.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
        resident.first_name?.toLowerCase().includes(residentSearchTerm.toLowerCase()) ||
        resident.last_name?.toLowerCase().includes(residentSearchTerm.toLowerCase())
      )
      setFilteredResidents(filtered)
    }
  }, [residents, residentSearchTerm])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await getCertificateRequests({
        page: currentPage,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        certificate_type: typeFilter !== 'all' ? typeFilter : undefined,
        per_page: 10
      })
      
      setRequests(response.data.data)
      setTotalPages(response.data.last_page)
    } catch (error) {
      console.error('Failed to fetch certificate requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchResidents = async () => {
    try {
      const response = await listResidents({ page: 1, per_page: 1000 })
      setResidents(response.data.data)
    } catch (error) {
      console.error('Failed to fetch residents:', error)
    }
  }

  const handleCreateRequest = async () => {
    // Frontend validation
    if (!formData.resident_id || formData.resident_id === 0) {
      alert('Please select a resident')
      return
    }
    if (!formData.purpose.trim()) {
      alert('Please enter a purpose')
      return
    }

    try {
      await createCertificateRequest(formData)
      setShowCreateModal(false)
      setFormData({
        resident_id: 0,
        certificate_type: 'barangay_clearance',
        purpose: '',
        additional_requirements: ''
      })
      setResidentSearchTerm('')
      fetchRequests()
    } catch (error: any) {
      console.error('Failed to create certificate request:', error)
      // Show validation errors if available
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors
        const errorMessages = Object.values(errors).flat().join('\n')
        alert(`Validation errors:\n${errorMessages}`)
      } else {
        alert(error.response?.data?.message || 'Failed to create certificate request')
      }
    }
  }

  const handleAction = async () => {
    if (!selectedRequest) return

    try {
      switch (actionType) {
        case 'approve':
          await approveCertificateRequest(selectedRequest.id, remarks || undefined)
          break
        case 'reject':
          await rejectCertificateRequest(selectedRequest.id, remarks)
          break
        case 'release':
          await releaseCertificateRequest(selectedRequest.id, remarks || undefined)
          break
        case 'delete':
          await deleteCertificateRequest(selectedRequest.id)
          break
      }
      
      setShowActionModal(false)
      setSelectedRequest(null)
      setRemarks('')
      fetchRequests()
    } catch (error) {
      console.error('Failed to perform action:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'neutral'> = {
      pending: 'warning',
      approved: 'success',
      released: 'info',
      rejected: 'danger'
    }
    return <BadgeComponent variant={variants[status] || 'neutral'}>{status}</BadgeComponent>
  }

  const getCertificateTypeLabel = (type: string) => {
    const labels = {
      barangay_clearance: 'Barangay Clearance',
      indigency: 'Indigency Certificate',
      residency: 'Residency Certificate',
      business_permit_endorsement: 'Business Permit Endorsement'
    }
    return labels[type as keyof typeof labels] || type
  }

  if (loading && requests.length === 0) {
    return <LoadingSkeleton type="table" />
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1 text-brand-primary">Certificate Requests</h5>
          <p className="text-brand-muted mb-0">Manage and track certificate requests from residents</p>
        </div>
        <ButtonComponent onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="me-2" />
          New Request
        </ButtonComponent>
      </div>

      {/* Filters */}
      <div className="card-modern mb-4">
        <div className="row g-3">
          <div className="col-md-4">
            <InputGroup>
              <InputGroup.Text>
                <Search size={16} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search by resident name..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </InputGroup>
          </div>
          <div className="col-md-3">
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="released">Released</option>
              <option value="rejected">Rejected</option>
            </Form.Select>
          </div>
          <div className="col-md-3">
            <Form.Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="barangay_clearance">Barangay Clearance</option>
              <option value="indigency">Indigency</option>
              <option value="residency">Residency</option>
              <option value="business_permit_endorsement">Business Permit</option>
            </Form.Select>
          </div>
          <div className="col-md-2">
            <ButtonComponent variant="outline" onClick={fetchRequests}>
              <Filter size={16} className="me-2" />
              Filter
            </ButtonComponent>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="card-modern">
        <div className="table-responsive">
          <table className="table table-modern">
            <thead>
              <tr>
                <th>Resident</th>
                <th>Certificate Type</th>
                <th>Purpose</th>
                <th>Status</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <div>
                      <div className="fw-medium">{request.resident?.full_name}</div>
                      <small className="text-brand-muted">ID: {request.resident_id}</small>
                    </div>
                  </td>
                  <td>{getCertificateTypeLabel(request.certificate_type)}</td>
                  <td>
                    <div className="text-truncate" style={{ maxWidth: '200px' }}>
                      {request.purpose}
                    </div>
                  </td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>
                    <div>
                      <div>{format(new Date(request.requested_at), 'MMM dd, yyyy')}</div>
                      <small className="text-brand-muted">{format(new Date(request.requested_at), 'hh:mm a')}</small>
                    </div>
                  </td>
                  <td>
                    {canApprove ? (
                      <div className="d-flex gap-1">
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request)
                            setActionType('approve')
                            setShowActionModal(true)
                          }}
                          disabled={request.status !== 'pending'}
                        >
                          <CheckCircle size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request)
                            setActionType('reject')
                            setShowActionModal(true)
                          }}
                          disabled={!['pending', 'approved'].includes(request.status)}
                        >
                          <XCircle size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRequest(request)
                            setActionType('release')
                            setShowActionModal(true)
                          }}
                          disabled={request.status !== 'approved'}
                        >
                          <Clock size={14} />
                        </ButtonComponent>
                      </div>
                    ) : (
                      <span className="text-muted small">Awaiting approval</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-center mt-4">
            <Pagination>
              <Pagination.First 
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
              />
              <Pagination.Prev 
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              />
              
              {[...Array(totalPages)].map((_, i) => (
                <Pagination.Item
                  key={i + 1}
                  active={currentPage === i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                >
                  {i + 1}
                </Pagination.Item>
              ))}
              
              <Pagination.Next 
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              />
              <Pagination.Last 
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
              />
            </Pagination>
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">New Certificate Request</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Resident</Form.Label>
              <div className="position-relative">
                <Form.Control
                  id="resident-search"
                  name="resident-search"
                  type="text"
                  placeholder="Search for a resident..."
                  value={residentSearchTerm}
                  onChange={(e) => setResidentSearchTerm(e.target.value)}
                />
                {residentSearchTerm && (
                  <div 
                    className="position-absolute w-100 border rounded-bottom" 
                    style={{ 
                      zIndex: 1000, 
                      maxHeight: '200px', 
                      overflowY: 'auto',
                      backgroundColor: '#FFFFFF',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    {filteredResidents.length > 0 ? (
                      filteredResidents.map((resident) => (
                        <div
                          key={resident.id}
                          className="px-3 py-2"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#F1F5F9'
                            e.currentTarget.style.color = '#0F172A'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF'
                            e.currentTarget.style.color = '#0F172A'
                          }}
                          style={{ 
                            cursor: 'pointer',
                            backgroundColor: '#FFFFFF',
                            color: '#0F172A'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault() // Prevent input from getting focus
                            setFormData({ ...formData, resident_id: resident.id })
                            setResidentSearchTerm('') // Clear search term after selection
                            // Blur the input field
                            const input = document.getElementById('resident-search') as HTMLInputElement
                            if (input) {
                              input.blur()
                            }
                          }}
                        >
                          <div className="fw-medium" style={{ color: '#0F172A' }}>{resident.full_name}</div>
                          <small style={{ color: '#6B7280' }}>
                            {resident.household?.address} • {resident.relationship_to_head}
                          </small>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2" style={{ color: '#6B7280' }}>No residents found</div>
                    )}
                  </div>
                )}
                {formData.resident_id > 0 && (
                  <div className="mt-2">
                    <small className="text-success">
                      Selected: {residents.find(r => r.id === formData.resident_id)?.full_name}
                    </small>
                  </div>
                )}
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Certificate Type</Form.Label>
              <Form.Select
                id="certificate-type"
                name="certificate-type"
                value={formData.certificate_type}
                onChange={(e) => setFormData({ ...formData, certificate_type: e.target.value as any })}
              >
                <option value="barangay_clearance">Barangay Clearance</option>
                <option value="indigency">Indigency Certificate</option>
                <option value="residency">Residency Certificate</option>
                <option value="business_permit_endorsement">Business Permit Endorsement</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Purpose</Form.Label>
              <Form.Control
                id="purpose"
                name="purpose"
                as="textarea"
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Describe the purpose of this certificate request..."
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Additional Requirements (Optional)</Form.Label>
              <Form.Control
                id="additional-requirements"
                name="additional-requirements"
                as="textarea"
                rows={2}
                value={formData.additional_requirements || ''}
                onChange={(e) => setFormData({ ...formData, additional_requirements: e.target.value })}
                placeholder="Any additional requirements or notes..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="btn-brand-secondary">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <ButtonComponent onClick={handleCreateRequest} className="btn-brand-primary">
            <i className="fas fa-save me-1"></i>
            Create Request
          </ButtonComponent>
        </Modal.Footer>
      </Modal>

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            {actionType === 'approve' && 'Approve Request'}
            {actionType === 'reject' && 'Reject Request'}
            {actionType === 'release' && 'Release Certificate'}
            {actionType === 'delete' && 'Delete Request'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {selectedRequest && (
            <div className="mb-3">
              <p>
                <strong>Resident:</strong> {selectedRequest.resident?.full_name}
              </p>
              <p>
                <strong>Certificate:</strong> {getCertificateTypeLabel(selectedRequest.certificate_type)}
              </p>
              <p>
                <strong>Purpose:</strong> {selectedRequest.purpose}
              </p>
            </div>
          )}
          
          {(actionType === 'reject' || actionType === 'approve' || actionType === 'release') && (
            <Form.Group>
              <Form.Label>
                {actionType === 'reject' ? 'Rejection Reason' : 'Remarks (Optional)'}
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder={actionType === 'reject' ? 'Please provide a reason for rejection...' : 'Add any remarks...'}
                required={actionType === 'reject'}
              />
            </Form.Group>
          )}
          
          {actionType === 'delete' && (
            <Alert variant="warning">
              Are you sure you want to delete this certificate request? This action cannot be undone.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowActionModal(false)} className="btn-brand-secondary">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <ButtonComponent 
            variant={actionType === 'reject' || actionType === 'delete' ? 'danger' : 'primary'}
            onClick={handleAction}
            disabled={actionType === 'reject' && !remarks.trim()}
            className={actionType === 'reject' || actionType === 'delete' ? 'btn-danger' : 'btn-brand-primary'}
          >
            <i className={`fas ${
              actionType === 'approve' ? 'fa-check' : 
              actionType === 'reject' ? 'fa-times' : 
              actionType === 'release' ? 'fa-paper-plane' : 
              'fa-trash'
            } me-1`}></i>
            {actionType === 'approve' && 'Approve'}
            {actionType === 'reject' && 'Reject'}
            {actionType === 'release' && 'Release'}
            {actionType === 'delete' && 'Delete'}
          </ButtonComponent>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
