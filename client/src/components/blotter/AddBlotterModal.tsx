import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Alert } from 'react-bootstrap';
import { X, FileText, User, MapPin } from 'lucide-react';
import { type CreateBlotterData } from '../../services/blotter.service';
import blotterService from '../../services/blotter.service';
import { residentsService } from '../../services/residents.service';
import { officialsService } from '../../services/officials.service';

interface AddBlotterModalProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

interface Resident {
  id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
}

interface Official {
  id: number;
  name: string;
  position: string;
}

const AddBlotterModal: React.FC<AddBlotterModalProps> = ({
  show,
  onHide,
  onSuccess
}) => {
  const [formData, setFormData] = useState<CreateBlotterData>({
    complainant_is_resident: true,
    complainant_id: undefined,
    complainant_full_name: '',
    complainant_age: undefined,
    complainant_address: '',
    complainant_contact: '',
    respondent_is_resident: true,
    respondent_id: undefined,
    respondent_full_name: '',
    respondent_age: undefined,
    respondent_address: '',
    respondent_contact: '',
    official_id: undefined,
    incident_date: '',
    incident_time: '',
    incident_location: '',
    description: '',
    status: 'Open',
    resolution: '',
    attachments: []
  });

  const [residents, setResidents] = useState<Resident[]>([]);
  const [officials, setOfficials] = useState<Official[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [searchTerms, setSearchTerms] = useState({
    complainant: '',
    respondent: '',
    official: ''
  });

  const [filteredResidents, setFilteredResidents] = useState<Resident[]>([]);
  const [filteredOfficials, setFilteredOfficials] = useState<Official[]>([]);

  useEffect(() => {
    if (show) {
      loadResidents();
      loadOfficials();
      resetForm();
    }
  }, [show]);

  useEffect(() => {
    filterResidents();
  }, [searchTerms.complainant, residents]);

  useEffect(() => {
    filterResidents();
  }, [searchTerms.respondent, residents]);

  useEffect(() => {
    filterOfficials();
  }, [searchTerms.official, officials]);

  const loadResidents = async () => {
    try {
      const response = await residentsService.getResidents({});
      setResidents(response.data.data || []);
    } catch (error) {
      console.error('Error loading residents:', error);
      setResidents([]);
    }
  };

  const loadOfficials = async () => {
    try {
      const response = await officialsService.getOfficials();
      setOfficials(response.data || []);
    } catch (error) {
      console.error('Error loading officials:', error);
      setOfficials([]);
    }
  };

  const filterResidents = () => {
    const term = searchTerms.complainant || searchTerms.respondent;
    if (!term) {
      setFilteredResidents(Array.isArray(residents) ? residents : []);
      return;
    }

    if (!Array.isArray(residents)) {
      setFilteredResidents([]);
      return;
    }

    const filtered = residents.filter(resident => {
      const fullName = `${resident.first_name} ${resident.last_name}`.toLowerCase();
      return fullName.includes(term.toLowerCase());
    });
    setFilteredResidents(filtered);
  };

  const filterOfficials = () => {
    if (!searchTerms.official) {
      setFilteredOfficials(Array.isArray(officials) ? officials : []);
      return;
    }

    if (!Array.isArray(officials)) {
      setFilteredOfficials([]);
      return;
    }

    const filtered = officials.filter(official =>
      official.name.toLowerCase().includes(searchTerms.official.toLowerCase())
    );
    setFilteredOfficials(filtered);
  };

  const resetForm = () => {
    setFormData({
      complainant_is_resident: true,
      complainant_id: undefined,
      complainant_full_name: '',
      complainant_age: undefined,
      complainant_address: '',
      complainant_contact: '',
      respondent_is_resident: true,
      respondent_id: undefined,
      respondent_full_name: '',
      respondent_age: undefined,
      respondent_address: '',
      respondent_contact: '',
      official_id: undefined,
      incident_date: '',
      incident_time: '',
      incident_location: '',
      description: '',
      status: 'Open',
      resolution: '',
      attachments: []
    });
    setSearchTerms({ complainant: '', respondent: '', official: '' });
    setErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      setFormData(prev => ({
        ...prev,
        attachments: files ? Array.from(files) : []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSearchChange = (type: 'complainant' | 'respondent' | 'official', value: string) => {
    setSearchTerms(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const selectResident = (type: 'complainant' | 'respondent', resident: Resident) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_id`]: resident.id
    }));
    setSearchTerms(prev => ({
      ...prev,
      [type]: `${resident.first_name} ${resident.last_name}`
    }));
  };

  const selectOfficial = (official: Official) => {
    setFormData(prev => ({
      ...prev,
      official_id: official.id
    }));
    setSearchTerms(prev => ({
      ...prev,
      official: official.name
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'attachments' && Array.isArray(value)) {
          value.forEach((file, index) => {
            formDataToSend.append(`attachments[${index}]`, file);
          });
        } else if (value !== undefined && value !== null && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      await blotterService.createBlotter(formDataToSend as any);
      onSuccess();
      onHide();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'Failed to create blotter case' });
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header className="modal-header-custom">
        <Modal.Title className="modal-title-custom text-brand-primary d-flex align-items-center">
          <FileText className="me-2" size={20} />
          Add New Blotter Case
        </Modal.Title>
        <Button variant="link" onClick={onHide} className="text-brand-primary p-0">
          <X size={24} />
        </Button>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body className="modal-body-custom">
          {errors.general && (
            <Alert variant="danger" className="mb-4">
              {errors.general}
            </Alert>
          )}

          {/* Complainant Section */}
          <div className="mb-4">
            <h5 className="text-primary mb-3">
              <User className="me-2" size={20} />
              Complainant Information
            </h5>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="complainant_resident"
                      name="complainant_is_resident"
                      label="Resident"
                      checked={formData.complainant_is_resident}
                      onChange={() => setFormData(prev => ({ ...prev, complainant_is_resident: true }))}
                    />
                    <Form.Check
                      type="radio"
                      id="complainant_nonresident"
                      name="complainant_is_resident"
                      label="Non-Resident"
                      checked={!formData.complainant_is_resident}
                      onChange={() => setFormData(prev => ({ ...prev, complainant_is_resident: false }))}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {formData.complainant_is_resident ? (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Select Resident</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search residents..."
                      value={searchTerms.complainant}
                      onChange={(e) => handleSearchChange('complainant', e.target.value)}
                    />
                    {searchTerms.complainant && filteredResidents.length > 0 && (
                      <div className="border rounded mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredResidents.map(resident => (
                          <div
                            key={resident.id}
                            className="p-2 border-bottom cursor-pointer"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            onClick={() => selectResident('complainant', resident)}
                          >
                            {resident.first_name} {resident.last_name}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.complainant_id && (
                      <Form.Text className="text-danger">{errors.complainant_id}</Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="complainant_full_name"
                      value={formData.complainant_full_name}
                      onChange={handleInputChange}
                      isInvalid={!!errors.complainant_full_name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.complainant_full_name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Age *</Form.Label>
                    <Form.Control
                      type="number"
                      name="complainant_age"
                      value={formData.complainant_age || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="120"
                      isInvalid={!!errors.complainant_age}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.complainant_age}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Contact</Form.Label>
                    <Form.Control
                      type="text"
                      name="complainant_contact"
                      value={formData.complainant_contact}
                      onChange={handleInputChange}
                      isInvalid={!!errors.complainant_contact}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.complainant_contact}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Address *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="complainant_address"
                      value={formData.complainant_address}
                      onChange={handleInputChange}
                      isInvalid={!!errors.complainant_address}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.complainant_address}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </div>

          {/* Respondent Section */}
          <div className="mb-4">
            <h5 className="text-primary mb-3">
              <User className="me-2" size={20} />
              Respondent Information
            </h5>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Type</Form.Label>
                  <div className="d-flex gap-3">
                    <Form.Check
                      type="radio"
                      id="respondent_resident"
                      name="respondent_is_resident"
                      label="Resident"
                      checked={formData.respondent_is_resident}
                      onChange={() => setFormData(prev => ({ ...prev, respondent_is_resident: true }))}
                    />
                    <Form.Check
                      type="radio"
                      id="respondent_nonresident"
                      name="respondent_is_resident"
                      label="Non-Resident"
                      checked={!formData.respondent_is_resident}
                      onChange={() => setFormData(prev => ({ ...prev, respondent_is_resident: false }))}
                    />
                  </div>
                </Form.Group>
              </Col>
            </Row>

            {formData.respondent_is_resident ? (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Select Resident</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Search residents..."
                      value={searchTerms.respondent}
                      onChange={(e) => handleSearchChange('respondent', e.target.value)}
                    />
                    {searchTerms.respondent && filteredResidents.length > 0 && (
                      <div className="border rounded mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredResidents.map(resident => (
                          <div
                            key={resident.id}
                            className="p-2 border-bottom cursor-pointer"
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                            onClick={() => selectResident('respondent', resident)}
                          >
                            {resident.first_name} {resident.last_name}
                          </div>
                        ))}
                      </div>
                    )}
                    {errors.respondent_id && (
                      <Form.Text className="text-danger">{errors.respondent_id}</Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
            ) : (
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Full Name *</Form.Label>
                    <Form.Control
                      type="text"
                      name="respondent_full_name"
                      value={formData.respondent_full_name}
                      onChange={handleInputChange}
                      isInvalid={!!errors.respondent_full_name}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.respondent_full_name}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Age *</Form.Label>
                    <Form.Control
                      type="number"
                      name="respondent_age"
                      value={formData.respondent_age || ''}
                      onChange={handleInputChange}
                      min="1"
                      max="120"
                      isInvalid={!!errors.respondent_age}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.respondent_age}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Contact</Form.Label>
                    <Form.Control
                      type="text"
                      name="respondent_contact"
                      value={formData.respondent_contact}
                      onChange={handleInputChange}
                      isInvalid={!!errors.respondent_contact}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.respondent_contact}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
                <Col md={12}>
                  <Form.Group>
                    <Form.Label>Address *</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="respondent_address"
                      value={formData.respondent_address}
                      onChange={handleInputChange}
                      isInvalid={!!errors.respondent_address}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.respondent_address}
                    </Form.Control.Feedback>
                  </Form.Group>
                </Col>
              </Row>
            )}
          </div>

          {/* Incident Details */}
          <div className="mb-4">
            <h5 className="text-primary mb-3">
              <MapPin className="me-2" size={20} />
              Incident Details
            </h5>
            
            <Row className="mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Assigned Official</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search officials..."
                    value={searchTerms.official}
                    onChange={(e) => handleSearchChange('official', e.target.value)}
                  />
                  {searchTerms.official && filteredOfficials.length > 0 && (
                    <div className="border rounded mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                      {filteredOfficials.map(official => (
                        <div
                          key={official.id}
                          className="p-2 border-bottom cursor-pointer"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          onClick={() => selectOfficial(official)}
                        >
                          {official.name} - {official.position}
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                  >
                    <option value="Open">Open</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Resolved">Resolved</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Incident Date *</Form.Label>
                  <Form.Control
                    type="date"
                    name="incident_date"
                    value={formData.incident_date}
                    onChange={handleInputChange}
                    max={new Date().toISOString().split('T')[0]}
                    isInvalid={!!errors.incident_date}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.incident_date}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Incident Time *</Form.Label>
                  <Form.Control
                    type="time"
                    name="incident_time"
                    value={formData.incident_time}
                    onChange={handleInputChange}
                    isInvalid={!!errors.incident_time}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.incident_time}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>Location *</Form.Label>
                  <Form.Control
                    type="text"
                    name="incident_location"
                    value={formData.incident_location}
                    onChange={handleInputChange}
                    placeholder="Enter incident location"
                    isInvalid={!!errors.incident_location}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.incident_location}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Description *</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe the incident in detail..."
                    isInvalid={!!errors.description}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.description}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Resolution</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="resolution"
                    value={formData.resolution}
                    onChange={handleInputChange}
                    placeholder="Resolution details (if any)..."
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row className="mb-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Attachments</Form.Label>
                  <Form.Control
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleInputChange}
                  />
                  <Form.Text className="text-muted">
                    Upload supporting documents (images, PDFs, documents). Max 10MB per file.
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>
        </Modal.Body>

        <Modal.Footer className="modal-footer-custom">
          <Button variant="secondary" onClick={onHide} disabled={loading} className="btn-brand-secondary">
            <i className="fas fa-times me-1"></i>
            Cancel
          </Button>
          <Button variant="primary" type="submit" disabled={loading} className="btn-brand-primary">
            <i className="fas fa-save me-1"></i>
            {loading ? 'Creating...' : 'Create Blotter Case'}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default AddBlotterModal;