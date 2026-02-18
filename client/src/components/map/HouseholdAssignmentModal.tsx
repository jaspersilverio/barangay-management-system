import { useState, useEffect } from 'react'
import { Modal, Form, Button, Table, Badge, Spinner } from 'react-bootstrap'
import { type MapMarker } from '../../services/map.service'
import { type HouseholdOption, getHouseholdsForResidentForm } from '../../services/households.service'
import { deleteResident } from '../../services/residents.service'
import { useDashboard } from '../../context/DashboardContext'
import MapService from '../../services/map.service'
import ResidentFormModal from './ResidentFormModal'
import ResidentProfileModal from './ResidentProfileModal'

interface HouseholdAssignmentModalProps {
  show: boolean
  onHide: () => void
  marker: MapMarker | null
  isAdmin: boolean
  onHouseholdAssigned: (marker: MapMarker) => void
  onMarkerDeleted?: (markerId: number) => void
}

export default function HouseholdAssignmentModal({
  show,
  onHide,
  marker,
  isAdmin,
  onHouseholdAssigned,
  onMarkerDeleted
}: HouseholdAssignmentModalProps) {
  const { refreshData: refreshDashboard } = useDashboard()
  const [households, setHouseholds] = useState<HouseholdOption[]>([])
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [markerWithHousehold, setMarkerWithHousehold] = useState<MapMarker | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  
  // Resident management states
  const [showResidentForm, setShowResidentForm] = useState(false)
  const [showResidentProfile, setShowResidentProfile] = useState(false)
  const [editingResidentId, setEditingResidentId] = useState<number | null>(null)
  const [viewingResidentId, setViewingResidentId] = useState<number | null>(null)
  const [isDeletingResident, setIsDeletingResident] = useState<number | null>(null)

  // Load marker with household details when modal opens
  useEffect(() => {
    if (show && marker) {
      loadMarkerWithHousehold()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show, marker?.id])

  // Load households for assignment
  useEffect(() => {
    if (show && isAdmin) {
      loadHouseholds()
    }
  }, [show, isAdmin, searchTerm])

  const loadMarkerWithHousehold = async (): Promise<MapMarker | null> => {
    if (!marker) return null
    
    setIsLoading(true)
    try {
      const markerData = await MapService.getMarkerWithHousehold(marker.id)
      if (markerData) {
        setMarkerWithHousehold(markerData)
        return markerData
      }
      return null
    } catch (error) {
      console.error('Failed to load marker with household:', error)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  const loadHouseholds = async () => {
    try {
      const response = await getHouseholdsForResidentForm({ search: searchTerm })
      if (response.success) {
        setHouseholds(response.data)
      }
    } catch (error) {
      console.error('Failed to load households:', error)
    }
  }

  const handleAssignHousehold = async () => {
    if (!marker || !selectedHouseholdId) return

    setIsAssigning(true)
    try {
      const updatedMarker = await MapService.assignHousehold(marker.id, parseInt(selectedHouseholdId))
      if (updatedMarker) {
        setMarkerWithHousehold(updatedMarker)
        onHouseholdAssigned(updatedMarker)
        setSelectedHouseholdId('')
        setSearchTerm('')
        setShowDropdown(false)
      }
    } catch (error) {
      console.error('Failed to assign household:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveHousehold = async () => {
    if (!marker) return

    if (!window.confirm('Are you sure you want to remove the household assignment?')) {
      return
    }

    setIsAssigning(true)
    try {
      const updatedMarker = await MapService.removeHousehold(marker.id)
      if (updatedMarker) {
        setMarkerWithHousehold(updatedMarker)
        onHouseholdAssigned(updatedMarker)
      }
    } catch (error) {
      console.error('Failed to remove household assignment:', error)
    } finally {
      setIsAssigning(false)
    }
  }

  const handleHouseholdSelect = (household: HouseholdOption) => {
    setSelectedHouseholdId(household.id.toString())
    setSearchTerm(household.label)
    setShowDropdown(false)
  }

  const filteredHouseholds = households.filter(household =>
    household.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Resident management functions
  const handleAddResident = () => {
    setEditingResidentId(null)
    setShowResidentForm(true)
  }

  const handleEditResident = (residentId: number) => {
    setEditingResidentId(residentId)
    setShowResidentForm(true)
  }

  const handleViewResident = (residentId: number) => {
    setViewingResidentId(residentId)
    setShowResidentProfile(true)
  }

  const handleDeleteResident = async (residentId: number) => {
    if (!window.confirm('Are you sure you want to delete this resident? This action cannot be undone.')) {
      return
    }

    setIsDeletingResident(residentId)
    try {
      await deleteResident(residentId)
      await refreshDashboard()
      // Reload marker with household data to refresh the residents list
      const updatedMarker = await loadMarkerWithHousehold()
      if (updatedMarker) {
        onHouseholdAssigned(updatedMarker)
      }
    } catch (error: any) {
      console.error('Failed to delete resident:', error)
      alert(error?.response?.data?.message || 'Failed to delete resident')
    } finally {
      setIsDeletingResident(null)
    }
  }

  const handleResidentSaved = async () => {
    // Reset editing state
    setEditingResidentId(null)
    // Reload marker with household data to refresh the residents list
    const updatedMarker = await loadMarkerWithHousehold()
    if (updatedMarker) {
      onHouseholdAssigned(updatedMarker)
    }
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {marker?.name} - Household Assignment
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {isLoading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading marker details...</p>
          </div>
        ) : (
          <div>
            {/* Current Household Assignment */}
            {markerWithHousehold?.household ? (
              <div className="mb-4">
                <h6 className="text-success mb-3">
                  ✅ Currently Assigned Household
                </h6>
                <div className="card border-success">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <p><strong>Head:</strong> {markerWithHousehold.household.head_name}</p>
                        <p><strong>Address:</strong> {markerWithHousehold.household.address}</p>
                        <p><strong>Contact:</strong> {markerWithHousehold.household.contact}</p>
                      </div>
                      <div className="col-md-6">
                        <p><strong>Property Type:</strong> {markerWithHousehold.household.property_type}</p>
                        <p><strong>Residents:</strong> {markerWithHousehold.household.residents?.length || 0}</p>
                      </div>
                    </div>

                    {/* Residents List */}
                    {markerWithHousehold.household.residents && markerWithHousehold.household.residents.length > 0 && (
                      <div className="mt-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h6>Residents ({markerWithHousehold.household.residents.length})</h6>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={handleAddResident}
                          >
                            ➕ Add Resident
                          </Button>
                        </div>
                        <div className="table-responsive">
                          <Table size="sm" striped bordered>
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Age</th>
                                <th>Sex</th>
                                <th>Relationship</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {markerWithHousehold.household.residents.map((resident) => (
                                <tr key={resident.id}>
                                  <td className="text-brand-primary">{resident.full_name || `${resident.first_name} ${resident.last_name}`.trim()}</td>
                                  <td className="text-brand-primary">{resident.age || 'N/A'}</td>
                                  <td>
                                    <Badge bg={resident.sex === 'male' ? 'primary' : 'secondary'}>
                                      {resident.sex}
                                    </Badge>
                                  </td>
                                  <td className="text-brand-primary">{resident.relationship_to_head}</td>
                                  <td>
                                    <Badge bg={resident.is_pwd ? 'warning' : 'success'}>
                                      {resident.is_pwd ? 'PWD' : resident.occupation_status}
                                    </Badge>
                                  </td>
                                  <td>
                                    <div className="btn-group btn-group-sm" role="group">
                                      <Button
                                        variant="outline-info"
                                        size="sm"
                                        onClick={() => handleViewResident(resident.id)}
                                        title="View Profile"
                                      >
                                        👁️
                                      </Button>
                                      <Button
                                        variant="outline-warning"
                                        size="sm"
                                        onClick={() => handleEditResident(resident.id)}
                                        title="Edit Resident"
                                      >
                                        ✏️
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDeleteResident(resident.id)}
                                        disabled={isDeletingResident === resident.id}
                                        title="Delete Resident"
                                      >
                                        {isDeletingResident === resident.id ? (
                                          <Spinner animation="border" size="sm" />
                                        ) : (
                                          '🗑️'
                                        )}
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </Table>
                        </div>
                      </div>
                    )}

                    {/* Add Resident button when no residents */}
                    {(!markerWithHousehold.household.residents || markerWithHousehold.household.residents.length === 0) && (
                      <div className="mt-3 text-center">
                        <p className="text-muted mb-3">No residents found in this household.</p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleAddResident}
                        >
                          ➕ Add First Resident
                        </Button>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="mt-3">
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={handleRemoveHousehold}
                          disabled={isAssigning}
                        >
                          {isAssigning ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-2" />
                              Removing...
                            </>
                          ) : (
                            'Remove Household Assignment'
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <h6 className="text-muted mb-3">
                  ⚠️ No Household Assigned
                </h6>
                <p className="text-muted">
                  This marker is not currently assigned to any household.
                </p>
              </div>
            )}

            {/* Assign New Household (Admin Only) */}
            {isAdmin && (
              <div>
                <h6 className="mb-3">Assign Household</h6>
                <Form.Group className="mb-3 position-relative">
                  <Form.Label>Search & Select Household</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Search by address, head name, or contact..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setShowDropdown(true)
                    }}
                    onClick={() => setShowDropdown(true)}
                    onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                  />
                  
                  {/* Dropdown */}
                  {showDropdown && filteredHouseholds.length > 0 && (
                    <div 
                      className="dropdown-menu show w-100" 
                      style={{ 
                        position: 'absolute', 
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto'
                      }}
                    >
                      {filteredHouseholds.map((household) => (
                        <div
                          key={household.id}
                          className="dropdown-item"
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleHouseholdSelect(household)}
                          onMouseDown={(e) => e.preventDefault()}
                        >
                          {household.label}
                        </div>
                      ))}
                    </div>
                  )}
                </Form.Group>

                {selectedHouseholdId && (
                  <Button
                    variant="primary"
                    onClick={handleAssignHousehold}
                    disabled={isAssigning}
                    className="mt-2"
                  >
                    {isAssigning ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Household'
                    )}
                  </Button>
                )}

                {searchTerm && filteredHouseholds.length === 0 && (
                  <p className="text-muted">
                    No households found matching your search.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {isAdmin && marker && (
          <Button
            variant="outline-danger"
            onClick={async () => {
              if (window.confirm(`Are you sure you want to delete the marker "${marker.name}"? This will remove the marker from the map but will not delete the associated household.`)) {
                try {
                  const success = await MapService.deleteMarker(marker.id)
                  if (success) {
                    if (onMarkerDeleted) {
                      onMarkerDeleted(marker.id)
                    }
                    onHide()
                  } else {
                    alert('Failed to delete marker. Please try again.')
                  }
                } catch (error) {
                  console.error('Error deleting marker:', error)
                  alert('Failed to delete marker. Please try again.')
                }
              }
            }}
            className="me-auto"
          >
            🗑️ Delete Marker
          </Button>
        )}
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
       {/* Resident Form Modal */}
       <ResidentFormModal
         show={showResidentForm}
         onHide={() => {
           setShowResidentForm(false)
           setEditingResidentId(null)
         }}
         householdId={markerWithHousehold?.household?.id || 0}
         editingResidentId={editingResidentId}
         onResidentSaved={handleResidentSaved}
       />

       {/* Resident Profile Modal */}
       <ResidentProfileModal
         show={showResidentProfile}
         onHide={() => setShowResidentProfile(false)}
         residentId={viewingResidentId || 0}
       />
    </Modal>
  )
}
