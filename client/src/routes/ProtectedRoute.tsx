import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Spinner } from 'react-bootstrap'

export default function ProtectedRoute({ allow }: { allow?: Array<string> }) {
  const { user, isAuthenticated, loading } = useAuth()
  
  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    )
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (allow && user && !allow.includes(user.role)) {
    return <div className="p-6">Forbidden</div>
  }
  return <Outlet />
}


