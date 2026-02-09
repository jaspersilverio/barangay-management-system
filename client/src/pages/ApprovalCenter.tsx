import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Button, Form, Modal, Badge, Alert } from 'react-bootstrap'
import { CheckCircle, XCircle, Clock, Filter, FileText, AlertTriangle, ClipboardList, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { getApprovalQueue, type PendingRequest } from '../services/approval-queue.service'
import { approveCertificateRequest, rejectCertificateRequest } from '../services/certificate.service'
import blotterService from '../services/blotter.service'
import { approveIncidentReport, rejectIncidentReport } from '../services/incident-reports.service'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationContext'
import { getBarangayInfo } from '../services/barangay-info.service'

export default function ApprovalCenter() {
  const { user } = useAuth()
  const { refreshNotifications } = useNotifications()
  const [requests, setRequests] = useState<PendingRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState<'all' | 'certificate' | 'blotter' | 'incident'>('all')
  const [statistics, setStatistics] = useState({
    total_pending: 0,
    certificates: 0,
    blotters: 0,
    incidents: 0
  })
  const [selectedRequest, setSelectedRequest] = useState<PendingRequest | null>(null)
  const [showActionModal, setShowActionModal] = useState(false)
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve')
  const [remarks, setRemarks] = useState('')
  const [processing, setProcessing] = useState(false)
  const [hasSignature, setHasSignature] = useState<boolean | null>(null)
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null)
  const [checkingSignature, setCheckingSignature] = useState(true)

  // Check if user is captain or admin
  const canApprove = user?.role === 'captain' || user?.role === 'admin'

  useEffect(() => {
    if (canApprove) {
      fetchRequests()
      checkSignatureStatus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, canApprove])

  const checkSignatureStatus = async () => {
    try {
      setCheckingSignature(true)
      const response = await getBarangayInfo()
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      if (response.success && response.data) {
        const path = response.data.captain_signature_path
        setHasSignature(!!path)
        setSignatureUrl(path ? `${baseUrl}/storage/${path}` : null)
      }
    } catch (error) {
      console.error('Failed to check signature status:', error)
    } finally {
      setCheckingSignature(false)
    }
  }

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await getApprovalQueue({ type: typeFilter })
      if (response.success) {
        setRequests(response.data)
        setStatistics(response.statistics)
      }
    } catch (error) {
      console.error('Failed to fetch approval queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!selectedRequest) return

    try {
      setProcessing(true)
      
      switch (selectedRequest.type) {
        case 'certificate':
          if (actionType === 'approve') {
            await approveCertificateRequest(selectedRequest.id, remarks || undefined)
          } else {
            await rejectCertificateRequest(selectedRequest.id, remarks)
          }
          break
        case 'blotter':
          if (actionType === 'approve') {
            await blotterService.approveBlotter(selectedRequest.id)
          } else {
            await blotterService.rejectBlotter(selectedRequest.id, remarks)
          }
          break
        case 'incident':
          if (actionType === 'approve') {
            await approveIncidentReport(selectedRequest.id)
          } else {
            await rejectIncidentReport(selectedRequest.id, remarks)
          }
          break
      }

      // Close modal immediately after successful action
      setShowActionModal(false)
      setSelectedRequest(null)
      setRemarks('')
      setProcessing(false)
      
      // Refresh data in background
      fetchRequests()
      refreshNotifications()
      // Re-check signature status after approval attempt
      if (actionType === 'approve') {
        checkSignatureStatus()
      }
    } catch (error: any) {
      console.error('Failed to perform action:', error)
      const errorMessage = error.response?.data?.message || 'Failed to perform action'
      alert(errorMessage)
      
      // If error is about missing signature, update status
      if (errorMessage.includes('signature')) {
        checkSignatureStatus()
      }
      setProcessing(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'certificate':
        return <FileText className="w-5 h-5" />
      case 'blotter':
        return <ClipboardList className="w-5 h-5" />
      case 'incident':
        return <AlertTriangle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'certificate':
        return 'bg-blue-100 text-blue-800'
      case 'blotter':
        return 'bg-purple-100 text-purple-800'
      case 'incident':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!canApprove) {
    return (
      <div className="page-container">
        <Alert variant="warning">
          <Alert.Heading>Access Restricted</Alert.Heading>
          <p>Only Barangay Captain or Admin can access the approval center.</p>
        </Alert>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1 text-brand-primary">Approval Center</h1>
          <p className="text-brand-muted mb-0">Review and approve pending requests</p>
        </div>
        <Button variant="outline-primary" onClick={fetchRequests} disabled={loading}>
          <Clock className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="card-modern">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1">Total Pending</p>
                  <h3 className="mb-0">{statistics.total_pending}</h3>
                </div>
                <div className="bg-primary bg-opacity-10 p-3 rounded">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-modern">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1">Certificates</p>
                  <h3 className="mb-0">{statistics.certificates}</h3>
                </div>
                <div className="bg-blue bg-opacity-10 p-3 rounded">
                  <FileText className="w-6 h-6 text-blue" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-modern">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1">Blotters</p>
                  <h3 className="mb-0">{statistics.blotters}</h3>
                </div>
                <div className="bg-purple bg-opacity-10 p-3 rounded">
                  <ClipboardList className="w-6 h-6 text-purple" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-modern">
            <Card.Body>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <p className="text-muted mb-1">Incidents</p>
                  <h3 className="mb-0">{statistics.incidents}</h3>
                </div>
                <div className="bg-orange bg-opacity-10 p-3 rounded">
                  <AlertTriangle className="w-6 h-6 text-orange" />
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Signature Warning */}
      {canApprove && !checkingSignature && hasSignature === false && (
        <Alert variant="warning" className="mb-4">
          <Alert.Heading className="d-flex align-items-center">
            <AlertCircle className="w-5 h-5 me-2" />
            Signature Required
          </Alert.Heading>
          <p className="mb-2">
            <strong>No Kapitan signature is set.</strong> Upload a signature in Barangay Settings so it appears on approved certificates and documents.
          </p>
          <p className="mb-0 small">
            Go to <strong>Settings → Barangay Information</strong> and upload the <strong>Kapitan Signature</strong> image.
          </p>
        </Alert>
      )}

      {/* Filter */}
      <Card className="card-modern mb-4">
        <Card.Body>
          <div className="d-flex align-items-center gap-3">
            <Filter className="w-5 h-5 text-muted" />
            <Form.Select
              style={{ maxWidth: '200px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="all">All Types</option>
              <option value="certificate">Certificates</option>
              <option value="blotter">Blotters</option>
              <option value="incident">Incidents</option>
            </Form.Select>
          </div>
        </Card.Body>
      </Card>

      {/* Requests List */}
      <Card className="card-modern">
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-5">
              <Clock className="w-12 h-12 text-muted mb-3" />
              <h5>No Pending Requests</h5>
              <p className="text-muted">All requests have been processed.</p>
            </div>
          ) : (
            <div className="list-group">
              {requests.map((request) => (
                <div
                  key={`${request.type}-${request.id}`}
                  className="list-group-item list-group-item-action"
                >
                  <div className="d-flex align-items-start gap-3">
                    <div className={`p-2 rounded ${getTypeColor(request.type)}`}>
                      {getTypeIcon(request.type)}
                    </div>
                    <div className="flex-grow-1">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <h6 className="mb-0">{request.title}</h6>
                        <Badge bg="secondary">{request.type_label}</Badge>
                      </div>
                      <p className="text-muted mb-2 small">{request.subtitle}</p>
                      <div className="d-flex align-items-center gap-4 text-muted small">
                        <span>Requested by: {request.requested_by}</span>
                        <span>
                          {format(new Date(request.requested_at), 'MMM dd, yyyy hh:mm a')}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="success"
                        size="sm"
                        onClick={async () => {
                          setSelectedRequest(request)
                          setActionType('approve')
                          setRemarks('')
                          await checkSignatureStatus() // Refresh signature status before opening modal
                          setShowActionModal(true)
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => {
                          setSelectedRequest(request)
                          setActionType('reject')
                          setRemarks('')
                          setShowActionModal(true)
                        }}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Enhanced Approval Modal */}
      <Modal 
        show={showActionModal} 
        onHide={() => {
          setShowActionModal(false)
          setSelectedRequest(null)
          setRemarks('')
        }}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">
            <div className="d-flex align-items-center gap-2">
              {actionType === 'approve' ? (
                <CheckCircle className="text-success" style={{ width: '24px', height: '24px' }} />
              ) : (
                <XCircle className="text-danger" style={{ width: '24px', height: '24px' }} />
              )}
              {actionType === 'approve' ? 'Official Approval' : 'Request Rejection'}
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {selectedRequest && (
            <div>
              {/* 1. REQUEST SUMMARY */}
              <Card className="mb-3 border-primary">
                <Card.Header className="bg-primary text-white fw-bold">
                  Request Summary
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Request Type:</strong>
                        <Badge bg="primary" className="ms-2">{selectedRequest.type_label}</Badge>
                      </p>
                      <p className="mb-2">
                        <strong>Request ID:</strong> #{selectedRequest.id}
                      </p>
                      {selectedRequest.type === 'certificate' && selectedRequest.data?.resident && (
                        <p className="mb-2">
                          <strong>Resident Name:</strong>
                          <br />
                          <span className="text-primary fw-medium">
                            {selectedRequest.data.resident?.full_name || 
                             `${selectedRequest.data.resident?.first_name || ''} ${selectedRequest.data.resident?.last_name || ''}`.trim()}
                          </span>
                        </p>
                      )}
                      {selectedRequest.type === 'blotter' && (
                        <>
                          <p className="mb-2">
                            <strong>Case Number:</strong>
                            <br />
                            <span className="text-primary fw-medium">{selectedRequest.data?.case_number || 'N/A'}</span>
                          </p>
                          <p className="mb-2">
                            <strong>Complainant:</strong>
                            <br />
                            <span className="text-primary fw-medium">
                              {selectedRequest.data?.complainant?.full_name || 
                               selectedRequest.data?.complainant_full_name || 'N/A'}
                            </span>
                          </p>
                          <p className="mb-2">
                            <strong>Respondent:</strong>
                            <br />
                            <span className="text-primary fw-medium">
                              {selectedRequest.data?.respondent?.full_name || 
                               selectedRequest.data?.respondent_full_name || 'N/A'}
                            </span>
                          </p>
                        </>
                      )}
                      {selectedRequest.type === 'incident' && (
                        <p className="mb-2">
                          <strong>Incident Title:</strong>
                          <br />
                          <span className="text-primary fw-medium">{selectedRequest.data?.incident_title || 'N/A'}</span>
                        </p>
                      )}
                    </Col>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Purpose/Description:</strong>
                        <br />
                        <span className="text-muted">
                          {selectedRequest.type === 'certificate' 
                            ? (selectedRequest.data?.purpose || selectedRequest.subtitle.replace('Purpose: ', ''))
                            : selectedRequest.subtitle}
                        </span>
                      </p>
                      <p className="mb-2">
                        <strong>Requested by:</strong>
                        <br />
                        <span className="text-muted">{selectedRequest.requested_by}</span>
                      </p>
                      <p className="mb-0">
                        <strong>Request Date:</strong>
                        <br />
                        <span className="text-muted">
                          {format(new Date(selectedRequest.requested_at), 'MMMM dd, yyyy hh:mm a')}
                        </span>
                      </p>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 2. RECORD VERIFICATION PREVIEW */}
              {selectedRequest.type === 'certificate' && selectedRequest.data?.resident_id && (
                <Card className="mb-3 border-info">
                  <Card.Header className="bg-info text-white fw-bold">
                    Record Verification
                  </Card.Header>
                  <Card.Body>
                    {selectedRequest.data?.resident && (
                      <Row>
                        <Col md={6}>
                          <p className="mb-2">
                            <strong>Resident Name:</strong>
                            <br />
                            {selectedRequest.data.resident?.full_name || 
                             `${selectedRequest.data.resident?.first_name || ''} ${selectedRequest.data.resident?.middle_name || ''} ${selectedRequest.data.resident?.last_name || ''}`.trim()}
                          </p>
                          {selectedRequest.data.resident?.sex && (
                            <p className="mb-2">
                              <strong>Gender:</strong> {selectedRequest.data.resident.sex === 'male' ? 'Male' : selectedRequest.data.resident.sex === 'female' ? 'Female' : 'Other'}
                            </p>
                          )}
                          {selectedRequest.data.resident?.birthdate && (
                            <p className="mb-2">
                              <strong>Date of Birth:</strong> {format(new Date(selectedRequest.data.resident.birthdate), 'MMMM dd, yyyy')}
                            </p>
                          )}
                        </Col>
                        <Col md={6}>
                          {selectedRequest.data.resident?.household?.purok?.name && (
                            <p className="mb-2">
                              <strong>Purok:</strong> {selectedRequest.data.resident.household.purok.name}
                            </p>
                          )}
                          {selectedRequest.data.resident?.household?.household_number && (
                            <p className="mb-2">
                              <strong>Household Number:</strong> {selectedRequest.data.resident.household.household_number}
                            </p>
                          )}
                          {selectedRequest.data.resident?.civil_status && (
                            <p className="mb-2">
                              <strong>Civil Status:</strong> {selectedRequest.data.resident.civil_status || 'N/A'}
                            </p>
                          )}
                        </Col>
                      </Row>
                    )}
                    {selectedRequest.type === 'certificate' && selectedRequest.data?.certificate_type_label && (
                      <div className="mt-2 p-2 bg-light rounded">
                        <strong>Certificate Type:</strong> {selectedRequest.data.certificate_type_label}
                      </div>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* 3. AUTHORITY SECTION */}
              <Card className={`mb-3 ${hasSignature ? 'border-success' : 'border-warning'}`}>
                <Card.Header className={`${hasSignature ? 'bg-success' : 'bg-warning'} text-white fw-bold`}>
                  <div className="d-flex align-items-center justify-content-between">
                    <span>Approving Authority</span>
                    {hasSignature ? (
                      <CheckCircle style={{ width: '20px', height: '20px' }} />
                    ) : (
                      <AlertCircle style={{ width: '20px', height: '20px' }} />
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Approving Officer:</strong>
                        <br />
                        <span className="text-primary fw-medium">{user?.name || 'Barangay Captain'}</span>
                      </p>
                      <p className="mb-2">
                        <strong>Role:</strong>
                        <br />
                        <Badge bg="primary">Barangay Captain</Badge>
                      </p>
                      <p className="mb-0">
                        <strong>Date & Time:</strong>
                        <br />
                        <span className="text-muted">{format(new Date(), 'MMMM dd, yyyy hh:mm a')}</span>
                      </p>
                    </Col>
                    <Col md={6}>
                      <p className="mb-2">
                        <strong>Signature Status:</strong>
                      </p>
                      {hasSignature ? (
                        <div className="p-2 bg-light rounded border border-success">
                          <div className="d-flex align-items-center gap-2 mb-2">
                            <CheckCircle className="text-success" style={{ width: '18px', height: '18px' }} />
                            <span className="text-success fw-medium">Signature Configured</span>
                          </div>
                          {signatureUrl && (
                            <div className="mb-2 p-2 bg-white rounded border" style={{ maxWidth: '200px' }}>
                              <img 
                                src={signatureUrl} 
                                alt="Captain Signature" 
                                style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }}
                              />
                            </div>
                          )}
                          <small className="text-muted">
                            Your official signature will be embedded in the approved document.
                          </small>
                        </div>
                      ) : (
                        <Alert variant="warning" className="mb-0">
                          <AlertCircle className="w-4 h-4 me-2" />
                          <strong>No signature set.</strong>
                          <br />
                          <small>Upload the Kapitan signature in <strong>Settings → Barangay Information</strong> so it appears on approved documents.</small>
                        </Alert>
                      )}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* 4. DECISION CONTROLS */}
              <Card className="mb-3 border-secondary">
                <Card.Header className="bg-secondary text-white fw-bold">
                  Decision & Remarks
                </Card.Header>
                <Card.Body>
                  {actionType === 'approve' && (
                    <>
                      <Alert variant="warning" className="mb-3">
                        <AlertTriangle className="w-4 h-4 me-2" />
                        <strong>Important:</strong> Approval will generate an official barangay document. This action is permanent and will be recorded in the system audit log.
                      </Alert>
                      {!hasSignature && (
                        <Alert variant="danger" className="mb-3">
                          <AlertCircle className="w-4 h-4 me-2" />
                          <strong>Approval blocked:</strong> Set the Kapitan signature in <strong>Settings → Barangay Information</strong> first.
                        </Alert>
                      )}
                      <Form.Group className="mb-2">
                        <Form.Label>Approval Remarks <small className="text-muted">(Optional)</small></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Additional notes or instructions (optional)..."
                        />
                      </Form.Group>
                    </>
                  )}
                  {actionType === 'reject' && (
                    <>
                      <Alert variant="info" className="mb-3">
                        <strong>Rejection Reason Required:</strong> Please provide a clear reason for rejection. This will be visible to the staff member who submitted the request.
                      </Alert>
                      <Form.Group className="mb-2">
                        <Form.Label>Rejection Reason <span className="text-danger">*</span></Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={4}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Please provide a detailed reason for rejection..."
                          required
                          className={!remarks.trim() ? 'border-warning' : ''}
                        />
                        <Form.Text className="text-muted">
                          This reason will be saved and visible to the requesting staff member.
                        </Form.Text>
                      </Form.Group>
                    </>
                  )}
                </Card.Body>
              </Card>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="bg-light">
          <Button 
            variant="secondary" 
            onClick={() => {
              setShowActionModal(false)
              setSelectedRequest(null)
              setRemarks('')
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button
            variant={actionType === 'approve' ? 'success' : 'danger'}
            onClick={handleAction}
            disabled={
              processing || 
              (actionType === 'reject' && !remarks.trim()) ||
              (actionType === 'approve' && !hasSignature)
            }
            className="px-4"
          >
            {processing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Processing...
              </>
            ) : actionType === 'approve' ? (
              <>
                <CheckCircle className="w-4 h-4 me-2" />
                Approve & Sign
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 me-2" />
                Reject Request
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}
