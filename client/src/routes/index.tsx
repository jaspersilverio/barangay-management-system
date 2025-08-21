import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Placeholder from '../pages/Placeholder'
import HouseholdListPage from '../pages/households/HouseholdListPage'
import HouseholdDetailsPage from '../pages/households/HouseholdDetailsPage'
import PurokListPage from '../pages/puroks/PurokListPage'
import PurokDetailsPage from '../pages/puroks/PurokDetailsPage'
import LoginPage from '../pages/auth/Login'
import RegisterPage from '../pages/auth/Register'
import { useAuth } from '../context/AuthContext'
import { AdminRoute } from './guards'
import ProtectedRoute from './ProtectedRoute'

function PublicRoute() {
  return <Outlet />
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
  // {
  //   element: <PublicRoute />,
  //   children: [
  //     { path: '/login', element: <LoginPage /> },
  //     { path: '/register', element: <RegisterPage /> },
  //   ],
  // },
  // {
  //   element: <ProtectedRoute />,
  //   children: [
  //     {
  //       element: <AppLayout />,
  //       children: [
  //         { path: '/dashboard', element: <Placeholder title="Dashboard" /> },
  //         { path: '/households', element: <Placeholder title="Households" /> },
  //         { path: '/residents', element: <Placeholder title="Residents" /> },
  //         { path: '/puroks', element: <Placeholder title="Puroks" /> },
  //         { path: '/reports', element: <Placeholder title="Reports" /> },
  //         { path: '/disaster', element: <Placeholder title="Disaster Response" /> },
  //         {
  //           element: <AdminRoute />,
  //           children: [
  //             { path: '/users', element: <Placeholder title="Users" /> },
  //           ],
  //         },
  //         { path: '/settings', element: <Placeholder title="Settings" /> },
  //       ],
  //     },
  //   ],
  // },
  // Auth disabled: expose app directly for demo
  {
    element: <AppLayout />,
    children: [
      { path: '/dashboard', element: <Placeholder title="Dashboard" /> },
      { path: '/households', element: <HouseholdListPage /> },
      { path: '/households/:id', element: <HouseholdDetailsPage /> },
      { path: '/residents', element: <Placeholder title="Residents" /> },
      { path: '/puroks', element: <PurokListPage /> },
      { path: '/puroks/:id', element: <PurokDetailsPage /> },
      { path: '/reports', element: <Placeholder title="Reports" /> },
      { path: '/disaster', element: <Placeholder title="Disaster Response" /> },
      { path: '/users', element: <Placeholder title="Users" /> },
      { path: '/settings', element: <Placeholder title="Settings" /> },
    ],
  },
])


