import { useState } from 'react'
import { Row, Col, Nav, Tab } from 'react-bootstrap'
import { FileText, Users, Home, BarChart3, FileSpreadsheet, ShieldPlus, Syringe, ScrollText, ClipboardList } from 'lucide-react'
import HouseholdsReport from '../components/reports/HouseholdsReport'
import ResidentsReport from '../components/reports/ResidentsReport'
import PuroksReport from '../components/reports/PuroksReport'
import BeneficiariesReport from '../components/reports/BeneficiariesReport'
import CertificatesReport from '../components/reports/CertificatesReport'
import VaccinationsReport from '../components/reports/VaccinationsReport'
import BlotterReport from '../components/reports/BlotterReport'
import IncidentReportsReport from '../components/reports/IncidentReportsReport'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('households')

  return (
    <div className="page-container">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-brand-primary bg-opacity-10 p-3 rounded">
              <FileText className="h-6 w-6 text-brand-primary" />
            </div>
            <div>
              <h2 className="mb-0 text-brand-primary">Reports & Analytics</h2>
              <p className="text-brand-muted mb-0">Generate comprehensive reports for barangay management</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'households')}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link eventKey="households" className="d-flex align-items-center gap-2">
                  <Home className="h-4 w-4" />
                  Households
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="residents" className="d-flex align-items-center gap-2">
                  <Users className="h-4 w-4" />
                  Residents
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="puroks" className="d-flex align-items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Puroks Summary
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="beneficiaries" className="d-flex align-items-center gap-2">
                  <ShieldPlus className="h-4 w-4" />
                  Beneficiaries
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="certificates" className="d-flex align-items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  Certificates
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="vaccinations" className="d-flex align-items-center gap-2">
                  <Syringe className="h-4 w-4" />
                  Vaccinations
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="blotter" className="d-flex align-items-center gap-2">
                  <ScrollText className="h-4 w-4" />
                  Blotter
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="incidents" className="d-flex align-items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Incident Reports
                </Nav.Link>
              </Nav.Item>
            </Nav>

            <Tab.Content>
              <Tab.Pane eventKey="households">
                <HouseholdsReport />
              </Tab.Pane>
              <Tab.Pane eventKey="residents">
                <ResidentsReport />
              </Tab.Pane>
              <Tab.Pane eventKey="puroks">
                <PuroksReport />
              </Tab.Pane>
              <Tab.Pane eventKey="beneficiaries">
                <BeneficiariesReport />
              </Tab.Pane>
              <Tab.Pane eventKey="certificates">
                <CertificatesReport />
              </Tab.Pane>
              <Tab.Pane eventKey="vaccinations">
                <VaccinationsReport />
              </Tab.Pane>
              <Tab.Pane eventKey="blotter">
                <BlotterReport />
              </Tab.Pane>
              <Tab.Pane eventKey="incidents">
                <IncidentReportsReport />
              </Tab.Pane>
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </div>
  )
}
