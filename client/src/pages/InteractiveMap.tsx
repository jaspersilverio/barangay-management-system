import { useEffect, useMemo, useRef, useState } from 'react'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { MapContainer, TileLayer, FeatureGroup, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { LatLngExpression } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import { useAuth } from '../context/AuthContext'
import MapToolbar from '../components/MapToolbar'
import MapLegend from '../components/MapLegend'
import { icons } from '../lib/mapIcons'
import type { MarkerType } from '../lib/mapIcons'
import { loadFromLocalStorage, saveToLocalStorage, exportAsBlob, importFromFile } from '../lib/mapStore'
import type { GeoJSONFeatureCollection } from '../lib/mapStore'
import type { GeoJSONFeature } from '../lib/mapStore'

const DEFAULT_CENTER: LatLngExpression = [11.5329, 122.691] // Approx Capiz area

const initialFC: GeoJSONFeatureCollection = { type: 'FeatureCollection', features: [] }



function DrawControls({ onCreated, onEdited, onDeleted }: any) {
  const map = useMap()
  const drawnItemsRef = useRef(new L.FeatureGroup())

  useEffect(() => {
    const drawnItems = drawnItemsRef.current
    map.addLayer(drawnItems)

    const drawControl = new L.Control.Draw({
      edit: {
        featureGroup: drawnItems,
      },
      draw: {
        marker: {},
        polygon: {},
        polyline: {},
        rectangle: {},
        circle: false,
        circlemarker: false,
      },
    })
    map.addControl(drawControl)

    map.on(L.Draw.Event.CREATED as any, async (e: any) => {
      const layer = e.layer as L.Layer
      drawnItems.addLayer(layer)

      const type = window.prompt(
        'Enter type (household, barangay_hall, chapel, church, school, health_center, evacuation_center, poi, purok_boundary, settlement_zone, hazard_zone, road_primary, road_secondary, road_local, waterway):',
        'household'
      )
      const label = window.prompt('Enter label:', '') || ''

      onCreated(layer, type, label)
    })

    map.on(L.Draw.Event.EDITED as any, (e: any) => {
      onEdited(e.layers)
    })

    map.on(L.Draw.Event.DELETED as any, (e: any) => {
      onDeleted(e.layers)
    })

    return () => {
      map.removeLayer(drawnItems)
      map.removeControl(drawControl)
      map.off()
    }
  }, [map, onCreated, onEdited, onDeleted])

  return null
}

export default function InteractiveMap() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  
  const [fc, setFc] = useState<GeoJSONFeatureCollection>(() => loadFromLocalStorage() || initialFC)
  const [layersVisible, setLayersVisible] = useState<Record<string, boolean>>({
    markers: true,
    polygons: true,
    polylines: true,
  })



  const handleCreated = (layer: any, type: string, label: string) => {
    let geometry: GeoJSONFeature['geometry']
    if (layer instanceof L.Marker) {
      const { lat, lng } = layer.getLatLng()
      geometry = { type: 'Point', coordinates: [lng, lat] }
    } else if (layer instanceof L.Polygon || layer instanceof L.Rectangle) {
      const latlngs = (layer as L.Polygon).getLatLngs()[0] as any[]
      geometry = { type: 'Polygon', coordinates: [latlngs.map((ll) => [ll.lng, ll.lat])] }
    } else if (layer instanceof L.Polyline) {
      const latlngs = (layer as L.Polyline).getLatLngs() as any[]
      geometry = { type: 'LineString', coordinates: latlngs.map((ll) => [ll.lng, ll.lat]) }
    } else {
      return
    }

    const next: GeoJSONFeatureCollection = {
      ...fc,
      features: [
        ...fc.features,
        { type: 'Feature', geometry, properties: { type, label } },
      ],
    }
    setFc(next)
    saveToLocalStorage(next)
  }

  const handleEdited = (_layerGroup: L.LayerGroup) => {
    // Persist current state
    saveToLocalStorage(fc)
  }

  const handleDeleted = (_layerGroup: L.LayerGroup) => {
    const ok = window.confirm('Delete selected shapes from saved data? This will clear all saved features for now.')
    if (ok) {
      const next: GeoJSONFeatureCollection = { type: 'FeatureCollection', features: [] }
      setFc(next)
      saveToLocalStorage(next)
    }
  }

  const onSave = () => {
    saveToLocalStorage(fc)
    alert('Map saved to localStorage.')
  }

  const onLoad = () => {
    const data = loadFromLocalStorage()
    if (data) setFc(data)
    else alert('No saved data found.')
  }

  const onExport = () => {
    const blob = exportAsBlob(fc)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'interactive_map.geojson'
    a.click()
    URL.revokeObjectURL(url)
  }

  const onImport = async (file: File) => {
    try {
      const data = await importFromFile(file)
      setFc(data)
      saveToLocalStorage(data)
    } catch (e: any) {
      alert(e?.message || 'Invalid file')
    }
  }

  const toggleLayer = (key: string) => {
    setLayersVisible((s) => ({ ...s, [key]: !s[key] }))
  }



  const asMarkerType = (t: string): MarkerType => {
    switch (t) {
      case 'household':
      case 'barangay_hall':
      case 'chapel':
      case 'church':
      case 'school':
      case 'health_center':
      case 'evacuation_center':
      case 'poi':
        return t
      default:
        return 'poi'
    }
  }



  return (
    <Container fluid className="p-4">
      <Row className="g-3">
        <Col lg={9}>
          <Card className="shadow rounded-3">
            <Card.Header className="fw-semibold">
              <span>Interactive Map</span>
            </Card.Header>
            <Card.Body>
              <MapToolbar
                onSave={onSave}
                onLoad={onLoad}
                onExport={onExport}
                onImport={onImport}
                layers={layersVisible}
                onToggleLayer={toggleLayer}
              />

              <div style={{ height: 600, width: '100%' }}>
                <MapContainer center={DEFAULT_CENTER} zoom={15} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                  <FeatureGroup>
                    <DrawControls onCreated={handleCreated} onEdited={handleEdited} onDeleted={handleDeleted} />
                  </FeatureGroup>

                  {layersVisible.markers && fc.features.filter(f => f.geometry.type === 'Point').map((f, idx) => {
                    const [lng, lat] = f.geometry.coordinates
                    const icon = icons[asMarkerType(f.properties.type)]
                    return (
                      <Marker key={`pt-${idx}`} position={[lat, lng]} icon={icon as any}>
                        <Popup>
                          <div>
                            <div><strong>Type:</strong> {f.properties.type}</div>
                            <div><strong>Label:</strong> {f.properties.label}</div>
                          </div>
                        </Popup>
                      </Marker>
                    )
                  })}
                </MapContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={3}>
          <MapLegend />
        </Col>
      </Row>
    </Container>
  )
}
