import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Dashboard from '../pages/Dashboard'
import HouseholdListPage from '../pages/households/HouseholdListPage'
import HouseholdDetailsPage from '../pages/households/HouseholdDetailsPage'
import PurokListPage from '../pages/puroks/PurokListPage'
import PurokDetailsPage from '../pages/puroks/PurokDetailsPage'
import ResidentListPage from '../pages/residents/ResidentListPage'
import EventsPage from '../pages/events/EventsPage'
import InteractiveMap from '../pages/InteractiveMap'
import Reports from '../pages/Reports'
import Users from '../pages/Users'
import Settings from '../pages/Settings'
import Notifications from '../pages/Notifications'
import LoginPage from '../pages/auth/Login'
import { DashboardProvider } from '../context/DashboardContext'
import { AdminRoute, ProtectedRoute } from './guards'

function PublicRoute() {
  return <Outlet />
}

// Wrapper component to provide dashboard context to all protected routes
function DashboardLayout() {
  return (
    <DashboardProvider>
      <AppLayout />
    </DashboardProvider>
  )
}

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/dashboard" replace /> },
      {
      element: <PublicRoute />,
      children: [
        { path: '/login', element: <LoginPage /> },
      ],
    },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
                        children: [
                  { path: '/dashboard', element: <Dashboard /> },
                  { path: '/households', element: <HouseholdListPage /> },
                  { path: '/households/:id', element: <HouseholdDetailsPage /> },
                  { path: '/residents', element: <ResidentListPage /> },
                  { path: '/events', element: <EventsPage /> },
                  { path: '/notifications', element: <Notifications /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/users', element: <Users /> },
              { path: '/settings', element: <Settings /> },
              { path: '/map', element: <InteractiveMap /> },
              { path: '/puroks', element: <PurokListPage /> },
              { path: '/puroks/:id', element: <PurokDetailsPage /> },
              { path: '/reports', element: <Reports /> },
            ],
          },
        ],
      },
    ],
  },
])


