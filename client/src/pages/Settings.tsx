import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Tab } from 'react-bootstrap'
import { Settings as SettingsIcon, Building, Cog, Phone, Sun, Moon, Monitor } from 'lucide-react'
import { getSettings, updateBarangayInfo, updatePreferences, updateEmergency, type Settings, type BarangayInfo, type SystemPreferences, type EmergencySettings, type EmergencyContact, type EvacuationCenter } from '../services/settings.service'
import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { setTheme } = useTheme()
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
    theme: 'light',
    per_page: 10,
    date_format: 'YYYY-MM-DD'
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
        setPreferences(response.data.system_preferences || { theme: 'light', per_page: 10, date_format: 'YYYY-MM-DD' })
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
        // Apply theme change immediately
        setTheme(preferences.theme)
      } else {
        setError(response.message || 'Failed to update system preferences')
        // Revert theme if save failed
        if (settings?.system_preferences?.theme) {
          setTheme(settings.system_preferences.theme)
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update system preferences')
      // Revert theme if save failed
      if (settings?.system_preferences?.theme) {
        setTheme(settings.system_preferences.theme)
      }
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

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setPreferences(prev => ({ ...prev, theme: newTheme }))
    // Apply theme change immediately for preview
    setTheme(newTheme)
  }

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />
      case 'dark': return <Moon className="h-4 w-4" />
      default: return <Monitor className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-2">Loading settings...</p>
      </div>
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
              <h2 className="mb-0">System Settings</h2>
              <p className="text-muted mb-0">Manage barangay information and system preferences</p>
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

      {/* Settings Tabs */}
      <Card>
        <Card.Body className="p-0">
          <Tab.Container id="settings-tabs" defaultActiveKey="barangay">
            <Row>
              <Col md={3}>
                <Nav variant="pills" className="flex-column border-end">
                  <Nav.Item>
                    <Nav.Link eventKey="barangay" className="d-flex align-items-center gap-2">
                      <Building className="h-4 w-4" />
                      Barangay Info
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="preferences" className="d-flex align-items-center gap-2">
                      <Cog className="h-4 w-4" />
                      System Preferences
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="emergency" className="d-flex align-items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Emergency Settings
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
                    
                    {/* Theme Selection */}
                    <Card className="mb-4">
                      <Card.Header>
                        <h6 className="mb-0">Theme Settings</h6>
                      </Card.Header>
                      <Card.Body>
                        <Row>
                          <Col md={6}>
                            <Form.Group className="mb-3">
                              <Form.Label>Application Theme *</Form.Label>
                              <div className="d-flex gap-2">
                                <Button
                                  variant={preferences.theme === 'light' ? 'primary' : 'outline-primary'}
                                  onClick={() => handleThemeChange('light')}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <Sun className="h-4 w-4" />
                                  Light Mode
                                </Button>
                                <Button
                                  variant={preferences.theme === 'dark' ? 'primary' : 'outline-primary'}
                                  onClick={() => handleThemeChange('dark')}
                                  className="d-flex align-items-center gap-2"
                                >
                                  <Moon className="h-4 w-4" />
                                  Dark Mode
                                </Button>
                              </div>
                              <Form.Text className="text-muted">
                                Choose your preferred theme. Changes are applied immediately for preview.
                              </Form.Text>
                            </Form.Group>
                          </Col>
                          <Col md={6}>
                            <div className="p-3 border rounded">
                              <h6 className="mb-2">Theme Preview</h6>
                              <div className={`p-3 rounded ${preferences.theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'}`}>
                                <div className="d-flex align-items-center gap-2 mb-2">
                                  {getThemeIcon(preferences.theme)}
                                  <span className="fw-bold">Sample Content</span>
                                </div>
                                <p className="mb-2 small">This is how your interface will look with the selected theme.</p>
                                <div className="d-flex gap-2">
                                  <Button size="sm" variant="primary">Primary Button</Button>
                                  <Button size="sm" variant="secondary">Secondary Button</Button>
                                </div>
                              </div>
                            </div>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>

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
                            setTheme(settings.system_preferences.theme)
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
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
        </Card.Body>
      </Card>
    </Container>
  )
}
