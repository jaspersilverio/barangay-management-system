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
  Eye, 
  Download,
  Printer,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { 
  getIssuedCertificates, 
  createIssuedCertificate,
  invalidateCertificate,
  downloadCertificatePdf,
  previewCertificatePdf,
  printCertificatePdf,
  type IssuedCertificate as IssuedCertificateType,
  type IssuedCertificateForm
} from '../../services/certificate.service'
import { getCertificateRequests } from '../../services/certificate.service'
import { listResidents } from '../../services/residents.service'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import Badge from '../ui/Badge'
import ButtonComponent from '../ui/Button'

interface IssuedCertificatesProps {
  certificateType?: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement' | 'solo_parent'
}

export default function IssuedCertificates({ certificateType }: IssuedCertificatesProps = {}) {
  const [certificates, setCertificates] = useState<IssuedCertificateType[]>([])
  const [residents, setResidents] = useState<any[]>([])
  const [approvedRequests, setApprovedRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showInvalidateModal, setShowInvalidateModal] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<IssuedCertificateType | null>(null)
  // Separate input value from search query for smooth typing
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState(certificateType || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formData, setFormData] = useState<IssuedCertificateForm>({
    certificate_request_id: 0,
    resident_id: 0,
    certificate_type: (certificateType as any) || 'barangay_clearance',
    purpose: '',
    valid_from: '',
    valid_until: '',
    signed_by: '',
    signature_position: ''
  })
  const [residentSearchTerm, setResidentSearchTerm] = useState('')
  const [filteredResidents, setFilteredResidents] = useState<any[]>([])
  const [requestSearchTerm, setRequestSearchTerm] = useState('')
  const [filteredRequests, setFilteredRequests] = useState<any[]>([])

  // Debounce input value to search query (300ms delay)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setCurrentPage(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    fetchCertificates()
    fetchResidents()
    fetchApprovedRequests()
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

  useEffect(() => {
    if (approvedRequests.length > 0) {
      const filtered = approvedRequests.filter(request =>
        request.resident?.full_name?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
        request.certificate_type?.toLowerCase().includes(requestSearchTerm.toLowerCase()) ||
        request.purpose?.toLowerCase().includes(requestSearchTerm.toLowerCase())
      )
      setFilteredRequests(filtered)
    }
  }, [approvedRequests, requestSearchTerm])

  const fetchCertificates = async () => {
    try {
      setLoading(true)
      const response = await getIssuedCertificates({
        page: currentPage,
        search: debouncedSearch || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        certificate_type: typeFilter !== 'all' ? typeFilter : undefined,
        per_page: 10
      })
      
      setCertificates(response.data.data)
      setTotalPages(response.data.last_page)
    } catch (error) {
      console.error('Failed to fetch issued certificates:', error)
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

  const fetchApprovedRequests = async () => {
    try {
      const response = await getCertificateRequests({ status: 'approved', per_page: 100 })
      setApprovedRequests(response.data.data)
    } catch (error) {
      console.error('Failed to fetch approved requests:', error)
    }
  }

  const handleCreateCertificate = async () => {
    try {
      await createIssuedCertificate(formData)
      setShowCreateModal(false)
      setFormData({
        certificate_request_id: 0,
        resident_id: 0,
        certificate_type: 'barangay_clearance',
        purpose: '',
        valid_from: '',
        valid_until: '',
        signed_by: '',
        signature_position: ''
      })
      setResidentSearchTerm('')
      setRequestSearchTerm('')
      fetchCertificates()
    } catch (error) {
      console.error('Failed to create certificate:', error)
    }
  }

  const handleInvalidate = async () => {
    if (!selectedCertificate) return

    try {
      await invalidateCertificate(selectedCertificate.id)
      setShowInvalidateModal(false)
      setSelectedCertificate(null)
      fetchCertificates()
    } catch (error) {
      console.error('Failed to invalidate certificate:', error)
    }
  }

  const handleDownloadPdf = async (certificate: IssuedCertificateType) => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout. Please try again.')), 30000)
      })
      
      const downloadPromise = downloadCertificatePdf(certificate.id)
      const blob = await Promise.race([downloadPromise, timeoutPromise]) as Blob
      
      const filename = `${certificate.certificate_type}_${certificate.certificate_number}.pdf`
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error('Failed to download PDF:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to download certificate PDF'
      alert(errorMessage)
    }
  }

  const handlePreviewPdf = async (certificate: IssuedCertificateType) => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout. Please try again.')), 30000)
      })
      
      const previewPromise = previewCertificatePdf(certificate.id)
      const url = await Promise.race([previewPromise, timeoutPromise]) as string
      
      if (url) {
        const newWindow = window.open(url, '_blank')
        if (!newWindow) {
          alert('Please allow popups to preview the certificate')
        }
      } else {
        throw new Error('Failed to generate preview URL')
      }
    } catch (error: any) {
      console.error('Failed to preview PDF:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to preview certificate PDF'
      alert(errorMessage)
    }
  }

  const handlePrintPdf = async (certificate: IssuedCertificateType) => {
    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout. Please try again.')), 30000)
      })
      
      const printPromise = printCertificatePdf(certificate.id)
      await Promise.race([printPromise, timeoutPromise])
    } catch (error: any) {
      console.error('Failed to print PDF:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to print certificate PDF'
      alert(errorMessage)
    }
  }

  const getStatusBadge = (certificate: IssuedCertificateType) => {
    if (!certificate.is_valid) {
      return <Badge variant="danger">Invalid</Badge>
    }
    
    const validUntil = new Date(certificate.valid_until)
    const now = new Date()
    
    if (validUntil < now) {
      return <Badge variant="warning">Expired</Badge>
    }
    
    return <Badge variant="success">Valid</Badge>
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

  const getDaysUntilExpiry = (validUntil: string) => {
    const validDate = new Date(validUntil)
    const now = new Date()
    const diffTime = validDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (loading && certificates.length === 0) {
    return <LoadingSkeleton type="table" />
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h5 className="mb-1 text-brand-primary">Issued Certificates</h5>
          <p className="text-brand-muted mb-0">Manage and track issued certificates</p>
        </div>
        <ButtonComponent onClick={() => setShowCreateModal(true)}>
          <Plus size={16} className="me-2" />
          Issue Certificate
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
                placeholder="Search by resident name or certificate number..."
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
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
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
            <ButtonComponent variant="outline" onClick={fetchCertificates}>
              <Filter size={16} className="me-2" />
              Filter
            </ButtonComponent>
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="card-modern">
        <div className="table-responsive">
          <table className="table table-modern">
            <thead>
              <tr>
                <th>Certificate Number</th>
                <th>Resident ID</th>
                <th>Resident Name</th>
                <th>Type</th>
                <th>Status</th>
                <th>Valid Until</th>
                <th>Issued</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {certificates.map((certificate) => {
                const daysUntilExpiry = getDaysUntilExpiry(certificate.valid_until)
                return (
                  <tr key={certificate.id}>
                    <td>
                      <div className="fw-medium">{certificate.certificate_number}</div>
                      <small className="text-brand-muted">{certificate.certificate_type}</small>
                    </td>
                    <td>{certificate.resident_id}</td>
                    <td>
                      <span className="fw-medium">
                        {certificate.resident?.full_name ||
                          (certificate.resident
                            ? [certificate.resident.first_name, certificate.resident.last_name].filter(Boolean).join(' ')
                            : '—')}
                      </span>
                    </td>
                    <td>{getCertificateTypeLabel(certificate.certificate_type)}</td>
                    <td>
                      <div>
                        {getStatusBadge(certificate)}
                        {certificate.is_valid && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                          <div className="mt-1">
                            <small className="text-warning">
                              Expires in {daysUntilExpiry} days
                            </small>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{format(new Date(certificate.valid_until), 'MMM dd, yyyy')}</div>
                        <small className="text-brand-muted">
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{format(new Date(certificate.created_at), 'MMM dd, yyyy')}</div>
                        <small className="text-brand-muted">{format(new Date(certificate.created_at), 'hh:mm a')}</small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewPdf(certificate)}
                          title="Preview PDF"
                        >
                          <Eye size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPdf(certificate)}
                          title="Download PDF"
                        >
                          <Download size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => handlePrintPdf(certificate)}
                          title="Print PDF"
                        >
                          <Printer size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCertificate(certificate)
                            setShowInvalidateModal(true)
                          }}
                          disabled={!certificate.is_valid}
                          title="Invalidate Certificate"
                        >
                          <XCircle size={14} />
                        </ButtonComponent>
                      </div>
                    </td>
                  </tr>
                )
              })}
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

      {/* Create Certificate Modal */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">Issue New Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Certificate Request</Form.Label>
              <div className="position-relative">
                <Form.Control
                  id="request-search"
                  name="request-search"
                  type="text"
                  placeholder="Search for an approved request..."
                  value={requestSearchTerm}
                  onChange={(e) => setRequestSearchTerm(e.target.value)}
                  onFocus={() => setRequestSearchTerm('')}
                />
                {requestSearchTerm && (
                  <div className="position-absolute w-100 bg-white border rounded-bottom" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredRequests.length > 0 ? (
                      filteredRequests.map((request) => (
                        <div
                          key={request.id}
                          className="px-3 py-2"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setFormData({ 
                              ...formData, 
                              certificate_request_id: request.id,
                              resident_id: request.resident_id || 0,
                              certificate_type: request.certificate_type || 'barangay_clearance',
                              purpose: request.purpose || ''
                            })
                            setRequestSearchTerm(`${request.resident?.full_name} - ${getCertificateTypeLabel(request.certificate_type)}`)
                          }}
                        >
                          <div className="fw-medium">{request.resident?.full_name}</div>
                          <small className="text-muted">
                            {getCertificateTypeLabel(request.certificate_type)} • {request.purpose?.substring(0, 50)}...
                          </small>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-muted">No approved requests found</div>
                    )}
                  </div>
                )}
                {formData.certificate_request_id > 0 && (
                  <div className="mt-2">
                    <small className="text-success">
                      Selected: {approvedRequests.find(r => r.id === formData.certificate_request_id)?.resident?.full_name} - {getCertificateTypeLabel(approvedRequests.find(r => r.id === formData.certificate_request_id)?.certificate_type || '')}
                    </small>
                  </div>
                )}
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Resident</Form.Label>
              <div className="position-relative">
                <Form.Control
                  id="resident-search-issued"
                  name="resident-search-issued"
                  type="text"
                  placeholder="Search for a resident..."
                  value={residentSearchTerm}
                  onChange={(e) => setResidentSearchTerm(e.target.value)}
                  onFocus={() => setResidentSearchTerm('')}
                />
                {residentSearchTerm && (
                  <div className="position-absolute w-100 bg-white border rounded-bottom" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredResidents.length > 0 ? (
                      filteredResidents.map((resident) => (
                        <div
                          key={resident.id}
                          className="px-3 py-2"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setFormData({ ...formData, resident_id: resident.id })
                            setResidentSearchTerm(resident.full_name)
                          }}
                        >
                          <div className="fw-medium">{resident.full_name}</div>
                          <small className="text-muted">
                            {resident.household?.address} • {resident.relationship_to_head}
                          </small>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-muted">No residents found</div>
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
                id="certificate-type-issued"
                name="certificate-type-issued"
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
                id="purpose-issued"
                name="purpose-issued"
                as="textarea"
                rows={3}
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Describe the purpose of this certificate..."
              />
            </Form.Group>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Valid From</Form.Label>
                  <Form.Control
                    id="valid-from"
                    name="valid-from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Valid Until</Form.Label>
                  <Form.Control
                    id="valid-until"
                    name="valid-until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Signed By</Form.Label>
                  <Form.Control
                    id="signed-by"
                    name="signed-by"
                    value={formData.signed_by}
                    onChange={(e) => setFormData({ ...formData, signed_by: e.target.value })}
                    placeholder="Name of signatory"
                  />
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Position</Form.Label>
                  <Form.Control
                    id="signature-position"
                    name="signature-position"
                    value={formData.signature_position}
                    onChange={(e) => setFormData({ ...formData, signature_position: e.target.value })}
                    placeholder="Position/Title"
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowCreateModal(false)} className="btn-brand-secondary">
            Cancel
          </Button>
          <ButtonComponent onClick={handleCreateCertificate} className="btn-brand-primary">
            Issue Certificate
          </ButtonComponent>
        </Modal.Footer>
      </Modal>

      {/* Invalidate Confirmation Modal */}
      <Modal show={showInvalidateModal} onHide={() => setShowInvalidateModal(false)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            Invalidate Certificate
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body-custom">
          {selectedCertificate && (
            <div className="mb-3">
              <p><strong>Certificate Number:</strong> {selectedCertificate.certificate_number}</p>
              <p><strong>Resident:</strong> {selectedCertificate.resident?.full_name}</p>
              <p><strong>Type:</strong> {getCertificateTypeLabel(selectedCertificate.certificate_type)}</p>
            </div>
          )}
          <Alert variant="warning">
            Are you sure you want to invalidate this certificate? This action cannot be undone.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowInvalidateModal(false)} className="btn-brand-secondary">
            Cancel
          </Button>
          <ButtonComponent variant="danger" onClick={handleInvalidate} className="btn-danger">
            Invalidate
          </ButtonComponent>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
