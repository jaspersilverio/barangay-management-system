import { createBrowserRouter, Navigate, useRouteError, Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Spinner, Alert, Button } from 'react-bootstrap'
import AppLayout from '../layouts/AppLayout'
import ProtectedRoute from './ProtectedRoute'

// Shown when a lazy-loaded page fails to load (e.g. network or chunk error)
function RouteErrorFallback() {
  const error = useRouteError() as Error & { message?: string }
  const isChunkError = error?.message?.includes('fetch') || error?.message?.includes('dynamically imported')
  return (
    <div className="p-4 text-center">
      <Alert variant="warning" className="mb-3">
        <h5 className="alert-heading">Something went wrong</h5>
        <p className="mb-0 small text-muted">
          {isChunkError
            ? 'The page failed to load. Try refreshing the browser or restarting the dev server.'
            : (error?.message || 'An unexpected error occurred.')}
        </p>
      </Alert>
      <div className="d-flex gap-2 justify-content-center flex-wrap">
        <Button variant="primary" onClick={() => window.location.reload()}>
          Try again
        </Button>
        <Link to="/dashboard">
          <Button variant="outline-secondary">Go to Dashboard</Button>
        </Link>
      </div>
    </div>
  )
}

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
const SKOfficialsPage = lazy(() => import('../pages/officials/SKOfficialsPage'))
const TanodPage = lazy(() => import('../pages/officials/TanodPage'))
const BHWPage = lazy(() => import('../pages/officials/BHWPage'))
const StaffPage = lazy(() => import('../pages/officials/StaffPage'))
const SeniorCitizensPage = lazy(() => import('../pages/beneficiaries/SeniorCitizensPage'))
const PWDBeneficiariesPage = lazy(() => import('../pages/beneficiaries/PWDBeneficiariesPage'))
const FourPsBeneficiariesPage = lazy(() => import('../pages/beneficiaries/FourPsBeneficiariesPage'))
const SoloParentsPage = lazy(() => import('../pages/beneficiaries/SoloParentsPage'))
const BlotterPage = lazy(() => import('../pages/BlotterPage'))
const IncidentReportsPage = lazy(() => import('../pages/incidents/IncidentReportsPage'))
const ApprovalCenter = lazy(() => import('../pages/ApprovalCenter'))
const RegisterHouseholdPage = lazy(() => import('../pages/households/RegisterHouseholdPage'))
const RegisterResidentPage = lazy(() => import('../pages/residents/RegisterResidentPage'))

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

const SKOfficialsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <SKOfficialsPage />
  </Suspense>
)

const SeniorCitizensPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <SeniorCitizensPage />
  </Suspense>
)

const PWDBeneficiariesPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <PWDBeneficiariesPage />
  </Suspense>
)

const FourPsBeneficiariesPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <FourPsBeneficiariesPage />
  </Suspense>
)

const SoloParentsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <SoloParentsPage />
  </Suspense>
)

const BlotterPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <BlotterPage />
  </Suspense>
)

const IncidentReportsPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <IncidentReportsPage />
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

const RegisterHouseholdPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <RegisterHouseholdPage />
  </Suspense>
)

const RegisterResidentPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <RegisterResidentPage />
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
            path: 'households/register',
            element: <RegisterHouseholdPageWithSuspense />
          },
          {
            path: 'households/:id',
            element: <HouseholdDetailsPageWithSuspense />
          },
          {
            path: 'residents/register',
            element: <RegisterResidentPageWithSuspense />
          },
          {
            path: 'residents',
            element: <ResidentListPageWithSuspense />,
            errorElement: <RouteErrorFallback />
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
            element: <ProtectedRoute allow={['admin', 'captain', 'purok_leader']} />,
            children: [
              { index: true, element: <PurokListPageWithSuspense /> },
              { path: ':id', element: <PurokDetailsPageWithSuspense /> }
            ]
          },
          {
            path: 'certificates',
            element: <CertificatesWithSuspense />
          },
          {
            path: 'certificates/barangay-clearance',
            element: <Navigate to="/certificates" replace />
          },
          {
            path: 'certificates/indigency',
            element: <Navigate to="/certificates" replace />
          },
          {
            path: 'certificates/residency',
            element: <Navigate to="/certificates" replace />
          },
          {
            path: 'certificates/solo-parent',
            element: <Navigate to="/certificates" replace />
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
            element: <Navigate to="/officials/barangay" replace />
          },
          {
            path: 'officials/barangay',
            element: <OfficialsWithSuspense />
          },
          {
            path: 'officials/sk',
            element: <SKOfficialsPageWithSuspense />
          },
          {
            path: 'officials/tanod',
            element: <Suspense fallback={<PageLoader />}><TanodPage /></Suspense>,
          },
          {
            path: 'officials/bhw',
            element: <Suspense fallback={<PageLoader />}><BHWPage /></Suspense>,
          },
          {
            path: 'officials/staff',
            element: <Suspense fallback={<PageLoader />}><StaffPage /></Suspense>,
          },
          {
            path: 'beneficiaries',
            element: <Navigate to="/beneficiaries/4ps" replace />
          },
          {
            path: 'beneficiaries/senior-citizens',
            element: <SeniorCitizensPageWithSuspense />
          },
          {
            path: 'beneficiaries/pwd',
            element: <PWDBeneficiariesPageWithSuspense />
          },
          {
            path: 'beneficiaries/4ps',
            element: <FourPsBeneficiariesPageWithSuspense />
          },
          {
            path: 'beneficiaries/solo-parents',
            element: <SoloParentsPageWithSuspense />
          },
          {
            path: 'blotter',
            element: <BlotterPageWithSuspense />
          },
          {
            path: 'incident-reports',
            element: <IncidentReportsPageWithSuspense />
          },
          {
            path: 'approval-center',
            element: <Suspense fallback={<PageLoader />}><ApprovalCenter /></Suspense>
          },
          {
            path: 'incidents/report',
            element: <Navigate to="/incident-reports" replace />
          },
          {
            path: 'settings',
            element: <SettingsWithSuspense />
          },
          {
            path: 'settings/users',
            element: <Navigate to="/users" replace />
          },
          {
            path: 'map',
            element: <SketchMapWithSuspense />
          },
          {
            path: 'landmarks',
            element: <Navigate to="/dashboard" replace />
          }
        ]
      }
    ]
  }
])

export default router


