import { useState, useEffect } from 'react'
import { Container, Row, Col, Card, Form, Button, Alert, Spinner, Nav, Tab, Modal } from 'react-bootstrap'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Settings as SettingsIcon, Building, Cog, Phone, Users, UserPlus, Shield, UserCheck, ArrowRight, Key, UserCog, RotateCcw, Eye, CheckCircle } from 'lucide-react'
import { getSettings, updatePreferences, updateEmergency, type Settings, type SystemPreferences, type EmergencySettings, type EmergencyContact, type EvacuationCenter } from '../services/settings.service'
import { getBarangayInfo, saveBarangayInfo, type BarangayInfo } from '../services/barangay-info.service'
import { getUsers } from '../services/users.service'

export default function Settings() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const activeSection = searchParams.get('section') || 'overview'

  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // Barangay Info Form State (Clean Implementation)
  const [barangayInfo, setBarangayInfo] = useState<BarangayInfo>({
    barangay_name: '',
    municipality: '',
    province: '',
    region: '',
    address: '',
    contact_number: '',
    email: '',
    captain_name: '',
    logo_path: null,
    captain_signature_path: null
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewModalData, setReviewModalData] = useState<BarangayInfo | null>(null)
  const [preferences, setPreferences] = useState<SystemPreferences>({
    per_page: 10,
    date_format: 'YYYY-MM-DD',
    theme: 'light'
  })
  const [emergency, setEmergency] = useState<EmergencySettings>({
    contact_numbers: [],
    evacuation_centers: []
  })
  const [userStats, setUserStats] = useState({
    total: 0,
    active: 0,
    admin: 0,
    purok_leader: 0,
    staff: 0
  })
  const [loadingStats, setLoadingStats] = useState(false)
  const [hasBarangayInfo, setHasBarangayInfo] = useState(false)

  useEffect(() => {
    loadBarangayInfo()
    loadSettings()
    loadUserStats()
  }, [])

  // Load Barangay Info (Clean Implementation)
  const loadBarangayInfo = async () => {
    try {
      const response = await getBarangayInfo()

      if (response.success && response.data) {
        setBarangayInfo({
          barangay_name: response.data.barangay_name || '',
          municipality: response.data.municipality || '',
          province: response.data.province || '',
          region: response.data.region || '',
          address: response.data.address || '',
          contact_number: response.data.contact_number || '',
          email: response.data.email || '',
          captain_name: response.data.captain_name || '',
          logo_path: response.data.logo_path,
          captain_signature_path: response.data.captain_signature_path ?? null
        })

        // Set logo preview if exists
        if (response.data.logo_path) {
          setLogoPreview(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${response.data.logo_path}`)
        }
        // Set signature preview if exists
        if (response.data.captain_signature_path) {
          setSignaturePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${response.data.captain_signature_path}`)
        } else {
          setSignaturePreview(null)
        }

        setHasBarangayInfo(!!(response.data.barangay_name || response.data.municipality || response.data.province))
      }
    } catch (err: any) {
      console.error('Failed to load barangay info:', err)
      // Don't set error - allow form to work even if load fails
    }
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await getSettings()

      if (response.success) {
        setSettings(response.data)
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

  const loadUserStats = async () => {
    try {
      setLoadingStats(true)
      const response = await getUsers({ per_page: 1 })
      if (response.success) {
        const total = response.data.total || 0

        // Get counts by role
        const adminResponse = await getUsers({ role: 'admin', per_page: 1 })
        const purokLeaderResponse = await getUsers({ role: 'purok_leader', per_page: 1 })
        const staffResponse = await getUsers({ role: 'staff', per_page: 1 })

        const allUsersResponse = await getUsers({ per_page: 1000 })
        const activeCount = allUsersResponse.success
          ? allUsersResponse.data.data.filter((u: any) => !u.deleted_at).length
          : 0

        setUserStats({
          total,
          active: activeCount,
          admin: adminResponse.success ? adminResponse.data.total || 0 : 0,
          purok_leader: purokLeaderResponse.success ? purokLeaderResponse.data.total || 0 : 0,
          staff: staffResponse.success ? staffResponse.data.total || 0 : 0
        })
      }
    } catch (err) {
      console.error('Failed to load user stats:', err)
    } finally {
      setLoadingStats(false)
    }
  }

  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle captain signature file selection
  const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSignatureFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setSignaturePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle Review Changes
  const handleReviewChanges = () => {
    // Store snapshot of current state for modal
    setReviewModalData({ ...barangayInfo })
    setShowReviewModal(true)
  }

  // Save Barangay Info (Clean Implementation)
  const handleBarangayInfoSave = async () => {
    try {
      setSaving('barangay')
      setError(null)
      setSuccess(null)

      // Create FormData
      const formData = new FormData()
      formData.append('barangay_name', barangayInfo.barangay_name || '')
      formData.append('municipality', barangayInfo.municipality || '')
      formData.append('province', barangayInfo.province || '')
      formData.append('region', barangayInfo.region || '')
      formData.append('address', barangayInfo.address || '')
      formData.append('contact_number', barangayInfo.contact_number || '')
      formData.append('email', barangayInfo.email || '')
      formData.append('captain_name', barangayInfo.captain_name || '')

      // Add logo file if selected
      if (logoFile) {
        formData.append('logo', logoFile)
      }
      // Add captain signature file if selected
      if (signatureFile) {
        formData.append('captain_signature', signatureFile)
      }

      const response = await saveBarangayInfo(formData)

      if (response.success) {
        setSuccess('Barangay information saved successfully')
        setLogoFile(null)
        setSignatureFile(null)

        // Update form state with saved data (never reset to blank)
        if (response.data) {
          setBarangayInfo({
            barangay_name: response.data.barangay_name || '',
            municipality: response.data.municipality || '',
            province: response.data.province || '',
            region: response.data.region || '',
            address: response.data.address || '',
            contact_number: response.data.contact_number || '',
            email: response.data.email || '',
            captain_name: response.data.captain_name || '',
            logo_path: response.data.logo_path,
            captain_signature_path: response.data.captain_signature_path ?? null
          })

          // Update logo preview
          if (response.data.logo_path) {
            setLogoPreview(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${response.data.logo_path}`)
          } else {
            setLogoPreview(null)
          }
          // Update signature preview
          if (response.data.captain_signature_path) {
            setSignaturePreview(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${response.data.captain_signature_path}`)
          } else {
            setSignaturePreview(null)
          }

          setHasBarangayInfo(!!(response.data.barangay_name || response.data.municipality || response.data.province))
        }
      } else {
        setError(response.message || 'Failed to save barangay information')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to save barangay information')
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
        <Alert variant="danger" dismissible onClose={() => setError(null)} className="mb-3">
          <Alert.Heading>Error</Alert.Heading>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)} className="mb-3">
          <Alert.Heading>Success</Alert.Heading>
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
                    {/* Barangay Info Tab - Clean Implementation */}
                    <Tab.Pane eventKey="barangay">
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <h4 className="mb-0">Barangay Information</h4>
                        <div className="d-flex gap-2">
                          <Button
                            variant="outline-primary"
                            onClick={handleReviewChanges}
                            className="d-flex align-items-center gap-2"
                          >
                            <Eye className="h-4 w-4" />
                            Review Changes
                          </Button>
                          <Button
                            variant="primary"
                            onClick={handleBarangayInfoSave}
                            disabled={saving === 'barangay'}
                            className="btn-brand-primary d-flex align-items-center gap-2"
                          >
                            {saving === 'barangay' && <Spinner animation="border" size="sm" />}
                            {hasBarangayInfo ? 'Update Barangay Information' : 'Save Barangay Information'}
                          </Button>
                        </div>
                      </div>

                      <Form onSubmit={(e) => e.preventDefault()}>
                        <Card className="mb-4">
                          <Card.Header>
                            <h6 className="mb-0">Barangay Information</h6>
                          </Card.Header>
                          <Card.Body>
                            <Row>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Barangay Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={barangayInfo.barangay_name || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, barangay_name: e.target.value }))}
                                    placeholder="Enter barangay name"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Municipality</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={barangayInfo.municipality || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, municipality: e.target.value }))}
                                    placeholder="Enter municipality"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Province</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={barangayInfo.province || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, province: e.target.value }))}
                                    placeholder="Enter province"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Region</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={barangayInfo.region || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, region: e.target.value }))}
                                    placeholder="Enter region"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={12}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Address</Form.Label>
                                  <Form.Control
                                    as="textarea"
                                    rows={3}
                                    value={barangayInfo.address || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, address: e.target.value }))}
                                    placeholder="Enter complete barangay hall address"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Contact Number</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={barangayInfo.contact_number || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, contact_number: e.target.value }))}
                                    placeholder="Enter contact number"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Email Address</Form.Label>
                                  <Form.Control
                                    type="email"
                                    value={barangayInfo.email || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="Enter email address"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Captain Name</Form.Label>
                                  <Form.Control
                                    type="text"
                                    value={barangayInfo.captain_name || ''}
                                    onChange={(e) => setBarangayInfo(prev => ({ ...prev, captain_name: e.target.value }))}
                                    placeholder="Enter captain name"
                                  />
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Barangay Logo / Seal</Form.Label>
                                  <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                  />
                                  {logoPreview && (
                                    <div className="mt-2">
                                      <img
                                        src={logoPreview}
                                        alt="Logo preview"
                                        style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain', border: '1px solid #ddd', padding: '8px', borderRadius: '4px' }}
                                        className="bg-light"
                                      />
                                    </div>
                                  )}
                                </Form.Group>
                              </Col>
                              <Col md={6}>
                                <Form.Group className="mb-3">
                                  <Form.Label>Kapitan Signature</Form.Label>
                                  <Form.Control
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSignatureChange}
                                  />
                                  <Form.Text className="text-muted">
                                    Upload signature image for certificates. Used when no captain user signature is set.
                                  </Form.Text>
                                  {signaturePreview && (
                                    <div className="mt-2">
                                      <img
                                        src={signaturePreview}
                                        alt="Signature preview"
                                        style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain', border: '1px solid #ddd', padding: '8px', borderRadius: '4px', backgroundColor: '#fff' }}
                                        className="bg-light"
                                      />
                                    </div>
                                  )}
                                </Form.Group>
                              </Col>
                            </Row>
                          </Card.Body>
                        </Card>
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
                      {/* Header */}
                      <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                          <div className="d-flex align-items-center gap-3 mb-2">
                            <div className="bg-primary bg-opacity-10 p-3 rounded">
                              <Users className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h4 className="mb-0">User Management</h4>
                              <p className="text-muted mb-0 small">Manage system users, roles, and permissions</p>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          onClick={() => navigate('/users')}
                          className="btn-brand-primary d-flex align-items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Go to User Management
                        </Button>
                      </div>

                      {/* Statistics Cards */}
                      <Row className="g-3 mb-4">
                        <Col md={3}>
                          <Card className="card-modern h-100">
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <p className="text-muted mb-1 small">Total Users</p>
                                  <h3 className="mb-0 text-brand-primary">
                                    {loadingStats ? <Spinner animation="border" size="sm" /> : userStats.total}
                                  </h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-2 rounded">
                                  <Users className="h-5 w-5 text-primary" />
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="card-modern h-100">
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <p className="text-muted mb-1 small">Active Users</p>
                                  <h3 className="mb-0 text-success">
                                    {loadingStats ? <Spinner animation="border" size="sm" /> : userStats.active}
                                  </h3>
                                </div>
                                <div className="bg-success bg-opacity-10 p-2 rounded">
                                  <UserCheck className="h-5 w-5 text-success" />
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="card-modern h-100">
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <p className="text-muted mb-1 small">Administrators</p>
                                  <h3 className="mb-0 text-danger">
                                    {loadingStats ? <Spinner animation="border" size="sm" /> : userStats.admin}
                                  </h3>
                                </div>
                                <div className="bg-danger bg-opacity-10 p-2 rounded">
                                  <Shield className="h-5 w-5 text-danger" />
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={3}>
                          <Card className="card-modern h-100">
                            <Card.Body>
                              <div className="d-flex align-items-center justify-content-between">
                                <div>
                                  <p className="text-muted mb-1 small">Purok Leaders</p>
                                  <h3 className="mb-0 text-info">
                                    {loadingStats ? <Spinner animation="border" size="sm" /> : userStats.purok_leader}
                                  </h3>
                                </div>
                                <div className="bg-info bg-opacity-10 p-2 rounded">
                                  <Users className="h-5 w-5 text-info" />
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>

                      {/* Features Grid */}
                      <Row className="g-3 mb-4">
                        <Col md={6}>
                          <Card className="h-100 border-start border-primary border-4">
                            <Card.Body>
                              <div className="d-flex align-items-start gap-3">
                                <div className="bg-primary bg-opacity-10 p-2 rounded">
                                  <UserPlus className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h6 className="mb-2">User Account Management</h6>
                                  <ul className="mb-0 small text-muted" style={{ paddingLeft: '1.2rem' }}>
                                    <li>Create new user accounts</li>
                                    <li>Edit user information</li>
                                    <li>Delete or deactivate users</li>
                                    <li>Restore deleted users</li>
                                  </ul>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="h-100 border-start border-warning border-4">
                            <Card.Body>
                              <div className="d-flex align-items-start gap-3">
                                <div className="bg-warning bg-opacity-10 p-2 rounded">
                                  <Key className="h-5 w-5 text-warning" />
                                </div>
                                <div>
                                  <h6 className="mb-2">Roles & Permissions</h6>
                                  <ul className="mb-0 small text-muted" style={{ paddingLeft: '1.2rem' }}>
                                    <li>Assign user roles (Admin, Staff, Purok Leader)</li>
                                    <li>Manage role-based permissions</li>
                                    <li>Link users to specific puroks</li>
                                    <li>Control system access levels</li>
                                  </ul>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="h-100 border-start border-info border-4">
                            <Card.Body>
                              <div className="d-flex align-items-start gap-3">
                                <div className="bg-info bg-opacity-10 p-2 rounded">
                                  <UserCog className="h-5 w-5 text-info" />
                                </div>
                                <div>
                                  <h6 className="mb-2">User Status Management</h6>
                                  <ul className="mb-0 small text-muted" style={{ paddingLeft: '1.2rem' }}>
                                    <li>Activate or deactivate accounts</li>
                                    <li>Monitor user activity</li>
                                    <li>Track user login history</li>
                                    <li>Manage account status</li>
                                  </ul>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                        <Col md={6}>
                          <Card className="h-100 border-start border-success border-4">
                            <Card.Body>
                              <div className="d-flex align-items-start gap-3">
                                <div className="bg-success bg-opacity-10 p-2 rounded">
                                  <RotateCcw className="h-5 w-5 text-success" />
                                </div>
                                <div>
                                  <h6 className="mb-2">Data Recovery</h6>
                                  <ul className="mb-0 small text-muted" style={{ paddingLeft: '1.2rem' }}>
                                    <li>Restore accidentally deleted users</li>
                                    <li>Recover user data and settings</li>
                                    <li>Maintain data integrity</li>
                                    <li>Audit trail for all changes</li>
                                  </ul>
                                </div>
                              </div>
                            </Card.Body>
                          </Card>
                        </Col>
                      </Row>
                    </Tab.Pane>
                  </Tab.Content>
                </Col>
              </Row>
            </Tab.Container>
          </Card.Body>
        </Card>
      )}

      {/* Review Changes Modal */}
      {showReviewModal && (
        <Modal
          show={showReviewModal}
          onHide={() => {
            setShowReviewModal(false)
            setReviewModalData(null)
          }}
          size="lg"
          centered
          backdrop="static"
        >
          <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center gap-2">
              <Eye className="h-5 w-5" />
              Review Barangay Information
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <div className="mb-4">
              <p className="text-muted mb-4">
                Please review all information before confirming. Fields with no value will display as "N/A".
              </p>

              {/* Review Content - Clean Structure */}
              <Card className="mb-3">
                <Card.Header className="bg-light">
                  <h6 className="mb-0">Barangay Information Review</h6>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col md={6} className="mb-3">
                      <strong>Barangay Name:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.barangay_name || barangayInfo.barangay_name)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Municipality:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.municipality || barangayInfo.municipality)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Province:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.province || barangayInfo.province)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Region:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.region || barangayInfo.region)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={12} className="mb-3">
                      <strong>Address:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.address || barangayInfo.address)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Contact Number:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.contact_number || barangayInfo.contact_number)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Email Address:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.email || barangayInfo.email)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Captain Name:</strong>
                      <div className="text-muted">
                        {(reviewModalData?.captain_name || barangayInfo.captain_name)?.trim() || 'N/A'}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Logo:</strong>
                      <div className="mt-2">
                        {logoFile ? (
                          <img
                            src={URL.createObjectURL(logoFile)}
                            alt="Logo preview"
                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                            className="border rounded"
                          />
                        ) : (reviewModalData?.logo_path || barangayInfo.logo_path) ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${reviewModalData?.logo_path || barangayInfo.logo_path}`}
                            alt="Current logo"
                            style={{ maxWidth: '200px', maxHeight: '150px', objectFit: 'contain' }}
                            className="border rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </div>
                    </Col>
                    <Col md={6} className="mb-3">
                      <strong>Kapitan Signature:</strong>
                      <div className="mt-2">
                        {signatureFile ? (
                          <img
                            src={URL.createObjectURL(signatureFile)}
                            alt="Signature preview"
                            style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                            className="border rounded bg-white"
                          />
                        ) : (reviewModalData?.captain_signature_path || barangayInfo.captain_signature_path) ? (
                          <img
                            src={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/storage/${reviewModalData?.captain_signature_path || barangayInfo.captain_signature_path}`}
                            alt="Current signature"
                            style={{ maxWidth: '200px', maxHeight: '80px', objectFit: 'contain' }}
                            className="border rounded bg-white"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>
              Back to Edit
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                // Use reviewModalData if available, otherwise use current barangayInfo
                if (reviewModalData) {
                  setBarangayInfo(reviewModalData)
                }
                handleBarangayInfoSave()
                setShowReviewModal(false)
              }}
              disabled={saving === 'barangay'}
              className="btn-brand-primary d-flex align-items-center gap-2"
            >
              {saving === 'barangay' && <Spinner animation="border" size="sm" />}
              <CheckCircle className="h-4 w-4" />
              Confirm & Save
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  )
}
