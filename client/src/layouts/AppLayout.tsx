import { Link, NavLink, Outlet } from 'react-router-dom'
import { Navbar, Container, Nav, Offcanvas, Button } from 'react-bootstrap'
import { useAuth } from '../context/AuthContext'
import { NotificationProvider } from '../context/NotificationContext'
import { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Calendar, 
  MapPin, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  Award,
  Shield,
  ClipboardList
} from 'lucide-react'
import NotificationBell from '../components/ui/NotificationBell'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const [showOffcanvas, setShowOffcanvas] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const handleCloseOffcanvas = () => setShowOffcanvas(false)
  const handleShowOffcanvas = () => setShowOffcanvas(true)

  // Navigation items with icons
  const getNavItems = () => {
    const baseItems = [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/households', label: 'Households', icon: Users },
      { to: '/residents', label: 'Residents', icon: UserCheck },
      { to: '/events', label: 'Events', icon: Calendar },
    ]

    // Admin gets additional items
    if (user?.role === 'admin') {
      baseItems.push(
        { to: '/map', label: 'Sketch Map', icon: MapPin },
        { to: '/puroks', label: 'Puroks', icon: MapPin },
        { to: '/certificates', label: 'Certificates', icon: Award },
        { to: '/blotter', label: 'Blotter', icon: ClipboardList },
        { to: '/reports', label: 'Reports', icon: FileText },
        { to: '/users', label: 'Users', icon: Users },
        { to: '/officials', label: 'Officials', icon: Shield }
      )
    } else if (user?.role === 'purok_leader') {
      // Purok leaders get certificates and blotter access
      baseItems.push(
        { to: '/map', label: 'Sketch Map', icon: MapPin },
        { to: '/certificates', label: 'Certificates', icon: Award },
        { to: '/blotter', label: 'Blotter', icon: ClipboardList }
      )
    } else {
      // Residents get sketch map access (view-only)
      baseItems.push(
        { to: '/map', label: 'Sketch Map', icon: MapPin }
      )
    }

    return baseItems
  }

  const navItems = getNavItems()

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Sidebar (fixed) */}
        <Nav className="sidebar-fixed flex-column sidebar-modern p-4 d-none d-lg-flex">
          <div className="mb-8">
            <Link to="/dashboard" className="text-decoration-none">
              <h1 className="h4 mb-0 text-gradient font-bold">🏘️ HMMS</h1>
              <p className="text-sm text-neutral-500 mt-1">Barangay Management</p>
            </Link>
          </div>
          
          <Nav className="flex-column gap-2">
            {navItems.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                end
              >
                <Icon size={20} className="mr-3" />
                <span className="font-medium">{label}</span>
              </NavLink>
            ))}
          </Nav>

          <div className="mt-auto">
            {user?.role === 'admin' && (
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? 'active' : ''} mb-2`
                }
              >
                <Settings size={20} className="mr-3" />
                <span className="font-medium">Settings</span>
              </NavLink>
            )}
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleLogout}
              className="w-full d-flex align-items-center justify-content-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </Button>
          </div>
        </Nav>

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
            <Offcanvas.Title className="text-gradient font-bold">🏘️ HMMS</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <div className="mb-4">
              <p className="text-sm text-neutral-500">Barangay Management</p>
            </div>
            <Nav className="flex-column gap-2">
              {navItems.map(({ to, label, icon: Icon }) => (
                <NavLink 
                  key={to} 
                  to={to} 
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`} 
                  end
                  onClick={handleCloseOffcanvas}
                >
                  <Icon size={20} className="mr-3" />
                  <span className="font-medium">{label}</span>
                </NavLink>
              ))}
            </Nav>
            
            <div className="mt-auto pt-4">
              {user?.role === 'admin' && (
                <NavLink
                  to="/settings"
                  className={({ isActive }) =>
                    `sidebar-link ${isActive ? 'active' : ''} mb-2 d-block`
                  }
                  onClick={handleCloseOffcanvas}
                >
                  <Settings size={20} className="mr-3" />
                  <span className="font-medium">Settings</span>
                </NavLink>
              )}
              <Button 
                variant="outline-secondary" 
                size="sm" 
                onClick={() => {
                  handleLogout()
                  handleCloseOffcanvas()
                }}
                className="w-full d-flex align-items-center justify-content-center gap-2"
              >
                <LogOut size={16} />
                Logout
              </Button>
            </div>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main content area */}
        <div className="content-area">
          <Container fluid className="p-4">
            <Outlet />
          </Container>
        </div>
      </div>
    </NotificationProvider>
  )
}


