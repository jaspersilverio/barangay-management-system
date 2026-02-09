import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { X, FileText, MapPin, Calendar, Clock, User, AlertCircle } from 'lucide-react';
import { type CreateIncidentReportData, createIncidentReport } from '../../services/incident-reports.service';

interface AddIncidentReportModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

const AddIncidentReportModal: React.FC<AddIncidentReportModalProps> = ({
  show,
  onHide,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateIncidentReportData>({
    incident_title: '',
    description: '',
    incident_date: '',
    incident_time: '',
    location: '',
    persons_involved: '',
    status: 'Recorded',
    notes: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (show) {
      resetForm();
    }
  }, [show]);

  const resetForm = () => {
    setFormData({
      incident_title: '',
      description: '',
      incident_date: '',
      incident_time: '',
      location: '',
      persons_involved: '',
      status: 'Recorded',
      notes: ''
    });
    setErrors({});
  };

  const handleInputChange = (field: keyof CreateIncidentReportData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.incident_title.trim()) {
      newErrors.incident_title = 'Incident title is required.';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required.';
    }
    if (!formData.incident_date) {
      newErrors.incident_date = 'Incident date is required.';
    } else {
      const selectedDate = new Date(formData.incident_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (selectedDate > today) {
        newErrors.incident_date = 'Incident date cannot be in the future.';
      }
    }
    if (!formData.incident_time) {
      newErrors.incident_time = 'Incident time is required.';
    }
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await createIncidentReport(formData);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating incident report:', error);
      if (error.response?.data?.errors) {
        const validationErrors: Record<string, string> = {};
        Object.keys(error.response.data.errors).forEach(key => {
          validationErrors[key] = error.response.data.errors[key][0];
        });
        setErrors(validationErrors);
      } else {
        setErrors({ submit: error.response?.data?.message || 'Failed to create incident report.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <FileText size={20} className="text-primary" />
          <span>Add Incident Report</span>
        </Modal.Title>
        <Button variant="link" className="p-0" onClick={onHide}>
          <X size={20} />
        </Button>
      </Modal.Header>
      <Modal.Body>
        {errors.submit && (
          <Alert variant="danger" className="mb-3">
            <AlertCircle size={16} className="me-2" />
            {errors.submit}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  <FileText size={16} className="me-2" />
                  Incident Title <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.incident_title}
                  onChange={(e) => handleInputChange('incident_title', e.target.value)}
                  isInvalid={!!errors.incident_title}
                  placeholder="e.g., Minor disturbance, Property damage, etc."
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.incident_title}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  Description <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  isInvalid={!!errors.description}
                  placeholder="Provide a detailed description of the incident..."
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.description}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  <Calendar size={16} className="me-2" />
                  Incident Date <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.incident_date}
                  onChange={(e) => handleInputChange('incident_date', e.target.value)}
                  isInvalid={!!errors.incident_date}
                  max={new Date().toISOString().split('T')[0]}
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.incident_date}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  <Clock size={16} className="me-2" />
                  Incident Time <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="time"
                  value={formData.incident_time}
                  onChange={(e) => handleInputChange('incident_time', e.target.value)}
                  isInvalid={!!errors.incident_time}
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.incident_time}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  <MapPin size={16} className="me-2" />
                  Location <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  isInvalid={!!errors.location}
                  placeholder="e.g., Purok 1, Barangay Hall, etc."
                  className="form-control-custom"
                />
                <Form.Control.Feedback type="invalid">
                  {errors.location}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  <User size={16} className="me-2" />
                  Persons Involved (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.persons_involved || ''}
                  onChange={(e) => handleInputChange('persons_involved', e.target.value)}
                  placeholder="List names of persons involved (resident or non-resident)..."
                  className="form-control-custom"
                />
                <Form.Text className="text-muted">
                  Enter names separated by commas or one per line.
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  Status
                </Form.Label>
                <Form.Select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="form-control-custom"
                >
                  <option value="Recorded">Recorded</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Resolved">Resolved</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label className="form-label-custom">
                  Notes (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or observations..."
                  className="form-control-custom"
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button variant="secondary" onClick={onHide} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading} className="btn-brand-primary">
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                'Create Incident Report'
              )}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddIncidentReportModal;

