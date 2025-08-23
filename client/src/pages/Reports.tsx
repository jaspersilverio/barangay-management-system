import React, { useState } from 'react'
import { Container, Row, Col, Nav, Tab } from 'react-bootstrap'
import { FileText, Users, Home, BarChart3 } from 'lucide-react'
import HouseholdsReport from '../components/reports/HouseholdsReport'
import ResidentsReport from '../components/reports/ResidentsReport'
import PuroksReport from '../components/reports/PuroksReport'

export default function Reports() {
  const [activeTab, setActiveTab] = useState('households')

  return (
    <Container fluid className="p-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center gap-3">
            <div className="bg-primary bg-opacity-10 p-3 rounded">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="mb-0">Reports & Analytics</h2>
              <p className="text-muted mb-0">Generate comprehensive reports for barangay management</p>
            </div>
          </div>
        </Col>
      </Row>

      <Row>
        <Col>
          <Tab.Container activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'households')}>
            <Nav variant="tabs" className="mb-4">
              <Nav.Item>
                <Nav.Link 
                  eventKey="households" 
                  className="d-flex align-items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Households
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  eventKey="residents" 
                  className="d-flex align-items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Residents
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  eventKey="puroks" 
                  className="d-flex align-items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Puroks Summary
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
            </Tab.Content>
          </Tab.Container>
        </Col>
      </Row>
    </Container>
  )
}
