import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute() {
  const { token, user, isAuthenticated } = useAuth()
  
  // Show loading while checking authentication
  if (token && !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

export function RoleRoute({ allow }: { allow: Array<string> }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!allow.includes(user.role)) return <Navigate to="/dashboard" replace />
  return <Outlet />
}

export function AdminRoute() {
  return <RoleRoute allow={['admin']} />
}


