import { createBrowserRouter, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout'
import ProtectedRoute from './ProtectedRoute'
import Login from '../pages/Login'
import Dashboard from '../pages/Dashboard'
import HouseholdListPage from '../pages/households/HouseholdListPage'
import HouseholdDetailsPage from '../pages/households/HouseholdDetailsPage'
import ResidentListPage from '../pages/residents/ResidentListPage'
import EventsPage from '../pages/events/EventsPage'
import PurokListPage from '../pages/puroks/PurokListPage'
import PurokDetailsPage from '../pages/puroks/PurokDetailsPage'
import Reports from '../pages/Reports'
import Users from '../pages/Users'
import Settings from '../pages/Settings'
import InteractiveMap from '../pages/InteractiveMap'
import SketchMap from '../pages/SketchMap'
import Notifications from '../pages/Notifications'
import Certificates from '../pages/Certificates'
import Officials from '../pages/Officials'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <ProtectedRoute />,
    children: [
      {
        path: '',
        element: <Navigate to="/dashboard" replace />
      },
      {
        element: <AppLayout />,
        children: [
          {
            path: 'dashboard',
            element: <Dashboard />
          },
          {
            path: 'households',
            element: <HouseholdListPage />
          },
          {
            path: 'households/:id',
            element: <HouseholdDetailsPage />
          },
          {
            path: 'residents',
            element: <ResidentListPage />
          },
          {
            path: 'events',
            element: <EventsPage />
          },
          {
            path: 'puroks',
            element: <PurokListPage />
          },
          {
            path: 'puroks/:id',
            element: <PurokDetailsPage />
          },
          {
            path: 'certificates',
            element: <Certificates />
          },
          {
            path: 'notifications',
            element: <Notifications />
          },
          {
            path: 'reports',
            element: <Reports />
          },
          {
            path: 'users',
            element: <Users />
          },
          {
            path: 'officials',
            element: <Officials />
          },
          {
            path: 'settings',
            element: <Settings />
          },
          {
            path: 'map',
            element: <InteractiveMap />
          },
          {
            path: 'sketch-map',
            element: <SketchMap />
          }
        ]
      }
    ]
  }
])

export default router


