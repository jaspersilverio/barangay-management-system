import { createBrowserRouter, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner } from 'react-bootstrap'
import AppLayout from '../layouts/AppLayout'
import ProtectedRoute from './ProtectedRoute'

// Loading component for Suspense fallback
const PageLoader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
    <Spinner animation="border" role="status">
      <span className="visually-hidden">Loading...</span>
    </Spinner>
  </div>
)

// Lazy load critical pages immediately
const Login = lazy(() => import('../pages/Login'))
const Dashboard = lazy(() => import('../pages/Dashboard'))

// Lazy load heavy components and non-critical pages
const HouseholdListPage = lazy(() => import('../pages/households/HouseholdListPage'))
const HouseholdDetailsPage = lazy(() => import('../pages/households/HouseholdDetailsPage'))
const ResidentListPage = lazy(() => import('../pages/residents/ResidentListPage'))
const ResidentProfilePage = lazy(() => import('../pages/residents/ResidentProfilePage'))
const EventsPage = lazy(() => import('../pages/events/EventsPage'))
const PurokListPage = lazy(() => import('../pages/puroks/PurokListPage'))
const PurokDetailsPage = lazy(() => import('../pages/puroks/PurokDetailsPage'))
const Reports = lazy(() => import('../pages/Reports'))
const Users = lazy(() => import('../pages/Users'))
const Settings = lazy(() => import('../pages/Settings'))
const SketchMap = lazy(() => import('../pages/SketchMap'))
const Notifications = lazy(() => import('../pages/Notifications'))
const Certificates = lazy(() => import('../pages/Certificates'))
const VaccinationsPage = lazy(() => import('../pages/VaccinationsPage'))
const Officials = lazy(() => import('../pages/Officials'))
const BlotterPage = lazy(() => import('../pages/BlotterPage'))

// Create wrapped components with Suspense
const HouseholdListPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <HouseholdListPage />
  </Suspense>
)

const HouseholdDetailsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <HouseholdDetailsPage />
  </Suspense>
)

const ResidentListPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <ResidentListPage />
  </Suspense>
)

const ResidentProfilePageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <ResidentProfilePage />
  </Suspense>
)

const EventsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <EventsPage />
  </Suspense>
)

const PurokListPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <PurokListPage />
  </Suspense>
)

const PurokDetailsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <PurokDetailsPage />
  </Suspense>
)

const CertificatesWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Certificates />
  </Suspense>
)

const VaccinationsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <VaccinationsPage />
  </Suspense>
)

const NotificationsWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Notifications />
  </Suspense>
)

const ReportsWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Reports />
  </Suspense>
)

const UsersWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Users />
  </Suspense>
)

const OfficialsWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Officials />
  </Suspense>
)

const BlotterPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <BlotterPage />
  </Suspense>
)

const SettingsWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <Settings />
  </Suspense>
)

const SketchMapWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <SketchMap />
  </Suspense>
)

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
            element: <HouseholdListPageWithSuspense />
          },
          {
            path: 'households/:id',
            element: <HouseholdDetailsPageWithSuspense />
          },
          {
            path: 'residents',
            element: <ResidentListPageWithSuspense />
          },
          {
            path: 'residents/:id',
            element: <ResidentProfilePageWithSuspense />
          },
          {
            path: 'events',
            element: <EventsPageWithSuspense />
          },
          {
            path: 'puroks',
            element: <PurokListPageWithSuspense />
          },
          {
            path: 'puroks/:id',
            element: <PurokDetailsPageWithSuspense />
          },
          {
            path: 'certificates',
            element: <CertificatesWithSuspense />
          },
          {
            path: 'vaccinations',
            element: <VaccinationsPageWithSuspense />
          },
          {
            path: 'notifications',
            element: <NotificationsWithSuspense />
          },
          {
            path: 'reports',
            element: <ReportsWithSuspense />
          },
          {
            path: 'users',
            element: <UsersWithSuspense />
          },
          {
            path: 'officials',
            element: <OfficialsWithSuspense />
          },
          {
            path: 'blotter',
            element: <BlotterPageWithSuspense />
          },
          {
            path: 'settings',
            element: <SettingsWithSuspense />
          },
          {
            path: 'map',
            element: <SketchMapWithSuspense />
          }
        ]
      }
    ]
  }
])

export default router


