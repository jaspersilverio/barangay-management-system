import { useState } from 'react'
import { Nav, Tab } from 'react-bootstrap'
import { CheckCircle, Clock } from 'lucide-react'
import CertificateRequests from '../components/certificates/CertificateRequests'
import IssuedCertificates from '../components/certificates/IssuedCertificates'
import CertificateStatistics from '../components/certificates/CertificateStatistics'

export default function Certificates() {
  const [activeTab, setActiveTab] = useState('requests')

  return (
    <div className="page-container">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Barangay Clearance & Certificates</h1>
          <p className="text-muted mb-0">Manage certificate requests and issued documents</p>
        </div>
      </div>

      {/* Statistics Cards */}
      <CertificateStatistics />

      {/* Main Content */}
      <div className="card-modern">
        <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'requests')}>
          <Nav variant="pills" className="mb-4">
            <Nav.Item>
              <Nav.Link eventKey="requests" className="d-flex align-items-center gap-2">
                <Clock size={16} />
                Certificate Requests
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="issued" className="d-flex align-items-center gap-2">
                <CheckCircle size={16} />
                Issued Certificates
              </Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="requests">
              <CertificateRequests />
            </Tab.Pane>
            <Tab.Pane eventKey="issued">
              <IssuedCertificates />
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </div>
    </div>
  )
}
