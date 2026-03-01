import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Button, 
  Form, 
  InputGroup, 
  Modal, 
  Alert,
  Pagination,
  Toast,
  ToastContainer
} from 'react-bootstrap'
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  Printer,
  XCircle,
  Trash2,
  RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { 
  getIssuedCertificates, 
  invalidateCertificate,
  deleteIssuedCertificate,
  restoreIssuedCertificate,
  downloadCertificatePdf,
  previewCertificatePdf,
  printCertificatePdf,
  getIssuedCertificatesListCached,
  setIssuedCertificatesListCached,
  type IssuedCertificate as IssuedCertificateType
} from '../../services/certificate.service'
import LoadingSkeleton from '../ui/LoadingSkeleton'
import Badge from '../ui/Badge'
import ButtonComponent from '../ui/Button'

interface IssuedCertificatesProps {
  certificateType?: 'barangay_clearance' | 'indigency' | 'residency' | 'business_permit_endorsement' | 'solo_parent'
  archived?: boolean
}

export default function IssuedCertificates({ certificateType, archived = false }: IssuedCertificatesProps = {}) {
  const [certificates, setCertificates] = useState<IssuedCertificateType[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvalidateModal, setShowInvalidateModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [selectedCertificate, setSelectedCertificate] = useState<IssuedCertificateType | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState(certificateType || 'all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [toast, setToast] = useState<{ show: boolean; message: string; variant: 'success' | 'danger' }>({
    show: false,
    message: '',
    variant: 'success'
  })

  const listKey = useMemo(
    () => `issued-certs:${archived ? 'archived:' : ''}${debouncedSearch}:${currentPage}:${statusFilter}:${typeFilter}`,
    [archived, debouncedSearch, currentPage, statusFilter, typeFilter]
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchInput])

  const fetchCertificates = useCallback(
    async (showLoading = true, cacheKeyArg?: string) => {
      const k = cacheKeyArg ?? listKey
      if (showLoading) setLoading(true)
      try {
        const response = await getIssuedCertificates({
          page: currentPage,
          search: debouncedSearch || undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          certificate_type: typeFilter !== 'all' ? typeFilter : undefined,
          per_page: 10,
          archived: archived ? true : undefined
        })
        const list = response?.data?.data ?? []
        const lastPage = response?.data?.last_page ?? 1
        setCertificates(Array.isArray(list) ? list : [])
        setTotalPages(lastPage)
        if (!archived) {
          setIssuedCertificatesListCached(k, { data: Array.isArray(list) ? list : [], last_page: lastPage })
        }
      } catch (err: unknown) {
        const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        if (archived && msg) {
          setToast({ show: true, message: msg, variant: 'danger' })
        }
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [currentPage, debouncedSearch, statusFilter, typeFilter, listKey, archived]
  )

  useEffect(() => {
    if (archived) {
      fetchCertificates(true, listKey)
      return
    }
    const cached = getIssuedCertificatesListCached<{ data: IssuedCertificateType[]; last_page: number }>(listKey)
    if (cached != null) {
      setCertificates(cached.data)
      setTotalPages(cached.last_page)
      setLoading(false)
      fetchCertificates(false, listKey).catch(() => {})
      return
    }
    fetchCertificates(true, listKey)
  }, [listKey, fetchCertificates, archived])

  const handleInvalidate = async () => {
    if (!selectedCertificate) return

    try {
      await invalidateCertificate(selectedCertificate.id)
      setShowInvalidateModal(false)
      setSelectedCertificate(null)
      fetchCertificates(true)
    } catch {
      // Optionally toast
    }
  }

  const handleDelete = async () => {
    if (!selectedCertificate) return

    try {
      await deleteIssuedCertificate(selectedCertificate.id)
      setShowDeleteModal(false)
      setSelectedCertificate(null)
      setToast({
        show: true,
        message: 'Record archived successfully',
        variant: 'success'
      })
      fetchCertificates(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setToast({
        show: true,
        message: error?.response?.data?.message || 'Failed to archive certificate',
        variant: 'danger'
      })
    }
  }

  const handleRestore = async () => {
    if (!selectedCertificate || !archived) return
    try {
      await restoreIssuedCertificate(selectedCertificate.id)
      setShowRestoreModal(false)
      setSelectedCertificate(null)
      setToast({ show: true, message: 'Restored successfully', variant: 'success' })
      fetchCertificates(true)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } }
      setToast({ show: true, message: error?.response?.data?.message || 'Failed to restore', variant: 'danger' })
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
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
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
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
          <h5 className="mb-1 text-brand-primary">{archived ? 'Archived Issued Certificates' : 'Issued Certificates'}</h5>
          <p className="text-brand-muted mb-0">{archived ? 'View and restore archived certificates' : 'Manage and track issued certificates'}</p>
        </div>
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
            <ButtonComponent variant="outline" onClick={() => fetchCertificates(true)}>
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
                        {archived ? (
                          <ButtonComponent
                            size="sm"
                            variant="outline-primary"
                            onClick={() => {
                              setSelectedCertificate(certificate)
                              setShowRestoreModal(true)
                            }}
                            title="Restore"
                          >
                            <RotateCcw size={14} />
                          </ButtonComponent>
                        ) : (
                          <>
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
                            <ButtonComponent
                              size="sm"
                              variant="danger"
                              onClick={() => {
                                setSelectedCertificate(certificate)
                                setShowDeleteModal(true)
                              }}
                              title="Archive"
                            >
                              <Trash2 size={14} />
                            </ButtonComponent>
                          </>
                        )}
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

      {/* Delete (Archive) Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            Archive Certificate
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
            <strong>Archive:</strong> This certificate will be moved to the Archive. You can restore it later from the Archive tab.
          </Alert>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="btn-brand-secondary">
            Cancel
          </Button>
          <ButtonComponent variant="danger" onClick={handleDelete} className="btn-danger">
            <Trash2 size={14} className="me-2" />
            Archive
          </ButtonComponent>
        </Modal.Footer>
      </Modal>

      {/* Restore Confirmation Modal */}
      <Modal show={showRestoreModal} onHide={() => setShowRestoreModal(false)}>
        <Modal.Header closeButton className="modal-header-custom">
          <Modal.Title className="modal-title-custom text-brand-primary">
            Restore Certificate
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
          <Alert variant="info">
            Restore this certificate to the active Issued Certificates list?
          </Alert>
        </Modal.Body>
        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={() => setShowRestoreModal(false)} className="btn-brand-secondary">
            Cancel
          </Button>
          <ButtonComponent variant="primary" onClick={handleRestore} className="btn-brand-primary">
            <RotateCcw size={14} className="me-2" />
            Restore
          </ButtonComponent>
        </Modal.Footer>
      </Modal>

      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999 }}>
        <Toast 
          show={toast.show} 
          onClose={() => setToast({ ...toast, show: false })}
          delay={3000}
          autohide
          bg={toast.variant}
        >
          <Toast.Header>
            <strong className="me-auto">
              {toast.variant === 'success' ? 'Success' : 'Error'}
            </strong>
          </Toast.Header>
          <Toast.Body className={toast.variant === 'success' ? 'text-white' : 'text-white'}>
            {toast.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </div>
  )
}
