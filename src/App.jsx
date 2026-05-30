import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  useParams,
} from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import AdminRouteGuard from './components/admin/AdminRouteGuard'
import DemoAdminAutoAuth from './components/admin/DemoAdminAutoAuth'
import { DEMO_ORGANIZATION_SLUG } from './constants/demo'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminFormEditPage from './pages/AdminFormEditPage'
import AdminFormsListPage from './pages/AdminFormsListPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSubmissionDetailPage from './pages/AdminSubmissionDetailPage'
import DemoHomePage from './pages/DemoHomePage'
import LandingPage from './pages/LandingPage'
import OrganizationLandingPage from './pages/OrganizationLandingPage'
import ServePage from './pages/ServePage'
import SignupPage from './pages/SignupPage'
import StaffLoginPage from './pages/StaffLoginPage'
import { organizationAdminFormsPath } from './utils/organizationPaths'
import './App.css'

function AppRoot() {
  return (
    <AdminAuthProvider>
      <Outlet />
    </AdminAuthProvider>
  )
}

function RedirectLegacyAdminForm() {
  const { organizationSlug } = useParams()
  return <Navigate to={organizationAdminFormsPath(organizationSlug)} replace />
}

const router = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'login', element: <StaffLoginPage /> },
      { path: 'demo', element: <DemoHomePage /> },
      {
        path: 'demo/serve',
        element: <Navigate to="/demo/volunteer" replace />,
      },
      {
        path: 'demo/volunteer',
        element: <ServePage organizationSlug={DEMO_ORGANIZATION_SLUG} />,
      },
      {
        path: 'demo/admin/login',
        element: <Navigate to="/demo/admin" replace />,
      },
      {
        path: 'demo/admin',
        element: (
          <DemoAdminAutoAuth>
            <AdminDashboardPage />
          </DemoAdminAutoAuth>
        ),
      },
      {
        path: 'demo/admin/submissions/:id',
        element: (
          <DemoAdminAutoAuth>
            <AdminSubmissionDetailPage />
          </DemoAdminAutoAuth>
        ),
      },
      { path: ':organizationSlug/volunteer', element: <ServePage /> },
      { path: ':organizationSlug/forms/:formSlug', element: <ServePage /> },
      { path: ':organizationSlug/admin/login', element: <AdminLoginPage /> },
      {
        path: ':organizationSlug/admin/form',
        element: (
          <AdminRouteGuard>
            <RedirectLegacyAdminForm />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/forms',
        element: (
          <AdminRouteGuard>
            <AdminFormsListPage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/forms/:formSlug/edit',
        element: (
          <AdminRouteGuard>
            <AdminFormEditPage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/submissions/:id',
        element: (
          <AdminRouteGuard>
            <AdminSubmissionDetailPage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin',
        element: (
          <AdminRouteGuard>
            <AdminDashboardPage />
          </AdminRouteGuard>
        ),
      },
      { path: ':organizationSlug', element: <OrganizationLandingPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
