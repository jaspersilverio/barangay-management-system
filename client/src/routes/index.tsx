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
const ImmunizationPage = lazy(() => import('../pages/ImmunizationPage'))
const Officials = lazy(() => import('../pages/Officials'))
const SKOfficialsPage = lazy(() => import('../pages/officials/SKOfficialsPage'))
const SeniorCitizensPage = lazy(() => import('../pages/beneficiaries/SeniorCitizensPage'))
const PWDBeneficiariesPage = lazy(() => import('../pages/beneficiaries/PWDBeneficiariesPage'))
const FourPsBeneficiariesPage = lazy(() => import('../pages/beneficiaries/FourPsBeneficiariesPage'))
const SoloParentsPage = lazy(() => import('../pages/beneficiaries/SoloParentsPage'))
const BlotterPage = lazy(() => import('../pages/BlotterPage'))
const IncidentsReportPage = lazy(() => import('../pages/incidents/IncidentsReportPage'))
const RegisterHouseholdPage = lazy(() => import('../pages/households/RegisterHouseholdPage'))
const RegisterResidentPage = lazy(() => import('../pages/residents/RegisterResidentPage'))
const LandmarksPage = lazy(() => import('../pages/LandmarksPage'))
const BarangayClearancePage = lazy(() => import('../pages/certificates/BarangayClearancePage'))
const IndigencyPage = lazy(() => import('../pages/certificates/IndigencyPage'))
const ResidencyPage = lazy(() => import('../pages/certificates/ResidencyPage'))
const SoloParentPage = lazy(() => import('../pages/certificates/SoloParentPage'))

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

const ImmunizationPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <ImmunizationPage />
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

const IncidentsReportPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <IncidentsReportPage />
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

const LandmarksPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <LandmarksPage />
  </Suspense>
)

const BarangayClearancePageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <BarangayClearancePage />
  </Suspense>
)

const IndigencyPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <IndigencyPage />
  </Suspense>
)

const ResidencyPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <ResidencyPage />
  </Suspense>
)

const SoloParentPageWithSuspense = () => (
  <Suspense fallback={<PageLoader />}>
    <SoloParentPage />
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
            path: 'certificates/barangay-clearance',
            element: <BarangayClearancePageWithSuspense />
          },
          {
            path: 'certificates/indigency',
            element: <IndigencyPageWithSuspense />
          },
          {
            path: 'certificates/residency',
            element: <ResidencyPageWithSuspense />
          },
          {
            path: 'certificates/solo-parent',
            element: <SoloParentPageWithSuspense />
          },
          {
            path: 'vaccinations',
            element: <VaccinationsPageWithSuspense />
          },
          {
            path: 'immunization',
            element: <ImmunizationPageWithSuspense />
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
            path: 'officials/sk',
            element: <SKOfficialsPageWithSuspense />
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
            path: 'incidents/report',
            element: <IncidentsReportPageWithSuspense />
          },
          {
            path: 'settings',
            element: <SettingsWithSuspense />
          },
          {
            path: 'map',
            element: <SketchMapWithSuspense />
          },
          {
            path: 'landmarks',
            element: <LandmarksPageWithSuspense />
          }
        ]
      }
    ]
  }
])

export default router


