import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Container, Button, ButtonGroup, Modal, Form, Row, Col } from 'react-bootstrap'
import { Stage, Layer, Line, Circle, Group } from 'react-konva'
import { useAuth } from '../context/AuthContext'
import MapService, { type MapMarker, type CreateMapMarkerData } from '../services/map.service'
import PurokBoundaryService, { type PurokBoundary } from '../services/purokBoundary.service'
import { type Purok } from '../services/puroks.service'
import MarkerSelectionPanel from '../components/map/MarkerSelectionPanel'
import MarkerInfoPopup from '../components/map/MarkerInfoPopup'
import HouseholdAssignmentModal from '../components/map/HouseholdAssignmentModal'
import AssignPurokModal from '../components/map/AssignPurokModal'
import PurokInfoModal from '../components/map/PurokInfoModal'
import DeleteBoundaryModal from '../components/map/DeleteBoundaryModal'
import MapSearch from '../components/map/MapSearch'
import MapLayers from '../components/map/MapLayers'
import MarkerLayerGroup from '../components/map/MarkerLayerGroup'
import { type SearchResult } from '../services/search.service'
import { getLayerState, getLayerConfig } from '../utils/layerConfig'

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

  // Drawing tool states
  const [isDrawingMode, setIsDrawingMode] = useState(false)
  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [isInfoMode, setIsInfoMode] = useState(false)
  const [currentPolygon, setCurrentPolygon] = useState<{ x: number; y: number }[]>([])
  
  // Purok selection states
  const [selectedPurok, setSelectedPurok] = useState<Purok | null>(null)
  const [availablePuroks, setAvailablePuroks] = useState<Purok[]>([])
  const [showPurokWarning, setShowPurokWarning] = useState(false)
  const [polygonToDelete, setPolygonToDelete] = useState<PurokBoundary | null>(null)
  const [boundaries, setBoundaries] = useState<PurokBoundary[]>([])
  const [selectedBoundary, setSelectedBoundary] = useState<PurokBoundary | null>(null)
  const [hoveredBoundary, setHoveredBoundary] = useState<number | null>(null)
  const stageRef = useRef<any>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  // Use original image dimensions for coordinate calculations to avoid zoom issues
  const originalImageDimensions = { width: 800, height: 600 }

  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showInfoModal, setShowInfoModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showPurokSelectionModal, setShowPurokSelectionModal] = useState(false)

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

  // Load markers and boundaries on component mount
  useEffect(() => {
    loadMarkers()
    loadBoundaries()
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

  const loadBoundaries = async () => {
    try {
      const data = await PurokBoundaryService.getBoundaries()
      setBoundaries(data)
      
      // Update available puroks (puroks without boundaries)
      await updateAvailablePuroks(data)
    } catch (error) {
      console.error('Error loading boundaries:', error)
    }
  }

  const updateAvailablePuroks = async (boundariesData: PurokBoundary[]) => {
    try {
      // Get all puroks from the dropdown
      const { getPuroks } = await import('../services/puroks.service')
      const response = await getPuroks({ per_page: 100 })
      const allPuroks = response.data.data
      
      // Find puroks that don't have boundaries assigned
      const assignedPurokIds = new Set(boundariesData.map(b => b.purok_id).filter(id => id !== null))
      const available = allPuroks.filter(purok => !assignedPurokIds.has(purok.id))
      
      setAvailablePuroks(available)
    } catch (error) {
      console.error('Error updating available puroks:', error)
      setAvailablePuroks([])
    }
  }


  const handleImageClick = (e: React.MouseEvent) => {
    // Close any open marker info popup
    setSelectedMarkerForInfo(null)
    
    // If in drawing mode, don't handle marker clicks
    if (isDrawingMode) {
      return
    }
    
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

  // Drawing tool functions
  const toggleDrawingMode = () => {
    if (isDrawingMode) {
      // Cancel current drawing
      setIsDrawingMode(false)
      setCurrentPolygon([])
      setSelectedPurok(null)
    } else {
      // Check if there are available puroks before allowing drawing
      if (availablePuroks.length === 0) {
        setShowPurokWarning(true)
        return
      }
      
      // Show purok selection modal instead of directly starting drawing
      setShowPurokSelectionModal(true)
    }
  }

  const handlePurokSelectionForDrawing = (purok: Purok) => {
    setSelectedPurok(purok)
    setShowPurokSelectionModal(false)
    
    // Start drawing mode
    setIsDrawingMode(true)
    setSelectedMarkerType(null) // Clear marker selection when entering drawing mode
    setIsDeleteMode(false) // Exit delete mode when entering drawing mode
    setIsInfoMode(false) // Exit info mode when entering drawing mode
    setShowPurokWarning(false) // Hide warning when starting drawing
  }

  const handleCancelPurokSelection = () => {
    setShowPurokSelectionModal(false)
  }


  const toggleDeleteMode = () => {
    setIsDeleteMode(!isDeleteMode)
    setIsDrawingMode(false) // Exit drawing mode when entering delete mode
    setIsInfoMode(false) // Exit info mode when entering delete mode
    setSelectedMarkerType(null)
    setPolygonToDelete(null) // Clear any selected polygon for deletion
  }

  const toggleInfoMode = () => {
    setIsInfoMode(!isInfoMode)
    setIsDrawingMode(false) // Exit drawing mode when entering info mode
    setIsDeleteMode(false) // Exit delete mode when entering info mode
    setSelectedMarkerType(null)
    setPolygonToDelete(null)
  }

  const handleStageClick = (e: any) => {
    // Only handle drawing if in drawing mode and clicked on empty space
    if (isDrawingMode && e.target === e.target.getStage()) {
      const stage = e.target.getStage()
      const point = stage.getPointerPosition()
      
      // Convert to percentage coordinates relative to the image dimensions
      // Note: Since the Stage is inside the transformed container, we don't need to account for zoom
      const x = (point.x / originalImageDimensions.width) * 100
      const y = (point.y / originalImageDimensions.height) * 100

      setCurrentPolygon(prev => [...prev, { x, y }])
    }
    // Marker placement is now handled by the image click handler
  }

  const completePolygon = useCallback(async () => {
    if (currentPolygon.length < 3) return // Need at least 3 points for a polygon
    if (!selectedPurok) return // Must have a selected purok

    try {
      const newBoundary = await PurokBoundaryService.createBoundary({
        points: currentPolygon,
        purok_id: selectedPurok.id
      })

      setBoundaries(prev => [...prev, newBoundary])
      setCurrentPolygon([])
      setIsDrawingMode(false)
      
      // Refresh boundaries to update available puroks
      await loadBoundaries()
    } catch (error) {
      console.error('Failed to save boundary:', error)
      // Still clear the current polygon even if save failed
      setCurrentPolygon([])
      setIsDrawingMode(false)
    }
  }, [currentPolygon, selectedPurok])



  const handleBoundaryHover = (boundaryId: number | null) => {
    setHoveredBoundary(boundaryId)
  }

  const handleBoundaryClick = (boundary: PurokBoundary) => {
    // Handle clicks based on current mode
    if (isDeleteMode) {
      setPolygonToDelete(boundary)
    } else if (isInfoMode) {
      // Show boundary info modal
      setSelectedBoundary(boundary)
      setShowInfoModal(true)
    }
  }


  // Function to confirm deletion of selected polygon
  const handleConfirmDelete = async () => {
    if (!polygonToDelete) return

    try {
      // Delete from backend
      await PurokBoundaryService.deleteBoundary(polygonToDelete.id)
      
      // Remove from local state
      setBoundaries(prev => prev.filter(b => b.id !== polygonToDelete.id))
      
      // Clear selection and exit delete mode
      setPolygonToDelete(null)
      setIsDeleteMode(false)
      
      // Refresh boundaries to update available puroks
      await loadBoundaries()
      
    } catch (error) {
      console.error('Failed to delete boundary:', error)
      alert('Failed to delete polygon. Please try again.')
    }
  }

  // Function to cancel deletion
  const handleCancelDelete = () => {
    setPolygonToDelete(null)
    setIsDeleteMode(false)
  }


  const handleDeleteBoundary = () => {
    setShowDeleteModal(true)
  }

  const handleBoundaryDeleted = () => {
    if (selectedBoundary) {
      setBoundaries(prev => prev.filter(b => b.id !== selectedBoundary.id))
      setSelectedBoundary(null)
    }
    loadBoundaries() // Refresh the list
  }

  const handleBoundaryAssigned = () => {
    loadBoundaries() // Refresh the list
  }

  // Keyboard event listener for completing polygons
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isDrawingMode && currentPolygon.length >= 3) {
        completePolygon()
      }
    }

    document.addEventListener('keydown', handleKeyPress)
    return () => document.removeEventListener('keydown', handleKeyPress)
  }, [isDrawingMode, currentPolygon.length, completePolygon])

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

            {/* Drawing Tools (Admin Only) */}
            {isAdmin && (
              <>
                <hr className="my-3" />
                <div>
                  <h6 className="mb-3 fw-bold">✏️ Drawing Tools</h6>
                  
                  <div className="d-grid gap-2 mb-3">
                    <Button 
                      variant={isDrawingMode ? "danger" : "outline-primary"}
                      onClick={toggleDrawingMode}
                      disabled={!isDrawingMode && availablePuroks.length === 0}
                      title={!isDrawingMode && availablePuroks.length === 0 ? "No available puroks to assign. Please add a purok first." : ""}
                    >
                      {isDrawingMode ? "🛑 Cancel Drawing" : "📐 Draw Purok"}
                    </Button>
                    
                    <Button 
                      variant={isDeleteMode ? "danger" : "outline-danger"}
                      onClick={toggleDeleteMode}
                      disabled={boundaries.length === 0}
                      className="mt-2"
                    >
                      {isDeleteMode ? "🛑 Cancel Delete" : "🗑️ Delete Purok"}
                    </Button>
                    
                    <Button 
                      variant={isInfoMode ? "info" : "outline-info"}
                      onClick={toggleInfoMode}
                      disabled={boundaries.length === 0}
                      className="mt-2"
                    >
                      {isInfoMode ? "🛑 Cancel Info" : "ℹ️ View Purok Info"}
                    </Button>
                    
                    {isDeleteMode && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Click on a polygon to delete it
                        </small>
                      </div>
                    )}
                    
                    {isInfoMode && (
                      <div className="text-center mt-2">
                        <small className="text-muted">
                          Click on a polygon to view its info
                        </small>
                      </div>
                    )}
                  </div>

                  {boundaries.length > 0 && (
                    <div className="text-center mb-3">
                      <small className="text-muted">
                        {boundaries.length} boundary{boundaries.length !== 1 ? 'ies' : ''} drawn
                      </small>
                    </div>
                  )}


                  {isDrawingMode && (
                    <div className="text-center">
                      <small className="text-muted">
                        Click to add points • Double-click to complete
                      </small>
                      {currentPolygon.length > 0 && (
                        <div className="mt-2">
                          <Button 
                            variant="success" 
                            size="sm"
                            onClick={completePolygon}
                            disabled={currentPolygon.length < 3}
                          >
                            Complete Polygon ({currentPolygon.length} points)
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </>
            )}
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
                  cursor: isDrawingMode ? 'crosshair' : (selectedMarkerType ? 'crosshair' : (isDragging ? 'grabbing' : 'grab'))
                }}
                onMouseDown={handleMouseDown}
              >
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                  <img 
                    ref={imageRef}
                    src="/barangay map.svg" 
                    alt="Barangay Sketch Map"
                    style={{ 
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      cursor: isDrawingMode ? 'crosshair' : (selectedMarkerType ? 'crosshair' : (isDragging ? 'grabbing' : 'grab')),
                      userSelect: 'none'
                    }}
                    onClick={handleImageClick}
                    onLoad={() => {
                      console.log('Image loaded successfully!')
                    }}
                    onError={(e) => console.error('Image failed to load:', e)}
                    draggable={false}
                  />
                  
                  {/* Konva Stage for drawing polygons - positioned to overlay the image */}
                  <Stage
                    ref={stageRef}
                    width={originalImageDimensions.width}
                    height={originalImageDimensions.height}
                    style={{ 
                      position: 'absolute', 
                      top: 0, 
                      left: 0, 
                      pointerEvents: (isDrawingMode || isInfoMode || isDeleteMode) ? 'auto' : 'none', // Allow interactions when drawing, viewing info, or deleting
                      zIndex: 100
                    }}
                    onClick={handleStageClick}
                    onDblClick={completePolygon}
                  >
                    <Layer>
                      {/* Render saved boundaries */}
                      {boundaries.map((boundary) => {
                        // Convert percentage coordinates to pixel coordinates based on original image dimensions
                        const points = boundary.points.flatMap(p => [
                          (p.x / 100) * originalImageDimensions.width,
                          (p.y / 100) * originalImageDimensions.height
                        ])
                        const isHovered = hoveredBoundary === boundary.id
                        const isSelected = selectedPurok && boundary.purok_id === selectedPurok.id
                        
                        // Color based on purok assignment and selection
                        let fillColor, strokeColor, strokeWidth
                        
                        if (isSelected) {
                          // Highlighted selected purok - bright colors
                          fillColor = "rgba(168, 85, 247, 0.3)" // Bright purple for selected
                          strokeColor = "#a855f7" // Purple stroke
                          strokeWidth = 3
                        } else if (isHovered) {
                          // Hover state - slightly brighter
                          fillColor = boundary.purok_id 
                            ? "rgba(34, 197, 94, 0.15)" // Slightly more opaque green
                            : "rgba(59, 130, 246, 0.15)" // Slightly more opaque blue
                          strokeColor = "#f59e0b" // Orange on hover
                          strokeWidth = 2
                        } else {
                          // Default state - very muted colors for non-selected
                          fillColor = boundary.purok_id 
                            ? "rgba(34, 197, 94, 0.03)" // Very light green for assigned
                            : "rgba(59, 130, 246, 0.03)" // Very light blue for unassigned
                          strokeColor = boundary.purok_id 
                            ? "rgba(34, 197, 94, 0.3)" // Muted green for assigned
                            : "rgba(59, 130, 246, 0.3)" // Muted blue for unassigned
                          strokeWidth = 1
                        }
                        
                        return (
                          <Group key={boundary.id}>
                            <Line
                              points={points}
                              closed
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={strokeWidth}
                              onClick={() => handleBoundaryClick(boundary)}
                              onMouseEnter={() => handleBoundaryHover(boundary.id)}
                              onMouseLeave={() => handleBoundaryHover(null)}
                            />
                          </Group>
                        )
                      })}
                      
                      {/* Render current drawing polygon */}
                      {currentPolygon.length > 0 && (
                        <Group>
                          <Line
                            points={currentPolygon.flatMap(p => [
                              (p.x / 100) * originalImageDimensions.width,
                              (p.y / 100) * originalImageDimensions.height
                            ])}
                            stroke="#10b981"
                            strokeWidth={2}
                            dash={[5, 5]}
                          />
                          {/* Render points */}
                          {currentPolygon.map((point, index) => (
                            <Circle
                              key={index}
                              x={(point.x / 100) * originalImageDimensions.width}
                              y={(point.y / 100) * originalImageDimensions.height}
                              radius={4}
                              fill="#10b981"
                              stroke="#ffffff"
                              strokeWidth={2}
                            />
                          ))}
                        </Group>
                      )}
                    </Layer>
                  </Stage>
                  
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

        {/* Right Sidebar - Marker Selection */}
        <div style={{ width: '300px', flexShrink: 0 }}>
          <MarkerSelectionPanel
            selectedMarkerType={selectedMarkerType}
            onMarkerTypeSelect={setSelectedMarkerType}
            isAdmin={isAdmin}
          />
        </div>
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

      {/* Assign Purok Modal */}
      <AssignPurokModal
        show={showAssignModal}
        onHide={() => {
          setShowAssignModal(false)
          setSelectedBoundary(null)
        }}
        boundary={selectedBoundary}
        onAssigned={handleBoundaryAssigned}
      />

      {/* Purok Info Modal */}
      <PurokInfoModal
        show={showInfoModal}
        onHide={() => {
          setShowInfoModal(false)
          setSelectedBoundary(null)
        }}
        boundary={selectedBoundary}
        onDelete={handleDeleteBoundary}
        isAdmin={isAdmin}
      />

      {/* Delete Boundary Modal */}
      <DeleteBoundaryModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false)
          setSelectedBoundary(null)
        }}
        boundary={selectedBoundary}
        onDeleted={handleBoundaryDeleted}
      />

      {/* Purok Warning Modal */}
      <Modal show={showPurokWarning} onHide={() => setShowPurokWarning(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>⚠️ Cannot Create Polygon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <p className="mb-3">
              <strong>No available puroks to assign.</strong>
            </p>
            <p className="text-muted">
              All puroks already have boundaries assigned. Please add a new purok first before creating a polygon.
            </p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowPurokWarning(false)}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={!!polygonToDelete} onHide={handleCancelDelete} centered>
        <Modal.Header closeButton>
          <Modal.Title>🗑️ Delete Polygon</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            <strong>Are you sure you want to delete this polygon?</strong>
          </p>
          <p className="text-muted">
            {polygonToDelete?.purok_id ? 
              `This polygon is assigned to purok ID ${polygonToDelete.purok_id}.` :
              'This is an unassigned polygon.'
            }
          </p>
          <p className="text-muted">
            <strong>Warning:</strong> This will permanently delete the polygon from the database. The purok will become available for new polygon creation.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelDelete}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleConfirmDelete}>
            Delete Polygon
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Purok Selection Modal for Drawing */}
      <Modal show={showPurokSelectionModal} onHide={handleCancelPurokSelection} centered>
        <Modal.Header closeButton>
          <Modal.Title>📐 Select Purok for Boundary</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="mb-3">
            <strong>Choose a purok to assign to the new boundary:</strong>
          </p>
          <div className="list-group">
            {availablePuroks.map((purok) => (
              <button
                key={purok.id}
                type="button"
                className="list-group-item list-group-item-action"
                onClick={() => handlePurokSelectionForDrawing(purok)}
              >
                <div className="d-flex w-100 justify-content-between">
                  <h6 className="mb-1">{purok.name}</h6>
                </div>
                <p className="mb-1 text-muted">
                  {purok.captain ? `Leader: ${purok.captain}` : 'No leader assigned'}
                </p>
                {purok.contact && (
                  <small className="text-muted">Contact: {purok.contact}</small>
                )}
              </button>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancelPurokSelection}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}
