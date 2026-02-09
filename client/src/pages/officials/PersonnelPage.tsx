import { useState, useEffect } from 'react'
import { Row, Col, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import OfficialList from '../../components/officials/OfficialList'
import OfficialForm from '../../components/officials/OfficialForm'
import OfficialCard from '../../components/officials/OfficialCard'
import {
  type Official,
  type CreateOfficialData,
  getOfficials,
  createOfficial,
  updateOfficial,
  deleteOfficial,
  toggleOfficialActive,
  OFFICIAL_POSITION_OPTIONS,
  SK_POSITION_OPTIONS
} from '../../services/officials.service'

interface PersonnelPageProps {
  category: 'official' | 'sk' | 'tanod' | 'bhw' | 'staff'
  title: string
  description: string
  addButtonLabel: string
}

export default function PersonnelPage({
  category,
  title,
  description,
  addButtonLabel
}: PersonnelPageProps) {
  const { user } = useAuth()
  // Admin, captain, and staff can manage (create/edit/toggle); only admin and captain can delete
  const canManage = user?.role === 'admin' || user?.role === 'captain' || user?.role === 'staff'
  const canDelete = user?.role === 'admin' || user?.role === 'captain'

  // State
  const [officials, setOfficials] = useState<Official[]>([])
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState({
    search: '',
    position: '',
    active: null as boolean | null
  })

  // Load personnel
  const loadOfficials = async () => {
    try {
      setLoading(true)
      setError(null)

      const params: any = {
        category // Always filter by category
      }
      if (filters.search) params.search = filters.search
      if (filters.position) params.position = filters.position
      if (filters.active !== null) params.active = filters.active

      const response = await getOfficials(params)

      if (response.success) {
        // Set data immediately - no delays
        const officialsData = response.data.data || []
        setOfficials(officialsData)
      } else {
        setError(response.message || 'Failed to load personnel')
      }
    } catch (error) {
      console.error('Error loading personnel:', error)
      setError('Failed to load personnel')
    } finally {
      // Clear loading state immediately when data is ready
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOfficials()
  }, [filters])

  // Handle form submission
  const handleFormSubmit = async (data: CreateOfficialData) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to create or edit personnel.')
      return
    }

    try {
      setFormLoading(true)
      setError(null)

      // Ensure category is always included
      const submitData: CreateOfficialData & { category?: string } = {
        ...data,
        category
      }

      let response
      if (selectedOfficial) {
        response = await updateOfficial(selectedOfficial.id, submitData)
      } else {
        response = await createOfficial(submitData)
      }

      if (response.success) {
        setSuccess(selectedOfficial ? 'Personnel updated successfully' : 'Personnel created successfully')
        setShowForm(false)
        setSelectedOfficial(null)
        // Reload personnel to get updated data including new photo URLs
        await loadOfficials()
      } else {
        setError(response.message || 'Failed to save personnel')
      }
    } catch (error: any) {
      console.error('Error saving personnel:', error)

      // Handle validation errors
      if (error.response?.status === 422 && error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
        const errorMessages = Object.values(validationErrors).flat().join(', ')
        setError(`Validation errors: ${errorMessages}`)
      } else if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'You do not have permission to perform this action.')
      } else {
        setError(error.response?.data?.message || 'Failed to save personnel')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    // Authorization check
    if (!canDelete) {
      setError('You do not have permission to delete personnel.')
      return
    }

    if (!window.confirm('Are you sure you want to delete this personnel record?')) {
      return
    }

    try {
      setError(null)
      const response = await deleteOfficial(id)

      if (response.success) {
        setSuccess('Personnel deleted successfully')
        loadOfficials()
        if (selectedOfficial?.id === id) {
          setSelectedOfficial(null)
        }
      } else {
        setError(response.message || 'Failed to delete personnel')
      }
    } catch (error: any) {
      console.error('Error deleting personnel:', error)
      if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'You do not have permission to delete personnel.')
      } else {
        setError(error.response?.data?.message || 'Failed to delete personnel')
      }
    }
  }

  // Handle toggle active
  const handleToggleActive = async (id: number) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to change personnel status.')
      return
    }

    try {
      setError(null)
      const response = await toggleOfficialActive(id)

      if (response.success) {
        setSuccess('Personnel status updated successfully')
        loadOfficials()
        if (selectedOfficial?.id === id) {
          setSelectedOfficial(response.data)
        }
      } else {
        setError(response.message || 'Failed to update personnel status')
      }
    } catch (error: any) {
      console.error('Error updating personnel status:', error)
      if (error.response?.status === 403) {
        setError(error.response?.data?.message || 'You do not have permission to change personnel status.')
      } else {
        setError(error.response?.data?.message || 'Failed to update personnel status')
      }
    }
  }

  // Handle edit
  const handleEdit = (official: Official) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to edit personnel.')
      return
    }

    setSelectedOfficial(official)
    setShowForm(true)
  }

  // Handle search and filters
  const handleSearch = (search: string) => {
    setFilters(prev => ({ ...prev, search }))
  }

  const handleFilterPosition = (position: string) => {
    setFilters(prev => ({ ...prev, position }))
  }

  const handleFilterStatus = (active: boolean | null) => {
    setFilters(prev => ({ ...prev, active }))
  }

  // Clear alerts
  const clearAlerts = () => {
    setError(null)
    setSuccess(null)
  }

  useEffect(() => {
    const timer = setTimeout(clearAlerts, 5000)
    return () => clearTimeout(timer)
  }, [error, success])

  return (
    <div className="page-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1 text-brand-primary">{title}</h2>
          <p className="text-brand-muted mb-0">{description}</p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            onClick={() => {
              setSelectedOfficial(null)
              setShowForm(true)
            }}
            className="btn-brand-primary"
          >
            ➕ {addButtonLabel}
          </Button>
        )}
      </div>

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

      <Row>
        {/* Left Column - Personnel List */}
        <Col lg={8}>
          <OfficialList
            positionOptions={
              category === 'official'
                ? OFFICIAL_POSITION_OPTIONS
                : category === 'sk'
                  ? SK_POSITION_OPTIONS
                  : []
            }
            hidePositionFilter={category === 'tanod' || category === 'bhw' || category === 'staff'}
            officials={officials}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            onSearch={handleSearch}
            onFilterPosition={handleFilterPosition}
            onFilterStatus={handleFilterStatus}
            canManage={canManage}
            canDelete={canDelete}
          />
        </Col>

        {/* Right Column - Selected Personnel Details */}
        <Col lg={4}>
          <div className="sticky-top" style={{ top: '2rem' }}>
            {selectedOfficial ? (
              <div>
                <h5 className="mb-3 text-brand-primary">Personnel Details</h5>
                <OfficialCard official={selectedOfficial} />
              </div>
            ) : (
              <div className="bg-brand-surface rounded p-4 text-center">
                <div className="text-brand-muted mb-2">👤</div>
                <h6 className="text-brand-primary">Select Personnel</h6>
                <p className="text-brand-muted small mb-0">
                  Click on a personnel from the list to view their details
                </p>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Personnel Form Modal */}
      <OfficialForm
        show={showForm}
        onHide={() => {
          setShowForm(false)
          setSelectedOfficial(null)
        }}
        official={selectedOfficial}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        category={category}
      />
    </div>
  )
}
