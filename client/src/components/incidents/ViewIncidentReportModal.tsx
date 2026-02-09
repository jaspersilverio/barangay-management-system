import React, { useState } from 'react';
import { Modal, Button, Row, Col, Badge, Alert } from 'react-bootstrap';
import { X, FileText, MapPin, Calendar, Clock, User, AlertCircle, ArrowRight } from 'lucide-react';
import { type IncidentReport } from '../../services/incident-reports.service';
import { useNavigate } from 'react-router-dom';

interface ViewIncidentReportModalProps {
  show: boolean;
  onHide: () => void;
  incidentReport: IncidentReport | null;
  onConvertToBlotter?: () => void;
}

const ViewIncidentReportModal: React.FC<ViewIncidentReportModalProps> = ({
  show,
  onHide,
  incidentReport,
  onConvertToBlotter
}) => {
  const navigate = useNavigate();
  const [converting, setConverting] = useState(false);

  if (!incidentReport) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Recorded': return 'secondary';
      case 'Monitoring': return 'warning';
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
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    return `${formatDate(dateString)} at ${formatTime(timeString)}`;
  };

  const handleConvertToBlotter = () => {
    // Navigate to Blotter page with pre-filled data from incident report
    const blotterData = {
      incident_date: incidentReport.incident_date,
      incident_time: incidentReport.incident_time,
      incident_location: incidentReport.location,
      description: incidentReport.description,
      // Store incident report ID for reference
      incident_report_id: incidentReport.id
    };

    // Store in sessionStorage to pre-fill the form
    sessionStorage.setItem('blotterFromIncident', JSON.stringify(blotterData));
    
    // Navigate to blotter page
    navigate('/blotter');
    
    // Close modal and notify parent
    onHide();
    if (onConvertToBlotter) {
      onConvertToBlotter();
    }
  };

  // Parse persons_involved (could be array or string)
  const getPersonsInvolved = () => {
    if (!incidentReport.persons_involved) return null;
    
    if (Array.isArray(incidentReport.persons_involved)) {
      return incidentReport.persons_involved;
    } else if (typeof incidentReport.persons_involved === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(incidentReport.persons_involved);
        return Array.isArray(parsed) ? parsed : [incidentReport.persons_involved];
      } catch {
        // If not JSON, treat as comma-separated or newline-separated
        return incidentReport.persons_involved
          .split(/[,\n]/)
          .map(p => p.trim())
          .filter(p => p.length > 0);
      }
    }
    return null;
  };

  const personsInvolved = getPersonsInvolved();

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FileText size={20} className="text-primary" />
          <span>Incident Report Details</span>
        </Modal.Title>
        <Button variant="link" className="p-0" onClick={onHide}>
          <X size={20} />
        </Button>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={12}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Badge bg={getStatusBadgeVariant(incidentReport.status)} className="fs-6 px-3 py-2">
                {incidentReport.status}
              </Badge>
              <div className="text-muted small">
                Created: {new Date(incidentReport.created_at).toLocaleString('en-US')}
                {incidentReport.updated_at !== incidentReport.created_at && (
                  <span className="ms-2">
                    | Updated: {new Date(incidentReport.updated_at).toLocaleString('en-US')}
                  </span>
                )}
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <h4 className="mb-2">{incidentReport.incident_title}</h4>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <div className="d-flex align-items-start gap-2 mb-3">
              <Calendar size={18} className="text-muted mt-1" />
              <div>
                <div className="text-muted small">Date & Time</div>
                <div className="fw-medium">{formatDateTime(incidentReport.incident_date, incidentReport.incident_time)}</div>
              </div>
            </div>
          </Col>
          <Col md={6}>
            <div className="d-flex align-items-start gap-2 mb-3">
              <MapPin size={18} className="text-muted mt-1" />
              <div>
                <div className="text-muted small">Location</div>
                <div className="fw-medium">{incidentReport.location}</div>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={6}>
            <div className="d-flex align-items-start gap-2 mb-3">
              <User size={18} className="text-muted mt-1" />
              <div>
                <div className="text-muted small">Created By</div>
                <div className="fw-medium">{incidentReport.creator?.name || 'N/A'}</div>
              </div>
            </div>
          </Col>
        </Row>

        <Row className="mb-3">
          <Col md={12}>
            <div className="mb-2">
              <div className="text-muted small mb-1">Description</div>
              <div className="p-3 bg-light rounded border">
                {incidentReport.description}
              </div>
            </div>
          </Col>
        </Row>

        {personsInvolved && personsInvolved.length > 0 && (
          <Row className="mb-3">
            <Col md={12}>
              <div className="mb-2">
                <div className="text-muted small mb-1">Persons Involved</div>
                <div className="p-3 bg-light rounded border">
                  <ul className="mb-0">
                    {personsInvolved.map((person, index) => (
                      <li key={index}>{person}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Col>
          </Row>
        )}

        {incidentReport.notes && (
          <Row className="mb-3">
            <Col md={12}>
              <div className="mb-2">
                <div className="text-muted small mb-1">Notes</div>
                <div className="p-3 bg-light rounded border">
                  {incidentReport.notes}
                </div>
              </div>
            </Col>
          </Row>
        )}

        <Alert variant="info" className="mt-4">
          <div className="d-flex align-items-center justify-content-between">
            <div>
              <AlertCircle size={16} className="me-2" />
              <strong>Convert to Blotter</strong>
              <p className="mb-0 small mt-1">
                This incident report can be converted to a formal blotter case if it requires further investigation or legal action.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleConvertToBlotter}
              disabled={converting}
              className="btn-brand-primary"
            >
              <ArrowRight size={16} className="me-2" />
              Convert to Blotter
            </Button>
          </div>
        </Alert>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ViewIncidentReportModal;

