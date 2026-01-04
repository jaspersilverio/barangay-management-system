import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Tab } from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Settings as SettingsIcon, Building, Cog, Phone, Users } from 'lucide-react'
import { getSettings, updateBarangayInfo, updatePreferences, updateEmergency, type Settings, type BarangayInfo, type SystemPreferences, type EmergencySettings, type EmergencyContact, type EvacuationCenter } from '../services/settings.service'

export default function Settings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeSection = searchParams.get('section') || 'overview'
  
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // Form states
  const [barangayInfo, setBarangayInfo] = useState<BarangayInfo>({
    name: '',
    address: '',
    contact: '',
    logo_path: ''
  })
  const [preferences, setPreferences] = useState<SystemPreferences>({
    per_page: 10,
    date_format: 'YYYY-MM-DD',
    theme: 'light'
  })
  const [emergency, setEmergency] = useState<EmergencySettings>({
    contact_numbers: [],
    evacuation_centers: []
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await getSettings()
      
      if (response.success) {
        setSettings(response.data)
        setBarangayInfo(response.data.barangay_info || { name: '', address: '', contact: '', logo_path: '' })
        setPreferences(response.data.system_preferences || { per_page: 10, date_format: 'YYYY-MM-DD', theme: 'light' })
        setEmergency(response.data.emergency || { contact_numbers: [], evacuation_centers: [] })
      } else {
        setError(response.message || 'Failed to load settings')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const handleBarangayInfoSave = async () => {
    try {
      setSaving('barangay')
      setError(null)
      setSuccess(null)
      
      const response = await updateBarangayInfo(barangayInfo)
      
      if (response.success) {
        setSuccess('Barangay information updated successfully')
        setSettings(prev => prev ? { ...prev, barangay_info: response.data } : null)
      } else {
        setError(response.message || 'Failed to update barangay information')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update barangay information')
    } finally {
      setSaving(null)
    }
  }

  const handlePreferencesSave = async () => {
    try {
      setSaving('preferences')
      setError(null)
      setSuccess(null)
      
      const response = await updatePreferences(preferences)
      
      if (response.success) {
        setSuccess('System preferences updated successfully')
        setSettings(prev => prev ? { ...prev, system_preferences: response.data } : null)
      } else {
        setError(response.message || 'Failed to update system preferences')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update system preferences')
    } finally {
      setSaving(null)
    }
  }

  const handleEmergencySave = async () => {
    try {
      setSaving('emergency')
      setError(null)
      setSuccess(null)
      
      const response = await updateEmergency(emergency)
      
      if (response.success) {
        setSuccess('Emergency settings updated successfully')
        setSettings(prev => prev ? { ...prev, emergency: response.data } : null)
      } else {
        setError(response.message || 'Failed to update emergency settings')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update emergency settings')
    } finally {
      setSaving(null)
    }
  }

  const addEmergencyContact = () => {
    setEmergency(prev => ({
      ...prev,
      contact_numbers: [...(prev.contact_numbers || []), { name: '', number: '' }]
    }))
  }

  const removeEmergencyContact = (index: number) => {
    setEmergency(prev => ({
      ...prev,
      contact_numbers: (prev.contact_numbers || []).filter((_, i) => i !== index)
    }))
  }

  const updateEmergencyContact = (index: number, field: keyof EmergencyContact, value: string) => {
    setEmergency(prev => ({
      ...prev,
      contact_numbers: (prev.contact_numbers || []).map((contact, i) => 
        i === index ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const addEvacuationCenter = () => {
    setEmergency(prev => ({
      ...prev,
      evacuation_centers: [...(prev.evacuation_centers || []), { name: '', address: '', capacity: 0 }]
    }))
  }

  const removeEvacuationCenter = (index: number) => {
    setEmergency(prev => ({
      ...prev,
      evacuation_centers: (prev.evacuation_centers || []).filter((_, i) => i !== index)
    }))
  }

  const updateEvacuationCenter = (index: number, field: keyof EvacuationCenter, value: string | number) => {
    setEmergency(prev => ({
      ...prev,
      evacuation_centers: (prev.evacuation_centers || []).map((center, i) => 
        i === index ? { ...center, [field]: value } : center
      )
    }))
  }


  if (loading) {
    return (
      <Container fluid className="p-4">
        <Row className="mb-4">
          <Col>
            <div className="d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 p-3 rounded">
                <SettingsIcon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="skeleton-line" style={{ width: '200px', height: '28px', marginBottom: '8px' }}></div>
                <div className="skeleton-line" style={{ width: '300px', height: '16px' }}></div>
              </div>
            </div>
          </Col>
        </Row>
        <Row className="g-4">
          {[...Array(4)].map((_, index) => (
            <Col md={6} lg={3} key={index}>
              <Card className="h-100">
                <Card.Body className="text-center p-4">
                  <div className="skeleton-badge" style={{ width: '64px', height: '64px', margin: '0 auto 12px', borderRadius: '50%' }}></div>
                  <div className="skeleton-line" style={{ width: '150px', height: '20px', margin: '0 auto 8px' }}></div>
                  <div className="skeleton-line" style={{ width: '100%', height: '14px', marginBottom: '4px' }}></div>
                  <div className="skeleton-line" style={{ width: '80%', height: '14px', margin: '0 auto' }}></div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    )
  }

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-3 rounded">
              <SettingsIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="mb-0">Settings</h2>
              <p className="text-muted mb-0">
                {activeSection === 'overview' 
                  ? 'Manage barangay information, system preferences, and user accounts'
                  : activeSection === 'barangay'
                  ? 'Manage barangay information'
                  : activeSection === 'preferences'
                  ? 'Configure system preferences'
                  : activeSection === 'emergency'
                  ? 'Manage emergency settings'
                  : activeSection === 'users'
                  ? 'Manage system users'
                  : 'Manage system settings'}
              </p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alerts */}
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Settings Navigation Cards */}
      {activeSection === 'overview' ? (
        <Row className="g-4">
          <Col md={6} lg={3}>
            <Card 
              className="h-100 cursor-pointer card-modern" 
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => navigate('/settings?section=barangay')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Card.Body className="text-center p-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                  <Building size={32} className="text-primary" />
                </div>
                <Card.Title className="h5 mb-2">Barangay Information</Card.Title>
                <Card.Text className="text-muted small">
                  Manage barangay name, address, contact, and logo
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card 
              className="h-100 cursor-pointer card-modern" 
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => navigate('/settings?section=preferences')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Card.Body className="text-center p-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                  <Cog size={32} className="text-primary" />
                </div>
                <Card.Title className="h5 mb-2">System Preferences</Card.Title>
                <Card.Text className="text-muted small">
                  Configure display settings, pagination, and date formats
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card 
              className="h-100 cursor-pointer card-modern" 
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => navigate('/settings?section=emergency')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Card.Body className="text-center p-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                  <Phone size={32} className="text-primary" />
                </div>
                <Card.Title className="h5 mb-2">Emergency Settings</Card.Title>
                <Card.Text className="text-muted small">
                  Manage emergency contacts and evacuation centers
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6} lg={3}>
            <Card 
              className="h-100 cursor-pointer card-modern" 
              style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
              onClick={() => navigate('/settings?section=users')}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = ''
              }}
            >
              <Card.Body className="text-center p-4">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                  <Users size={32} className="text-primary" />
                </div>
                <Card.Title className="h5 mb-2">User Management</Card.Title>
                <Card.Text className="text-muted small">
                  Manage system users, roles, and permissions
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <Card>
          <Card.Body className="p-0">
            <Tab.Container id="settings-tabs" activeKey={activeSection}>
              <Row>
                <Col md={3}>
                  <Nav variant="pills" className="flex-column border-end">
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="overview" 
                        className="d-flex align-items-center gap-2"
                        onClick={() => navigate('/settings?section=overview')}
                      >
                        <SettingsIcon className="h-4 w-4" />
                        Overview
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="barangay" 
                        className="d-flex align-items-center gap-2"
                        onClick={() => navigate('/settings?section=barangay')}
                      >
                        <Building className="h-4 w-4" />
                        Barangay Info
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="preferences" 
                        className="d-flex align-items-center gap-2"
                        onClick={() => navigate('/settings?section=preferences')}
                      >
                        <Cog className="h-4 w-4" />
                        System Preferences
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="emergency" 
                        className="d-flex align-items-center gap-2"
                        onClick={() => navigate('/settings?section=emergency')}
                      >
                        <Phone className="h-4 w-4" />
                        Emergency Settings
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        eventKey="users" 
                        className="d-flex align-items-center gap-2"
                        onClick={() => navigate('/settings?section=users')}
                      >
                        <Users className="h-4 w-4" />
                        User Management
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                </Col>
                <Col md={9}>
                  <Tab.Content className="p-4">
                  {/* Barangay Info Tab */}
                  <Tab.Pane eventKey="barangay">
                    <h4 className="mb-4">Barangay Information</h4>
                    <Form>
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Barangay Name *</Form.Label>
                            <Form.Control
                              type="text"
                              value={barangayInfo.name}
                              onChange={(e) => setBarangayInfo(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Enter barangay name"
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Contact Number *</Form.Label>
                            <Form.Control
                              type="text"
                              value={barangayInfo.contact}
                              onChange={(e) => setBarangayInfo(prev => ({ ...prev, contact: e.target.value }))}
                              placeholder="Enter contact number"
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                        <Form.Label>Address *</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={3}
                          value={barangayInfo.address}
                          onChange={(e) => setBarangayInfo(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter complete address"
                        />
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Logo Path</Form.Label>
                        <Form.Control
                          type="text"
                          value={barangayInfo.logo_path || ''}
                          onChange={(e) => setBarangayInfo(prev => ({ ...prev, logo_path: e.target.value }))}
                          placeholder="Enter logo file path"
                        />
                      </Form.Group>
                      <Button
                        variant="primary"
                        onClick={handleBarangayInfoSave}
                        disabled={saving === 'barangay'}
                        className="d-flex align-items-center gap-2"
                      >
                        {saving === 'barangay' && <Spinner animation="border" size="sm" />}
                        Save Barangay Info
                      </Button>
                    </Form>
                  </Tab.Pane>

                  {/* System Preferences Tab */}
                  <Tab.Pane eventKey="preferences">
                    <h4 className="mb-4">System Preferences</h4>
                    

                    {/* Other Preferences */}
                    <Card className="mb-4">
                      <Card.Header>
                        <h6 className="mb-0">Display Settings</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Items per Page *</Form.Label>
                              <Form.Select
                                value={preferences.per_page}
                                onChange={(e) => setPreferences(prev => ({ ...prev, per_page: Number(e.target.value) }))}
                              >
                                <option value={5}>5 items</option>
                                <option value={10}>10 items</option>
                                <option value={15}>15 items</option>
                                <option value={25}>25 items</option>
                                <option value={50}>50 items</option>
                              </Form.Select>
                              <Form.Text className="text-muted">
                                Number of items displayed per page in lists and tables.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Date Format *</Form.Label>
                              <Form.Select
                                value={preferences.date_format}
                                onChange={(e) => setPreferences(prev => ({ ...prev, date_format: e.target.value }))}
                              >
                                <option value="YYYY-MM-DD">YYYY-MM-DD (2025-08-28)</option>
                                <option value="MM/DD/YYYY">MM/DD/YYYY (08/28/2025)</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY (28/08/2025)</option>
                                <option value="MMMM DD, YYYY">MMMM DD, YYYY (August 28, 2025)</option>
                              </Form.Select>
                              <Form.Text className="text-muted">
                                How dates are displayed throughout the application.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

                    <div className="d-flex gap-2">
                      <Button
                        variant="primary"
                        onClick={handlePreferencesSave}
                        disabled={saving === 'preferences'}
                        className="d-flex align-items-center gap-2"
                      >
                        {saving === 'preferences' && <Spinner animation="border" size="sm" />}
                        Save Preferences
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          // Revert to original settings
                          if (settings?.system_preferences) {
                            setPreferences(settings.system_preferences)
                          }
                        }}
                        disabled={saving === 'preferences'}
                      >
                        Cancel Changes
                      </Button>
                    </div>
                  </Tab.Pane>

                  {/* Emergency Settings Tab */}
                  <Tab.Pane eventKey="emergency">
                    <h4 className="mb-4">Emergency Settings</h4>
                    
                    {/* Emergency Contact Numbers */}
                    <Card className="mb-4">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Emergency Contact Numbers</h6>
                          <Button size="sm" variant="outline-primary" onClick={addEmergencyContact}>
                            Add Contact
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {(emergency.contact_numbers || []).map((contact, index) => (
                          <Row key={index} className="mb-3">
                            <Col md={5}>
                              <Form.Control
                                type="text"
                                placeholder="Contact name"
                                value={contact.name}
                                onChange={(e) => updateEmergencyContact(index, 'name', e.target.value)}
                              />
                            </Col>
                            <Col md={5}>
                              <Form.Control
                                type="text"
                                placeholder="Phone number"
                                value={contact.number}
                                onChange={(e) => updateEmergencyContact(index, 'number', e.target.value)}
                              />
                            </Col>
                            <Col md={2}>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => removeEmergencyContact(index)}
                              >
                                Remove
                              </Button>
                            </Col>
                          </Row>
                        ))}
                        {(emergency.contact_numbers || []).length === 0 && (
                          <p className="text-muted text-center py-3">No emergency contacts added</p>
                        )}
                      </Card.Body>
                    </Card>

                    {/* Evacuation Centers */}
                    <Card className="mb-4">
                      <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">Evacuation Centers</h6>
                          <Button size="sm" variant="outline-primary" onClick={addEvacuationCenter}>
                            Add Center
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        {(emergency.evacuation_centers || []).map((center, index) => (
                          <Row key={index} className="mb-3">
                            <Col md={3}>
                              <Form.Control
                                type="text"
                                placeholder="Center name"
                                value={center.name}
                                onChange={(e) => updateEvacuationCenter(index, 'name', e.target.value)}
                              />
                            </Col>
                            <Col md={4}>
                              <Form.Control
                                type="text"
                                placeholder="Address"
                                value={center.address}
                                onChange={(e) => updateEvacuationCenter(index, 'address', e.target.value)}
                              />
                            </Col>
                            <Col md={3}>
                              <Form.Control
                                type="number"
                                placeholder="Capacity"
                                value={center.capacity}
                                onChange={(e) => updateEvacuationCenter(index, 'capacity', Number(e.target.value))}
                              />
                            </Col>
                            <Col md={2}>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => removeEvacuationCenter(index)}
                              >
                                Remove
                              </Button>
                            </Col>
                          </Row>
                        ))}
                        {(emergency.evacuation_centers || []).length === 0 && (
                          <p className="text-muted text-center py-3">No evacuation centers added</p>
                        )}
                      </Card.Body>
                    </Card>

                    <Button
                      variant="primary"
                      onClick={handleEmergencySave}
                      disabled={saving === 'emergency'}
                      className="d-flex align-items-center gap-2"
                    >
                      {saving === 'emergency' && <Spinner animation="border" size="sm" />}
                      Save Emergency Settings
                    </Button>
                  </Tab.Pane>

                  {/* User Management Tab */}
                  <Tab.Pane eventKey="users">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <h4 className="mb-0">User Management</h4>
                      <Button variant="primary" onClick={() => navigate('/users')}>
                        Manage Users
                      </Button>
                    </div>
                    <p className="text-muted">
                      Manage system users, roles, and permissions. Click the button above to access the full User Management page.
                    </p>
                    <Card className="mt-3">
                      <Card.Body>
                        <p className="mb-0">
                          <strong>User Management Features:</strong>
                        </p>
                        <ul className="mt-2">
                          <li>Create, edit, and delete user accounts</li>
                          <li>Assign roles and permissions</li>
                          <li>Link users to puroks</li>
                          <li>Manage user status (active/inactive)</li>
                          <li>Restore deleted users</li>
                        </ul>
                      </Card.Body>
                    </Card>
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
      )}
    </Container>
  )
}
