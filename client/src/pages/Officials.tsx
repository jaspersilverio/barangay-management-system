import { useState, useEffect, useCallback, useMemo } from 'react'
import { Row, Col, Button, Alert } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import OfficialList from '../components/officials/OfficialList'
import OfficialForm from '../components/officials/OfficialForm'
import OfficialCard from '../components/officials/OfficialCard'
import {
  type Official,
  type CreateOfficialData,
  getOfficials,
  createOfficial,
  updateOfficial,
  deleteOfficial,
  toggleOfficialActive,
  getOfficialsListCached,
  setOfficialsListCached,
  OFFICIAL_POSITION_OPTIONS
} from '../services/officials.service'

const CACHE_PREFIX = 'officials:official'

function cacheKey(search: string, position: string, active: boolean | null): string {
  return `${CACHE_PREFIX}:${search}:${position}:${active === null ? '' : String(active)}`
}

export default function Officials() {
  const { user } = useAuth()
  const canManage = user?.role === 'admin'

  const [officials, setOfficials] = useState<Official[]>([])
  const [selectedOfficial, setSelectedOfficial] = useState<Official | null>(null)
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [filters, setFilters] = useState({
    search: '',
    position: '',
    active: null as boolean | null
  })

  const key = useMemo(
    () => cacheKey(filters.search, filters.position, filters.active),
    [filters.search, filters.position, filters.active]
  )

  const loadOfficials = useCallback(
    async (showLoading = true, cacheKeyArg?: string) => {
      const k = cacheKeyArg ?? key
      if (showLoading) {
        setLoading(true)
        setError(null)
      }
      try {
        const params: Record<string, string | boolean> = { category: 'official' }
        if (filters.search) params.search = filters.search
        if (filters.position) params.position = filters.position
        if (filters.active !== null) params.active = filters.active

        const response = await getOfficials(params)
        if (response.success) {
          const officialsData = response.data?.data ?? []
          setOfficials(officialsData)
          setOfficialsListCached(k, officialsData)
        } else {
          setError(response.message || 'Failed to load officials')
        }
      } catch {
        setError('Failed to load officials')
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [filters, key]
  )

  useEffect(() => {
    const cached = getOfficialsListCached<Official[]>(key)
    if (cached != null) {
      setOfficials(cached)
      setLoading(false)
      loadOfficials(false, key).catch(() => {})
      return
    }
    loadOfficials(true, key)
  }, [key, loadOfficials])

  // Handle form submission
  const handleFormSubmit = async (data: CreateOfficialData) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to create or edit officials.')
      return
    }

    try {
      setFormLoading(true)
      setError(null)

      // Ensure category is always 'official' for this page
      const submitData: CreateOfficialData = {
        ...data,
        category: 'official'
      }

      let response
      if (selectedOfficial) {
        response = await updateOfficial(selectedOfficial.id, submitData)
      } else {
        response = await createOfficial(submitData)
      }

      if (response.success) {
        setSuccess(selectedOfficial ? 'Official updated successfully' : 'Official created successfully')
        setShowForm(false)
        setSelectedOfficial(null)
        await loadOfficials(false)
      } else {
        setError(response.message || 'Failed to save official')
      }
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }).response : undefined
      if (res?.status === 422 && res?.data?.errors) {
        const errorMessages = Object.values(res.data.errors).flat().join(', ')
        setError(`Validation errors: ${errorMessages}`)
      } else if (res?.status === 403) {
        setError(res?.data?.message || 'You do not have permission to perform this action.')
      } else {
        setError(res?.data?.message || 'Failed to save official')
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Handle delete
  const handleDelete = async (id: number) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to delete officials.')
      return
    }

    if (!window.confirm('Are you sure you want to delete this official?')) {
      return
    }

    try {
      setError(null)
      const response = await deleteOfficial(id)
      
      if (response.success) {
        setSuccess('Official deleted successfully')
        loadOfficials()
        if (selectedOfficial?.id === id) {
          setSelectedOfficial(null)
        }
      } else {
        setError(response.message || 'Failed to delete official')
      }
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string } } }).response : undefined
      setError(res?.status === 403 ? (res?.data?.message || 'You do not have permission to delete officials.') : (res?.data?.message || 'Failed to delete official'))
    }
  }

  // Handle toggle active
  const handleToggleActive = async (id: number) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to change official status.')
      return
    }

    try {
      setError(null)
      const response = await toggleOfficialActive(id)
      
      if (response.success) {
        setSuccess('Official status updated successfully')
        loadOfficials()
        if (selectedOfficial?.id === id) {
          setSelectedOfficial(response.data)
        }
      } else {
        setError(response.message || 'Failed to update official status')
      }
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string } } }).response : undefined
      setError(res?.status === 403 ? (res?.data?.message || 'You do not have permission to change official status.') : (res?.data?.message || 'Failed to update official status'))
    }
  }

  // Handle edit
  const handleEdit = (official: Official) => {
    // Authorization check
    if (!canManage) {
      setError('You do not have permission to edit officials.')
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
          <h2 className="mb-1 text-brand-primary">Barangay Officials</h2>
          <p className="text-brand-muted mb-0">Manage barangay officials and their information</p>
        </div>
        <div className="d-flex align-items-center gap-2">
          {canManage && (
            <Button
              variant="primary"
              onClick={() => {
                setSelectedOfficial(null)
                setShowForm(true)
              }}
              className="btn-brand-primary"
            >
              ➕ Add Official
            </Button>
          )}
        </div>
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
        {/* Left Column - Officials List */}
        <Col lg={8}>
          <OfficialList
            positionOptions={OFFICIAL_POSITION_OPTIONS}
            officials={officials}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleActive={handleToggleActive}
            onSearch={handleSearch}
            onFilterPosition={handleFilterPosition}
            onFilterStatus={handleFilterStatus}
            canManage={canManage}
            canDelete={canManage}
          />
        </Col>

        {/* Right Column - Selected Official Details */}
        <Col lg={4}>
          <div className="sticky-top" style={{ top: '2rem' }}>
            {selectedOfficial ? (
              <div>
                <h5 className="mb-3 text-brand-primary">Official Details</h5>
                <OfficialCard official={selectedOfficial} />
              </div>
            ) : (
              <div className="bg-brand-surface rounded p-4 text-center">
                <div className="text-brand-muted mb-2">👤</div>
                <h6 className="text-brand-primary">Select an Official</h6>
                <p className="text-brand-muted small mb-0">
                  Click on an official from the list to view their details
                </p>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Official Form Modal */}
      <OfficialForm
        show={showForm}
        onHide={() => {
          setShowForm(false)
          setSelectedOfficial(null)
        }}
        official={selectedOfficial}
        onSubmit={handleFormSubmit}
        loading={formLoading}
        category="official"
      />
    </div>
  )
}
