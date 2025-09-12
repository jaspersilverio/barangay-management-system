import React from 'react';
import { Modal, Button, Row, Col, Badge } from 'react-bootstrap';
import { X, FileText, User, MapPin, Calendar, Clock, Download, Eye } from 'lucide-react';
import { type Blotter } from '../../services/blotter.service';

interface ViewBlotterModalProps {
  show: boolean;
  onHide: () => void;
  blotter: Blotter | null;
}

const ViewBlotterModal: React.FC<ViewBlotterModalProps> = ({
  show,
  onHide,
  blotter
}) => {
  if (!blotter) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Open': return 'warning';
      case 'Ongoing': return 'info';
      case 'Resolved': return 'success';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const downloadAttachment = (attachment: any) => {
    const link = document.createElement('a');
    link.href = `/storage/${attachment.path}`;
    link.download = attachment.filename;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const previewAttachment = (attachment: any) => {
    window.open(`/storage/${attachment.path}`, '_blank');
  };

  const getComplainantInfo = () => {
    if (blotter.complainant_is_resident && blotter.complainant) {
      return {
        name: `${blotter.complainant.first_name} ${blotter.complainant.last_name}`,
        type: 'Resident',
        contact: blotter.complainant.contact_number || 'N/A',
        address: blotter.complainant.address || 'N/A'
      };
    } else {
      return {
        name: blotter.complainant_full_name || 'N/A',
        type: 'Non-Resident',
        contact: blotter.complainant_contact || 'N/A',
        address: blotter.complainant_address || 'N/A',
        age: blotter.complainant_age
      };
    }
  };

  const getRespondentInfo = () => {
    if (blotter.respondent_is_resident && blotter.respondent) {
      return {
        name: `${blotter.respondent.first_name} ${blotter.respondent.last_name}`,
        type: 'Resident',
        contact: blotter.respondent.contact_number || 'N/A',
        address: blotter.respondent.address || 'N/A'
      };
    } else {
      return {
        name: blotter.respondent_full_name || 'N/A',
        type: 'Non-Resident',
        contact: blotter.respondent_contact || 'N/A',
        address: blotter.respondent_address || 'N/A',
        age: blotter.respondent_age
      };
    }
  };

  const complainantInfo = getComplainantInfo();
  const respondentInfo = getRespondentInfo();

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header className="bg-primary text-white">
        <Modal.Title className="d-flex align-items-center">
          <FileText className="me-2" size={20} />
          Blotter Case: {blotter.case_number}
        </Modal.Title>
        <Button variant="link" onClick={onHide} className="text-white p-0">
          <X size={24} />
        </Button>
      </Modal.Header>

      <Modal.Body className="p-4">
        {/* Case Status */}
        <Row className="mb-4">
          <Col md={12}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Case Status</h5>
              <Badge bg={getStatusBadgeVariant(blotter.status)} className="fs-6">
                {blotter.status}
              </Badge>
            </div>
          </Col>
        </Row>

        {/* Complainant Information */}
        <Row className="mb-4">
          <Col md={12}>
            <h5 className="text-primary mb-3">
              <User className="me-2" size={20} />
              Complainant Information
            </h5>
            <div className="border rounded p-3 bg-light">
              <Row>
                <Col md={6}>
                  <strong>Name:</strong> {complainantInfo.name}
                </Col>
                <Col md={3}>
                  <strong>Type:</strong> 
                  <Badge bg={complainantInfo.type === 'Resident' ? 'success' : 'info'} className="ms-2">
                    {complainantInfo.type}
                  </Badge>
                </Col>
                {complainantInfo.age && (
                  <Col md={3}>
                    <strong>Age:</strong> {complainantInfo.age}
                  </Col>
                )}
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <strong>Contact:</strong> {complainantInfo.contact}
                </Col>
                <Col md={6}>
                  <strong>Address:</strong> {complainantInfo.address}
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {/* Respondent Information */}
        <Row className="mb-4">
          <Col md={12}>
            <h5 className="text-primary mb-3">
              <User className="me-2" size={20} />
              Respondent Information
            </h5>
            <div className="border rounded p-3 bg-light">
              <Row>
                <Col md={6}>
                  <strong>Name:</strong> {respondentInfo.name}
                </Col>
                <Col md={3}>
                  <strong>Type:</strong> 
                  <Badge bg={respondentInfo.type === 'Resident' ? 'success' : 'info'} className="ms-2">
                    {respondentInfo.type}
                  </Badge>
                </Col>
                {respondentInfo.age && (
                  <Col md={3}>
                    <strong>Age:</strong> {respondentInfo.age}
                  </Col>
                )}
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <strong>Contact:</strong> {respondentInfo.contact}
                </Col>
                <Col md={6}>
                  <strong>Address:</strong> {respondentInfo.address}
                </Col>
              </Row>
            </div>
          </Col>
        </Row>

        {/* Incident Details */}
        <Row className="mb-4">
          <Col md={12}>
            <h5 className="text-primary mb-3">
              <MapPin className="me-2" size={20} />
              Incident Details
            </h5>
            <div className="border rounded p-3">
              <Row className="mb-3">
                <Col md={4}>
                  <div className="d-flex align-items-center">
                    <Calendar className="me-2 text-muted" size={16} />
                    <div>
                      <strong>Date:</strong><br />
                      {formatDate(blotter.incident_date)}
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center">
                    <Clock className="me-2 text-muted" size={16} />
                    <div>
                      <strong>Time:</strong><br />
                      {formatTime(blotter.incident_time)}
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="d-flex align-items-center">
                    <MapPin className="me-2 text-muted" size={16} />
                    <div>
                      <strong>Location:</strong><br />
                      {blotter.incident_location}
                    </div>
                  </div>
                </Col>
              </Row>
              
              <Row className="mb-3">
                <Col md={12}>
                  <strong>Description:</strong>
                  <div className="mt-2 p-3 bg-light rounded">
                    {blotter.description}
                  </div>
                </Col>
              </Row>

              {blotter.resolution && (
                <Row>
                  <Col md={12}>
                    <strong>Resolution:</strong>
                    <div className="mt-2 p-3 bg-light rounded">
                      {blotter.resolution}
                    </div>
                  </Col>
                </Row>
              )}
            </div>
          </Col>
        </Row>

        {/* Assigned Official */}
        {blotter.official && (
          <Row className="mb-4">
            <Col md={12}>
              <h5 className="text-primary mb-3">
                <User className="me-2" size={20} />
                Assigned Official
              </h5>
              <div className="border rounded p-3 bg-light">
                <Row>
                  <Col md={6}>
                    <strong>Name:</strong> {blotter.official.name}
                  </Col>
                  <Col md={6}>
                    <strong>Email:</strong> {blotter.official.email || 'N/A'}
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        )}

        {/* Attachments */}
        {blotter.attachments && blotter.attachments.length > 0 && (
          <Row className="mb-4">
            <Col md={12}>
              <h5 className="text-primary mb-3">
                <FileText className="me-2" size={20} />
                Attachments
              </h5>
              <div className="border rounded p-3">
                {blotter.attachments.map((attachment, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2 p-2 border-bottom">
                    <div className="d-flex align-items-center">
                      <FileText className="me-2 text-muted" size={16} />
                      <div>
                        <div className="fw-medium">{attachment.filename}</div>
                        <small className="text-muted">
                          {(attachment.size / 1024).toFixed(1)} KB • {attachment.mime_type}
                        </small>
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => previewAttachment(attachment)}
                      >
                        <Eye size={14} className="me-1" />
                        Preview
                      </Button>
                      <Button
                        variant="outline-success"
                        size="sm"
                        onClick={() => downloadAttachment(attachment)}
                      >
                        <Download size={14} className="me-1" />
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        )}

        {/* Case Information */}
        <Row className="mb-4">
          <Col md={12}>
            <h5 className="text-primary mb-3">
              <FileText className="me-2" size={20} />
              Case Information
            </h5>
            <div className="border rounded p-3 bg-light">
              <Row>
                <Col md={6}>
                  <strong>Case Number:</strong> {blotter.case_number}
                </Col>
                <Col md={6}>
                  <strong>Status:</strong> 
                  <Badge bg={getStatusBadgeVariant(blotter.status)} className="ms-2">
                    {blotter.status}
                  </Badge>
                </Col>
              </Row>
              <Row className="mt-2">
                <Col md={6}>
                  <strong>Created:</strong> {formatDate(blotter.created_at)}
                </Col>
                <Col md={6}>
                  <strong>Last Updated:</strong> {formatDate(blotter.updated_at)}
                </Col>
              </Row>
              {blotter.creator && (
                <Row className="mt-2">
                  <Col md={6}>
                    <strong>Created By:</strong> {blotter.creator.name}
                  </Col>
                  {blotter.updater && (
                    <Col md={6}>
                      <strong>Last Updated By:</strong> {blotter.updater.name}
                    </Col>
                  )}
                </Row>
              )}
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="bg-light">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewBlotterModal;