import { useState, useEffect } from 'react'
import { Row, Col, Button, Alert, Card } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'

export default function SKOfficialsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  return (
    <div className="page-container page-sub">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">SK Officials</h2>
          <p className="text-brand-muted mb-0">Manage Sangguniang Kabataan (SK) officials</p>
        </div>
        <div className="page-actions">
          {isAdmin && (
            <Button 
              variant="primary" 
              size="lg"
              className="btn-brand-primary"
              disabled
            >
              ➕ Add SK Official
            </Button>
          )}
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card className="data-table-card">
        <Card.Body className="text-center py-5">
          <div className="mb-4">
            <h4 className="text-brand-primary mb-3">SK Officials Management</h4>
            <p className="text-muted">
              This feature is coming soon. SK Officials management will allow you to:
            </p>
            <ul className="text-start d-inline-block text-muted">
              <li>Manage SK officials and their positions</li>
              <li>Track SK activities and programs</li>
              <li>View SK official profiles and contact information</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

