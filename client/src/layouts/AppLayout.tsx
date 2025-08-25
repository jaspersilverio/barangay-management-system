import { Link, NavLink, Outlet } from 'react-router-dom'
import { Navbar, Container, Nav, Offcanvas, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <div>
      {/* Sidebar (fixed) */}
      <Nav className="sidebar-fixed flex-column bg-dark text-white p-3 d-none d-lg-flex">
        <div className="fs-5 fw-bold mb-3">
          <Link to="/dashboard" className="text-white text-decoration-none">HMMS</Link>
        </div>
        {[
          ['/dashboard', 'Dashboard'],
          ['/map', 'Interactive Map'],
          ['/households', 'Households'],
          ['/residents', 'Residents'],
          ['/events', 'Events'],
          ['/puroks', 'Puroks'],
          ['/reports', 'Reports'],
          ...(user?.role === 'admin' ? [['/users', 'Users']] : []),
          ...(user?.role === 'admin' ? [['/settings', 'Settings']] : []),
        ].map(([to, label]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-link text-white rounded ${isActive ? 'bg-primary' : ''}`
            }
            end
          >
            {label}
          </NavLink>
        ))}
      </Nav>

      {/* Top Navbar (fixed, width adjusts on lg+) */}
      <Navbar bg="light" expand="lg" className="topbar-fixed shadow-sm px-4">
        <Container fluid>
          <Navbar.Brand as={Link} to="/dashboard">Barangay Dashboard</Navbar.Brand>
          <Navbar.Toggle aria-controls="offcanvasNavbar" />
          <Navbar.Collapse className="justify-content-end">
            <Nav className="align-items-center">
              {user && (
                <span className="text-muted me-3">
                  Welcome, {user.name} ({user.role})
                </span>
              )}
              {user?.role === 'admin' && (
                <Nav.Link as={Link} to="/settings">Settings</Nav.Link>
              )}
              <Button variant="outline-secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Offcanvas sidebar for small screens */}
      <Offcanvas id="offcanvasNavbar" placement="start" className="d-lg-none">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column">
            {[
              ['/dashboard', 'Dashboard'],
              ['/map', 'Interactive Map'],
              ['/households', 'Households'],
              ['/residents', 'Residents'],
              ['/events', 'Events'],
              ['/puroks', 'Puroks'],
              ['/reports', 'Reports'],
              ...(user?.role === 'admin' ? [['/users', 'Users']] : []),
              ...(user?.role === 'admin' ? [['/settings', 'Settings']] : []),
            ].map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `nav-link ${isActive ? 'text-primary' : ''}`} end>
                {label}
              </NavLink>
            ))}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Main content area */}
      <div className="content-area">
        <Container fluid className="p-4">
          <Outlet />
        </Container>
      </div>
    </div>
  )
}


