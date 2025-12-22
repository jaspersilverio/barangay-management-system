import { Card } from 'react-bootstrap'

export default function SoloParentsPage() {
  return (
    <div className="page-container page-sub">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Solo Parents</h2>
          <p className="text-brand-muted mb-0">Manage solo parent beneficiaries</p>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <Card className="data-table-card">
        <Card.Body className="text-center py-5">
          <div className="mb-4">
            <h4 className="text-brand-primary mb-3">Solo Parents Management</h4>
            <p className="text-muted">
              This feature is coming soon. Solo Parents management will allow you to:
            </p>
            <ul className="text-start d-inline-block text-muted">
              <li>Track solo parent beneficiaries</li>
              <li>Monitor benefits and assistance programs</li>
              <li>Generate solo parent reports and statistics</li>
              <li>Manage beneficiary information and status</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}

