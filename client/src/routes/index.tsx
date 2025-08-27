import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import Placeholder from '../pages/Placeholder'
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
import LoginPage from '../pages/auth/Login'

import { useAuth } from '../context/AuthContext'
import { AdminRoute, ProtectedRoute } from './guards'

function PublicRoute() {
  return <Outlet />
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
        element: <AppLayout />,
        children: [
          { path: '/dashboard', element: <Dashboard /> },
          { path: '/map', element: <InteractiveMap /> },
          { path: '/households', element: <HouseholdListPage /> },
          { path: '/households/:id', element: <HouseholdDetailsPage /> },
          { path: '/residents', element: <ResidentListPage /> },
          { path: '/events', element: <EventsPage /> },
          { path: '/puroks', element: <PurokListPage /> },
          { path: '/puroks/:id', element: <PurokDetailsPage /> },
          { path: '/reports', element: <Reports /> },
          {
            element: <AdminRoute />,
            children: [
              { path: '/users', element: <Users /> },
              { path: '/settings', element: <Settings /> },
            ],
          },
        ],
      },
    ],
  },
])


