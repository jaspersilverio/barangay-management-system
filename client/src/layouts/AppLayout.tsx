import { Link, Outlet, useLocation } from 'react-router-dom'
import { Navbar, Container, Nav, Offcanvas, Button } from 'react-bootstrap'
import { NotificationProvider } from '../context/NotificationContext'
import { useAuth } from '../context/AuthContext'
import { useState } from 'react'
import { 
  Settings,
  Menu,
} from 'lucide-react'
import NotificationBell from '../components/ui/NotificationBell'
import Sidebar from '../components/sidebar/Sidebar'
import SectionSubNav from '../components/navigation/SectionSubNav'
import ThemeToggle from '../components/ui/ThemeToggle'
import PendingApprovalBanner from '../components/ui/PendingApprovalBanner'

const OFFICIALS_TABS = [
  { label: 'Barangay', to: '/officials/barangay' },
  { label: 'SK', to: '/officials/sk' },
  { label: 'Tanod', to: '/officials/tanod' },
  { label: 'BHW', to: '/officials/bhw' },
  { label: 'Staff', to: '/officials/staff' },
]

const BENEFICIARIES_TABS = [
  { label: '4Ps', to: '/beneficiaries/4ps' },
  { label: 'Senior Citizens', to: '/beneficiaries/senior-citizens' },
  { label: 'Solo Parents', to: '/beneficiaries/solo-parents' },
  { label: 'PWD', to: '/beneficiaries/pwd' },
]

export default function AppLayout() {
  const { user } = useAuth()
  const [showOffcanvas, setShowOffcanvas] = useState(false)
  const location = useLocation()
  const pathname = location.pathname

  const isOfficialsSection = pathname.startsWith('/officials')
  const isBeneficiariesSection = pathname.startsWith('/beneficiaries')

  const handleCloseOffcanvas = () => setShowOffcanvas(false)
  const handleShowOffcanvas = () => setShowOffcanvas(true)

  return (
    <NotificationProvider>
      <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
        {/* Sidebar (fixed) */}
        <Sidebar />

        {/* Top Navbar (fixed, width adjusts on lg+) */}
        <Navbar className="topbar-fixed navbar-modern px-4">
          <Container fluid>
            <div className="d-flex align-items-center">
              <Button
                variant="outline-secondary"
                size="sm"
                className="d-lg-none me-3"
                onClick={handleShowOffcanvas}
              >
                <Menu size={20} />
              </Button>
              <Navbar.Brand as={Link} to="/dashboard" className="text-gradient font-bold">
                Barangay Dashboard
              </Navbar.Brand>
            </div>
            
            <Navbar.Collapse className="justify-content-end">
              <Nav className="align-items-center gap-3">
                <ThemeToggle />
                
                {user && (
                  <div className="d-flex align-items-center gap-2">
                    <div className="bg-primary-100 text-primary-700 rounded-full w-8 h-8 d-flex align-items-center justify-content-center">
                      <span className="fw-bold text-sm">{user.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="d-none d-md-block">
                      <div className="text-sm font-medium text-neutral-700">{user.name}</div>
                      <div className="text-xs text-neutral-500">{user.role}</div>
                    </div>
                  </div>
                )}
                
                <NotificationBell />
                
                {user?.role === 'admin' && (
                  <Nav.Link as={Link} to="/settings" className="text-neutral-600">
                    <Settings size={18} />
                  </Nav.Link>
                )}
              </Nav>
            </Navbar.Collapse>
          </Container>
        </Navbar>

        {/* Offcanvas sidebar for small screens */}
        <Offcanvas 
          show={showOffcanvas} 
          onHide={handleCloseOffcanvas}
          placement="start" 
          className="d-lg-none"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title className="text-gradient font-bold d-flex align-items-center gap-2">
              <img 
                src="/houselogo1.png" 
                alt="HMMS Logo" 
                style={{ width: '24px', height: '24px', objectFit: 'contain' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const fallback = document.createElement('span');
                    fallback.className = 'logo-fallback';
                    fallback.textContent = '🏘️';
                    parent.insertBefore(fallback, target);
                  }
                }}
              />
              HMMS
            </Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Barangay Management</p>
            </div>
            <p className="text-sm text-neutral-500">Mobile menu - Coming soon</p>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main content area */}
        <div className="content-area">
          {/* Pending Approval Banner - Only visible to Captain/Admin */}
          <PendingApprovalBanner />
          <Container fluid className="p-4">
            {isOfficialsSection && (
              <SectionSubNav tabs={OFFICIALS_TABS} />
            )}
            {isBeneficiariesSection && (
              <SectionSubNav tabs={BENEFICIARIES_TABS} />
            )}
            <Outlet />
          </Container>
        </div>
      </div>
    </NotificationProvider>
  )
}


