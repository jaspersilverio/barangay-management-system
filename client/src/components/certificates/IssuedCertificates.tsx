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
  RefreshCw,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { 
  getIssuedCertificates, 
  createIssuedCertificate,
  downloadCertificatePdf,
  previewCertificatePdf,
  regenerateCertificatePdf,
  invalidateCertificate,
  type IssuedCertificate as IssuedCertificateType,
  type IssuedCertificateForm
} from '../../services/certificate.service'
import { getCertificateRequests } from '../../services/certificate.service'
import { listResidents } from '../../services/residents.service'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import Badge from '../ui/Badge'
import ButtonComponent from '../ui/Button'

export default function IssuedCertificates() {
  const [certificates, setCertificates] = useState<IssuedCertificateType[]>([])
  const [residents, setResidents] = useState<any[]>([])
  const [approvedRequests, setApprovedRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<IssuedCertificateType | null>(null)
  const [actionType, setActionType] = useState<'invalidate' | 'regenerate'>('invalidate')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [formData, setFormData] = useState<IssuedCertificateForm>({
    certificate_request_id: 0,
    resident_id: 0,
    certificate_type: 'barangay_clearance',
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

  useEffect(() => {
    fetchCertificates()
    fetchResidents()
    fetchApprovedRequests()
  }, [currentPage, searchTerm, statusFilter, typeFilter])

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
        search: searchTerm || undefined,
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

  const handleAction = async () => {
    if (!selectedCertificate) return

    try {
      switch (actionType) {
        case 'invalidate':
          await invalidateCertificate(selectedCertificate.id)
          break
        case 'regenerate':
          await regenerateCertificatePdf(selectedCertificate.id)
          break
      }
      
      setShowActionModal(false)
      setSelectedCertificate(null)
      fetchCertificates()
    } catch (error) {
      console.error('Failed to perform action:', error)
    }
  }

  const handleDownloadPdf = async (certificate: IssuedCertificateType) => {
    try {
      // Make a direct request to download the file
      const response = await fetch(`http://localhost:8000/api/certificates/${certificate.id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/pdf'
        }
      });

      if (response.ok) {
        // Get the filename from the response headers or use a default
        const contentDisposition = response.headers.get('content-disposition');
        let filename = `certificate_${certificate.certificate_number}.pdf`;
        
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        console.error('Failed to download PDF:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  }

  const handlePreviewPdf = async (certificate: IssuedCertificateType) => {
    try {
      // Make a direct request to get the PDF for preview
      const response = await fetch(`http://localhost:8000/api/certificates/${certificate.id}/preview`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Accept': 'application/pdf'
        }
      });

      if (response.ok) {
        // Create blob and open in new tab for preview
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Note: We don't revoke the URL immediately as it's being used in the new tab
        // The browser will clean it up when the tab is closed
      } else {
        console.error('Failed to preview PDF:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to preview PDF:', error);
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
          <h5 className="mb-1">Issued Certificates</h5>
          <p className="text-muted mb-0">Manage and track issued certificates</p>
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
                <th>Resident</th>
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
                      <small className="text-muted">{certificate.certificate_type}</small>
                    </td>
                    <td>
                      <div>
                        <div className="fw-medium">{certificate.resident?.full_name}</div>
                        <small className="text-muted">ID: {certificate.resident_id}</small>
                      </div>
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
                        <small className="text-muted">
                          {daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}
                        </small>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div>{format(new Date(certificate.created_at), 'MMM dd, yyyy')}</div>
                        <small className="text-muted">{format(new Date(certificate.created_at), 'hh:mm a')}</small>
                      </div>
                    </td>
                    <td>
                      <div className="d-flex gap-1">
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => handlePreviewPdf(certificate)}
                        >
                          <Eye size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownloadPdf(certificate)}
                        >
                          <Download size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCertificate(certificate)
                            setActionType('regenerate')
                            setShowActionModal(true)
                          }}
                        >
                          <RefreshCw size={14} />
                        </ButtonComponent>
                        <ButtonComponent
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedCertificate(certificate)
                            setActionType('invalidate')
                            setShowActionModal(true)
                          }}
                          disabled={!certificate.is_valid}
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
        <Modal.Header closeButton>
          <Modal.Title>Issue New Certificate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                           className="px-3 py-2 cursor-pointer hover-bg-light"
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
                           onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                           onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
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
                          className="px-3 py-2 cursor-pointer hover-bg-light"
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setFormData({ ...formData, resident_id: resident.id })
                            setResidentSearchTerm(resident.full_name)
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Cancel
          </Button>
          <ButtonComponent onClick={handleCreateCertificate}>
            Issue Certificate
          </ButtonComponent>
        </Modal.Footer>
      </Modal>

      {/* Action Modal */}
      <Modal show={showActionModal} onHide={() => setShowActionModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {actionType === 'invalidate' && 'Invalidate Certificate'}
            {actionType === 'regenerate' && 'Regenerate PDF'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedCertificate && (
            <div className="mb-3">
              <p>
                <strong>Certificate Number:</strong> {selectedCertificate.certificate_number}
              </p>
              <p>
                <strong>Resident:</strong> {selectedCertificate.resident?.full_name}
              </p>
              <p>
                <strong>Type:</strong> {getCertificateTypeLabel(selectedCertificate.certificate_type)}
              </p>
            </div>
          )}
          
          {actionType === 'invalidate' && (
            <Alert variant="warning">
              Are you sure you want to invalidate this certificate? This action cannot be undone.
            </Alert>
          )}
          
          {actionType === 'regenerate' && (
            <Alert variant="info">
              This will regenerate the PDF file for this certificate. The existing PDF will be replaced.
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowActionModal(false)}>
            Cancel
          </Button>
          <ButtonComponent 
            variant={actionType === 'invalidate' ? 'danger' : 'primary'}
            onClick={handleAction}
          >
            {actionType === 'invalidate' && 'Invalidate'}
            {actionType === 'regenerate' && 'Regenerate'}
          </ButtonComponent>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
