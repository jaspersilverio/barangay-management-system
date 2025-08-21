import { Card, ListGroup, Badge } from 'react-bootstrap'

export default function MapLegend() {
  return (
    <Card className="shadow-sm" style={{ minWidth: 260 }}>
      <Card.Header className="fw-semibold">Legend</Card.Header>
      <ListGroup variant="flush">
        <ListGroup.Item>🏠 Household</ListGroup.Item>
        <ListGroup.Item>🏛️ Barangay Hall</ListGroup.Item>
        <ListGroup.Item>⛪ Chapel / ✝️ Church</ListGroup.Item>
        <ListGroup.Item>🏫 School</ListGroup.Item>
        <ListGroup.Item>🏥 Health Center</ListGroup.Item>
        <ListGroup.Item>🚨 Evacuation Center</ListGroup.Item>
        <ListGroup.Item>📍 POI</ListGroup.Item>
        <ListGroup.Item>
          <Badge bg="success" className="me-2"> </Badge>
          Purok Boundary
        </ListGroup.Item>
        <ListGroup.Item>
          <Badge bg="secondary" className="me-2"> </Badge>
          Settlement Zone
        </ListGroup.Item>
        <ListGroup.Item>
          <Badge bg="danger" className="me-2"> </Badge>
          Hazard Zone
        </ListGroup.Item>
        <ListGroup.Item>
          <Badge bg="warning" className="me-2"> </Badge>
          Primary Road
        </ListGroup.Item>
        <ListGroup.Item>
          <Badge bg="info" className="me-2"> </Badge>
          Waterway
        </ListGroup.Item>
      </ListGroup>
    </Card>
  )
}
