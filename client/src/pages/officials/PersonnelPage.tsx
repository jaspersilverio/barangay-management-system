import { useState, useEffect, useCallback, useMemo } from 'react'
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
  getOfficialsListCached,
  setOfficialsListCached,
  OFFICIAL_POSITION_OPTIONS,
  SK_POSITION_OPTIONS
} from '../../services/officials.service'

interface PersonnelPageProps {
  category: 'official' | 'sk' | 'tanod' | 'bhw' | 'staff'
  title: string
  description: string
  addButtonLabel: string
}

function cacheKey(cat: string, search: string, position: string, active: boolean | null): string {
  return `officials:${cat}:${search}:${position}:${active === null ? '' : String(active)}`
}

export default function PersonnelPage({
  category,
  title,
  description,
  addButtonLabel
}: PersonnelPageProps) {
  const { user } = useAuth()
  const canManage = user?.role === 'admin' || user?.role === 'captain' || user?.role === 'staff'
  const canDelete = user?.role === 'admin' || user?.role === 'captain'

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
    () => cacheKey(category, filters.search, filters.position, filters.active),
    [category, filters.search, filters.position, filters.active]
  )

  const loadOfficials = useCallback(
    async (showLoading = true, cacheKeyArg?: string) => {
      const k = cacheKeyArg ?? key
      if (showLoading) {
        setLoading(true)
        setError(null)
      }
      try {
        const params: Record<string, string | boolean> = { category }
        if (filters.search) params.search = filters.search
        if (filters.position) params.position = filters.position
        if (filters.active !== null) params.active = filters.active

        const response = await getOfficials(params)
        if (response.success) {
          const officialsData = response.data?.data ?? []
          setOfficials(officialsData)
          setOfficialsListCached(k, officialsData)
        } else {
          setError(response.message || 'Failed to load personnel')
        }
      } catch {
        setError('Failed to load personnel')
      } finally {
        if (showLoading) setLoading(false)
      }
    },
    [category, filters, key]
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
        await loadOfficials(false)
      } else {
        setError(response.message || 'Failed to save personnel')
      }
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { errors?: Record<string, string[]>; message?: string } } }).response : undefined
      if (res?.status === 422 && res?.data?.errors) {
        const errorMessages = Object.values(res.data.errors).flat().join(', ')
        setError(`Validation errors: ${errorMessages}`)
      } else if (res?.status === 403) {
        setError(res?.data?.message || 'You do not have permission to perform this action.')
      } else {
        setError(res?.data?.message || 'Failed to save personnel')
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
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string } } }).response : undefined
      setError(res?.status === 403 ? (res?.data?.message || 'You do not have permission to delete personnel.') : (res?.data?.message || 'Failed to delete personnel'))
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
    } catch (err: unknown) {
      const res = err && typeof err === 'object' && 'response' in err ? (err as { response?: { status?: number; data?: { message?: string } } }).response : undefined
      setError(res?.status === 403 ? (res?.data?.message || 'You do not have permission to change personnel status.') : (res?.data?.message || 'Failed to update personnel status'))
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
              ➕ {addButtonLabel}
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
