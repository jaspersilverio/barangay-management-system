import { Card, Badge, Image } from 'react-bootstrap'
import { type Official } from '../../services/officials.service'

interface OfficialCardProps {
  official: Official
  className?: string
}

export default function OfficialCard({ official, className = '' }: OfficialCardProps) {
  const getPositionColor = (position: string) => {
    const colors: { [key: string]: string } = {
      'Barangay Captain': 'primary',
      'Barangay Kagawad': 'info',
      'Barangay Secretary': 'warning',
      'Barangay Treasurer': 'success',
      'Barangay SK Chairman': 'danger',
      'Barangay SK Kagawad': 'danger',
      'Barangay Health Worker': 'info',
      'Barangay Tanod': 'dark',
      'Barangay Day Care Worker': 'warning',
      'Other': 'secondary'
    }
    return colors[position] || 'secondary'
  }

  const getStatusBadge = (active: boolean) => {
    return active ? (
      <Badge bg="success" className="mb-2 rounded-pill">Active</Badge>
    ) : (
      <Badge bg="secondary" className="mb-2 rounded-pill">Inactive</Badge>
    )
  }

  return (
    <Card className={`h-100 ${className}`}>
      <Card.Body className="text-center">
        <div className="mb-3">
          <Image
            src={official.photo_url || '/images/default-avatar.png'}
            alt={official.name}
            width={120}
            height={120}
            className="rounded-circle object-fit-cover border"
          />
        </div>

        <div className="mb-2">
          {getStatusBadge(official.active)}
        </div>

        <Card.Title className="h5 mb-2 text-brand-primary">{official.name}</Card.Title>
        
        <Badge bg={getPositionColor(official.position)} className="mb-3 rounded-pill">
          {official.position}
        </Badge>

        <div className="text-brand-muted small">
          {official.term_period && (
            <div className="mb-2">
              <strong>Term:</strong> {official.term_period}
            </div>
          )}
          
          {official.contact && (
            <div className="mb-2">
              <strong>Contact:</strong> {official.contact}
            </div>
          )}

          {official.user && (
            <div>
              <strong>Email:</strong> {official.user.email}
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}
