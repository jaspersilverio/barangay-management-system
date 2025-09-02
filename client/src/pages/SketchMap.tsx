import React, { useState, useEffect } from 'react'
import { Container, Button, ButtonGroup, Modal, Form, Row, Col } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import MapService, { type MapMarker, type CreateMapMarkerData } from '../services/map.service'
import MarkerSelectionPanel from '../components/map/MarkerSelectionPanel'
import MarkerInfoPopup from '../components/map/MarkerInfoPopup'
import HouseholdAssignmentModal from '../components/map/HouseholdAssignmentModal'
import MapSearch from '../components/map/MapSearch'
import MapLayers from '../components/map/MapLayers'
import MarkerLayerGroup from '../components/map/MarkerLayerGroup'
import { type SearchResult } from '../services/search.service'
import { getVisibleMarkers, getLayerState, getLayerConfig } from '../utils/layerConfig'

export default function SketchMap() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  const [clickPosition, setClickPosition] = useState<{ x: number; y: number } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1) // Start at 1x (full size)
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [markers, setMarkers] = useState<MapMarker[]>([])
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(true)
  const [selectedMarkerType, setSelectedMarkerType] = useState<string | null>(null)
  const [selectedMarkerForInfo, setSelectedMarkerForInfo] = useState<MapMarker | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showHouseholdModal, setShowHouseholdModal] = useState(false)
  const [selectedMarkerForHousehold, setSelectedMarkerForHousehold] = useState<MapMarker | null>(null)
  const [newMarker, setNewMarker] = useState({
    name: '',
    type: 'household',
    description: ''
  })

  // Search and highlighting states
  const [highlightedMarker, setHighlightedMarker] = useState<MapMarker | null>(null)
  const [mapLayers, setMapLayers] = useState(getLayerState())

  // Marker type options for dropdowns
  const markerTypeOptions = [
    { value: 'household', label: '🏠 Household' },
    { value: 'barangay_hall', label: '🏛️ Barangay Hall' },
    { value: 'chapel', label: '⛪ Chapel' },
    { value: 'church', label: '✝️ Church' },
    { value: 'school', label: '🏫 School' },
    { value: 'health_center', label: '🏥 Health Center' },
    { value: 'evacuation_center', label: '🚨 Evacuation Center' },
    { value: 'poi', label: '📍 Point of Interest' },
    { value: 'purok_boundary', label: '🗺️ Purok Boundary' },
    { value: 'settlement_zone', label: '🏘️ Settlement Zone' },
    { value: 'hazard_zone', label: '⚠️ Hazard Zone' },
    { value: 'primary_road', label: '🛣️ Primary Road' },
    { value: 'waterway', label: '🌊 Waterway' },
  ]

  // Load markers on component mount
  useEffect(() => {
    loadMarkers()
  }, [])

  const loadMarkers = async () => {
    setIsLoadingMarkers(true)
    try {
      const data = await MapService.getMarkers()
      setMarkers(data)
    } catch (error) {
      console.error('Failed to load markers:', error)
    } finally {
      setIsLoadingMarkers(false)
    }
  }

  const handleImageClick = (e: React.MouseEvent) => {
    // Close any open marker info popup
    setSelectedMarkerForInfo(null)
    
    // Only allow adding markers if a marker type is selected
    if (!selectedMarkerType) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setClickPosition({ x, y })
    setNewMarker(prev => ({ ...prev, type: selectedMarkerType }))
    setShowModal(true)
  }

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 5)) // Max zoom 5x (increased from 3x)
  }

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 1)) // Min zoom 1x (no zoom out)
  }

  const handleResetZoom = () => {
    setZoomLevel(1)
    setImagePosition({ x: 0, y: 0 })
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Allow dragging at any zoom level
    // Prevent click events from firing when starting drag
    e.preventDefault()
    
    setIsDragging(true)
    
    const startX = e.clientX - imagePosition.x
    const startY = e.clientY - imagePosition.y
    
    const handleMouseMove = (e: MouseEvent) => {
      setImagePosition({
        x: e.clientX - startX,
        y: e.clientY - startY
      })
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleAddMarker = async () => {
    if (clickPosition && newMarker.name.trim()) {
      const markerData: CreateMapMarkerData = {
        name: newMarker.name,
        type: newMarker.type,
        description: newMarker.description,
        x_position: clickPosition.x,
        y_position: clickPosition.y
      }

      try {
        const newMarkerData = await MapService.createMarker(markerData)
        
        if (newMarkerData) {
          setMarkers(prev => {
            const updated = [...prev, newMarkerData]
            return updated
          })
        } else {
          // Offline mode - add to local state
          const tempMarker: MapMarker = {
            id: Date.now(), // Temporary ID
            ...markerData,
            created_by: user?.id || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            creator: user ? { id: user.id, name: user.name } : undefined,
          }
          setMarkers(prev => {
            const updated = [...prev, tempMarker]
            return updated
          })
        }
      } catch (error) {
        console.error('Error in handleAddMarker:', error)
      }
      
      setNewMarker({ name: '', type: 'household', description: '' })
      setShowModal(false)
      setClickPosition(null)
      setSelectedMarkerForInfo(null) // Close any open marker info
    } else {
      if (!clickPosition) console.log('No click position')
      if (!newMarker.name.trim()) console.log('No marker name')
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setClickPosition(null)
    setNewMarker({ name: '', type: 'household', description: '' })
    setSelectedMarkerType(null)
    setSelectedMarkerForInfo(null) // Close any open marker info
  }

  const handleHouseholdAssigned = (updatedMarker: MapMarker) => {
    setMarkers(prev => prev.map(marker =>
      marker.id === updatedMarker.id ? updatedMarker : marker
    ))
  }

  // Search result handler
  const handleSearchResultSelect = (result: SearchResult) => {
    if (result.x_position && result.y_position) {
      // Center and zoom to the location
      setImagePosition({ x: 0, y: 0 }) // Reset position
      setZoomLevel(3) // Zoom in to 3x
      
      // Find and highlight the corresponding marker
      const marker = markers.find(m => 
        m.x_position === result.x_position && 
        m.y_position === result.y_position
      )
      
      if (marker) {
        setHighlightedMarker(marker)
        // Remove highlight after 3 seconds
        setTimeout(() => setHighlightedMarker(null), 3000)
      }
    }
  }

  // Layer toggle handler
  const handleLayerToggle = (layer: string, enabled: boolean) => {
    setMapLayers(prev => ({ ...prev, [layer]: enabled }))
  }

  const handleMarkerClick = (e: React.MouseEvent, marker: MapMarker) => {
    e.stopPropagation() // Prevent map click
    
    // If it's a household marker and user is admin, show household assignment modal
    if (marker.type === 'household' && isAdmin) {
      setSelectedMarkerForHousehold(marker)
      setShowHouseholdModal(true)
      setSelectedMarkerForInfo(null) // Close any open info popup
      return
    }
    
    // For other markers or non-admin users, show info popup
    if (selectedMarkerForInfo?.id === marker.id) {
      setSelectedMarkerForInfo(null)
    } else {
      setSelectedMarkerForInfo(marker)
    }
  }

  return (
    <Container fluid className="p-4">
      <div className="d-flex gap-4" style={{ minHeight: '80vh' }}>
        {/* Left Sidebar - Controls */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          {/* Search and Zoom Controls Group */}
          <div className="bg-white rounded border p-3 mb-3">
            <MapSearch onResultSelect={handleSearchResultSelect} />
            
            <hr className="my-3" />
            
            {/* Zoom Controls */}
            <div>
              <h6 className="mb-3 fw-bold">🔍 Zoom Controls</h6>
              <ButtonGroup className="w-100 mb-2">
                <Button variant="outline-primary" onClick={handleZoomOut} disabled={zoomLevel <= 1}>
                  🔍-
                </Button>
                <Button variant="outline-primary" onClick={handleResetZoom}>
                  🔄 Reset
                </Button>
                <Button variant="outline-primary" onClick={handleZoomIn} disabled={zoomLevel >= 5}>
                  🔍+
                </Button>
              </ButtonGroup>
              <div className="text-center">
                <small className="text-muted">
                  Zoom: {(zoomLevel * 100).toFixed(0)}% (1x - 5x)
                </small>
              </div>
            </div>
          </div>

          {/* Map Layers */}
          <MapLayers 
            onLayerToggle={handleLayerToggle} 
            markers={markers}
          />
        </div>

        {/* Main Map Area */}
        <div className="flex-grow-1">
          <div className="d-flex justify-content-center align-items-center h-100">
            {/* Map Container */}
            <div 
              style={{ 
                border: '2px solid #e9ecef', 
                borderRadius: '8px', 
                padding: '20px',
                backgroundColor: '#f8f9fa',
                position: 'relative',
                overflow: 'hidden',
                height: '80vh',
                width: '100%',
                maxWidth: '1200px',
                maxHeight: '800px'
              }}
            >
              <div
                style={{
                  position: 'relative',
                  transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${zoomLevel})`,
                  transformOrigin: 'center',
                  transition: 'transform 0.1s ease-out',
                  cursor: selectedMarkerType ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')
                }}
                onMouseDown={handleMouseDown}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img 
                    src="/barangay map.svg" 
                    alt="Barangay Sketch Map"
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      cursor: selectedMarkerType ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'),
                      userSelect: 'none'
                    }}
                    onClick={handleImageClick}
                    onLoad={() => console.log('Image loaded successfully!')}
                    onError={(e) => console.error('Image failed to load:', e)}
                    draggable={false}
                  />
                  
                  {/* Layer Groups */}
                  {getLayerConfig().map((layer) => (
                    <MarkerLayerGroup
                      key={layer.id}
                      markers={markers}
                      layerId={layer.id}
                      isVisible={mapLayers[layer.id] !== false}
                      highlightedMarker={highlightedMarker}
                      onMarkerClick={handleMarkerClick}
                      selectedMarkerForInfo={selectedMarkerForInfo}
                      isAdmin={isAdmin}
                    />
                  ))}

                  {/* Info Popup for selected marker */}
                  {selectedMarkerForInfo && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${selectedMarkerForInfo.x_position}%`,
                        top: `${selectedMarkerForInfo.y_position}%`,
                        transform: 'translate(-50%, -50%)',
                        zIndex: 200,
                        pointerEvents: 'auto'
                      }}
                    >
                      <MarkerInfoPopup
                        marker={selectedMarkerForInfo}
                        onClose={() => setSelectedMarkerForInfo(null)}
                        isAdmin={isAdmin}
                      />
                    </div>
                  )}
                </div>
                
                {/* Loading overlay */}
                {isLoadingMarkers && (
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Marker Selection (Admin Only) */}
        {isAdmin && (
          <div style={{ width: '300px', flexShrink: 0 }}>
            <MarkerSelectionPanel
              selectedMarkerType={selectedMarkerType}
              onMarkerTypeSelect={setSelectedMarkerType}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>

      {/* Add Marker Modal */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>
            Add New {selectedMarkerType ? markerTypeOptions.find(opt => opt.value === selectedMarkerType)?.label.replace(/^[^\s]*\s/, '') : 'Marker'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label>Name *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter marker name"
                    value={newMarker.name}
                    onChange={(e) => setNewMarker(prev => ({ ...prev, name: e.target.value }))}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Enter description (optional)"
                value={newMarker.description}
                onChange={(e) => setNewMarker(prev => ({ ...prev, description: e.target.value }))}
              />
            </Form.Group>
            {clickPosition && (
              <div className="p-2 bg-light rounded">
                <small>Position: X: {clickPosition.x.toFixed(1)}%, Y: {clickPosition.y.toFixed(1)}%</small>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleAddMarker}
            disabled={!newMarker.name.trim()}
          >
            Add Marker
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Household Assignment Modal */}
      <HouseholdAssignmentModal
        show={showHouseholdModal}
        onHide={() => {
          setShowHouseholdModal(false)
          setSelectedMarkerForHousehold(null)
        }}
        marker={selectedMarkerForHousehold}
        isAdmin={isAdmin}
        onHouseholdAssigned={handleHouseholdAssigned}
      />
    </Container>
  )
}
