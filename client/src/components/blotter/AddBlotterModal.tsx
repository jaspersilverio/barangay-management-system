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
  
  // Separate input values for each search field
  const [complainantInput, setComplainantInput] = useState('');
  const [respondentInput, setRespondentInput] = useState('');
  const [officialInput, setOfficialInput] = useState('');
  
  // Debounced search terms
  const [debouncedComplainant, setDebouncedComplainant] = useState('');
  const [debouncedRespondent, setDebouncedRespondent] = useState('');
  const [debouncedOfficial, setDebouncedOfficial] = useState('');

  // Separate filtered results for each field
  const [filteredComplainants, setFilteredComplainants] = useState<Resident[]>([]);
  const [filteredRespondents, setFilteredRespondents] = useState<Resident[]>([]);
  const [filteredOfficials, setFilteredOfficials] = useState<Official[]>([]);

  useEffect(() => {
    if (show) {
      loadResidents();
      loadOfficials();
      resetForm();
      
      // Check for pre-filled data from incident report conversion
      const blotterFromIncident = sessionStorage.getItem('blotterFromIncident');
      if (blotterFromIncident) {
        try {
          const data = JSON.parse(blotterFromIncident);
          setFormData(prev => ({
            ...prev,
            incident_date: data.incident_date || '',
            incident_time: data.incident_time || '',
            incident_location: data.incident_location || '',
            description: data.description || ''
          }));
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('blotterFromIncident');
        } catch (error) {
          console.error('Error parsing blotter data from incident:', error);
          sessionStorage.removeItem('blotterFromIncident');
        }
      }
    }
  }, [show]);

  // Debounce complainant search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedComplainant(complainantInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [complainantInput]);

  // Debounce respondent search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedRespondent(respondentInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [respondentInput]);

  // Debounce official search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedOfficial(officialInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [officialInput]);

  // Filter complainants based on debounced term
  useEffect(() => {
    filterComplainants();
  }, [debouncedComplainant, residents]);

  // Filter respondents based on debounced term
  useEffect(() => {
    filterRespondents();
  }, [debouncedRespondent, residents]);

  // Filter officials based on debounced term
  useEffect(() => {
    filterOfficials();
  }, [debouncedOfficial, officials]);

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

  const filterComplainants = () => {
    if (!debouncedComplainant || debouncedComplainant.length < 1) {
      setFilteredComplainants([]);
      return;
    }

    if (!Array.isArray(residents)) {
      setFilteredComplainants([]);
      return;
    }

    const filtered = residents.filter(resident => {
      const fullName = `${resident.first_name} ${resident.last_name}`.toLowerCase();
      return fullName.includes(debouncedComplainant.toLowerCase());
    });
    setFilteredComplainants(filtered);
  };

  const filterRespondents = () => {
    if (!debouncedRespondent || debouncedRespondent.length < 1) {
      setFilteredRespondents([]);
      return;
    }

    if (!Array.isArray(residents)) {
      setFilteredRespondents([]);
      return;
    }

    const filtered = residents.filter(resident => {
      const fullName = `${resident.first_name} ${resident.last_name}`.toLowerCase();
      return fullName.includes(debouncedRespondent.toLowerCase());
    });
    setFilteredRespondents(filtered);
  };

  const filterOfficials = () => {
    if (!debouncedOfficial || debouncedOfficial.length < 1) {
      setFilteredOfficials([]);
      return;
    }

    if (!Array.isArray(officials)) {
      setFilteredOfficials([]);
      return;
    }

    const filtered = officials.filter(official =>
      official.name.toLowerCase().includes(debouncedOfficial.toLowerCase())
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
    setComplainantInput('');
    setRespondentInput('');
    setOfficialInput('');
    setDebouncedComplainant('');
    setDebouncedRespondent('');
    setDebouncedOfficial('');
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

  const handleComplainantSearchChange = (value: string) => {
    setComplainantInput(value);
  };

  const handleRespondentSearchChange = (value: string) => {
    setRespondentInput(value);
  };

  const handleOfficialSearchChange = (value: string) => {
    setOfficialInput(value);
  };

  const selectResident = (type: 'complainant' | 'respondent', resident: Resident) => {
    setFormData(prev => ({
      ...prev,
      [`${type}_id`]: resident.id
    }));
    
    const fullName = `${resident.first_name} ${resident.last_name}`;
    if (type === 'complainant') {
      setComplainantInput(fullName);
      setDebouncedComplainant(fullName);
    } else {
      setRespondentInput(fullName);
      setDebouncedRespondent(fullName);
    }
  };

  const selectOfficial = (official: Official) => {
    setFormData(prev => ({
      ...prev,
      official_id: official.id
    }));
    setOfficialInput(official.name);
    setDebouncedOfficial(official.name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    // Basic validation
    if (!formData.incident_date) {
      setErrors({ incident_date: 'Incident date is required.' });
      setLoading(false);
      return;
    }

    if (!formData.incident_time) {
      setErrors({ incident_time: 'Incident time is required.' });
      setLoading(false);
      return;
    }

    // HTML5 date input already provides YYYY-MM-DD format
    // HTML5 time input already provides HH:MM format (24-hour)
    const incidentDate = String(formData.incident_date).trim();
    const incidentTime = String(formData.incident_time).trim();

    // Validate date format (should be YYYY-MM-DD from HTML5 input)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(incidentDate)) {
      setErrors({ incident_date: 'Please enter a valid date.' });
      setLoading(false);
      return;
    }

    // Validate time format (should be HH:MM from HTML5 input)
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(incidentTime)) {
      setErrors({ incident_time: 'Please enter a valid time.' });
      setLoading(false);
      return;
    }

    // Validate date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(incidentDate);
    if (selectedDate > today) {
      setErrors({ incident_date: 'Incident date cannot be in the future.' });
      setLoading(false);
      return;
    }

    try {
      const formDataToSend = new FormData();
      
      // Required boolean fields - always send
      formDataToSend.append('complainant_is_resident', formData.complainant_is_resident ? '1' : '0');
      formDataToSend.append('respondent_is_resident', formData.respondent_is_resident ? '1' : '0');
      
      // Complainant fields
      if (formData.complainant_is_resident) {
        if (formData.complainant_id) {
          formDataToSend.append('complainant_id', formData.complainant_id.toString());
        }
      } else {
        if (formData.complainant_full_name) {
          formDataToSend.append('complainant_full_name', formData.complainant_full_name);
        }
        if (formData.complainant_age) {
          formDataToSend.append('complainant_age', formData.complainant_age.toString());
        }
        if (formData.complainant_address) {
          formDataToSend.append('complainant_address', formData.complainant_address);
        }
        if (formData.complainant_contact) {
          formDataToSend.append('complainant_contact', formData.complainant_contact);
        }
      }

      // Respondent fields
      if (formData.respondent_is_resident) {
        if (formData.respondent_id) {
          formDataToSend.append('respondent_id', formData.respondent_id.toString());
        }
      } else {
        if (formData.respondent_full_name) {
          formDataToSend.append('respondent_full_name', formData.respondent_full_name);
        }
        if (formData.respondent_age) {
          formDataToSend.append('respondent_age', formData.respondent_age.toString());
        }
        if (formData.respondent_address) {
          formDataToSend.append('respondent_address', formData.respondent_address);
        }
        if (formData.respondent_contact) {
          formDataToSend.append('respondent_contact', formData.respondent_contact);
        }
      }

      // Other fields
      if (formData.official_id) {
        formDataToSend.append('official_id', formData.official_id.toString());
      }
      
      // Date and time - always send (required)
      formDataToSend.append('incident_date', incidentDate);
      formDataToSend.append('incident_time', incidentTime);
      
      if (formData.incident_location) {
        formDataToSend.append('incident_location', formData.incident_location);
      }
      if (formData.description) {
        formDataToSend.append('description', formData.description);
      }
      if (formData.status) {
        formDataToSend.append('status', formData.status);
      }
      if (formData.resolution) {
        formDataToSend.append('resolution', formData.resolution);
      }

      // Attachments
      if (formData.attachments && Array.isArray(formData.attachments)) {
        formData.attachments.forEach((file, index) => {
          formDataToSend.append(`attachments[${index}]`, file);
        });
      }

      await blotterService.createBlotter(formDataToSend as any);
      onSuccess();
      onHide();
    } catch (error: any) {
      if (error.response?.data?.errors) {
        // Flatten Laravel validation errors
        const flattenedErrors: Record<string, string> = {};
        Object.entries(error.response.data.errors).forEach(([key, messages]) => {
          flattenedErrors[key] = Array.isArray(messages) ? messages[0] : String(messages);
        });
        setErrors(flattenedErrors);
      } else {
        setErrors({ general: 'Failed to create blotter case. Please try again.' });
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
                      value={complainantInput}
                      onChange={(e) => handleComplainantSearchChange(e.target.value)}
                    />
                    {debouncedComplainant && filteredComplainants.length > 0 && (
                      <div className="border rounded mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredComplainants.map(resident => (
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
                      value={respondentInput}
                      onChange={(e) => handleRespondentSearchChange(e.target.value)}
                    />
                    {debouncedRespondent && filteredRespondents.length > 0 && (
                      <div className="border rounded mt-1" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                        {filteredRespondents.map(resident => (
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
                    value={officialInput}
                    onChange={(e) => handleOfficialSearchChange(e.target.value)}
                  />
                  {debouncedOfficial && filteredOfficials.length > 0 && (
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