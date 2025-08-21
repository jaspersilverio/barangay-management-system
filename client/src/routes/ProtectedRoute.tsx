// import { Navigate, Outlet } from 'react-router-dom'
// import { useAuth } from '../context/AuthContext'

// export default function ProtectedRoute({ allow }: { allow?: Array<string> }) {
//   const { token, user } = useAuth()
//   if (!token) return <Navigate to="/login" replace />
//   if (allow && user && !allow.includes(user.role)) {
//     return <div className="p-6">Forbidden</div>
//   }
//   return <Outlet />
// }


