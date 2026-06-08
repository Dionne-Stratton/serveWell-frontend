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
import AdminDashboardDemoPage from './pages/AdminDashboardDemoPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminVolunteersPage from './pages/AdminVolunteersPage'
import AdminFormCreatePage from './pages/AdminFormCreatePage'
import AdminFormEditPage from './pages/AdminFormEditPage'
import AdminFormViewPage from './pages/AdminFormViewPage'
import AdminFormsListPage from './pages/AdminFormsListPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSubmissionDetailPage from './pages/AdminSubmissionDetailPage'
import AdminSubmissionEditPage from './pages/AdminSubmissionEditPage'
import LandingPage from './pages/LandingPage'
import OrganizationRootRedirect from './pages/OrganizationRootRedirect'
import ServePage from './pages/ServePage'
import SignupPage from './pages/SignupPage'
import StaffLoginPage from './pages/StaffLoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ChurchSlugHintPage from './pages/ChurchSlugHintPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import AdminProfilePage from './pages/AdminProfilePage'
import AcceptInvitePage from './pages/AcceptInvitePage'
import { adminProfilePath, organizationAdminFormsPath } from './utils/organizationPaths'

function RedirectAdminTeamToProfile() {
  const { organizationSlug } = useParams()
  if (!organizationSlug) {
    return <Navigate to="/" replace />
  }
  return <Navigate to={adminProfilePath(organizationSlug)} replace />
}
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

function RedirectLegacyAdminSubmissionDetail() {
  const { organizationSlug, id } = useParams()
  return (
    <Navigate to={`/${organizationSlug}/admin/volunteers/${id}`} replace />
  )
}

function RedirectLegacyAdminSubmissionEdit() {
  const { organizationSlug, id } = useParams()
  return (
    <Navigate to={`/${organizationSlug}/admin/volunteers/${id}/edit`} replace />
  )
}

function RedirectDemoLegacyAdminSubmissionDetail() {
  const { id } = useParams()
  return <Navigate to={`/demo/admin/volunteers/${id}`} replace />
}

const router = createBrowserRouter([
  {
    element: <AppRoot />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'signup', element: <SignupPage /> },
      { path: 'login', element: <StaffLoginPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'church-slug-hint', element: <ChurchSlugHintPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
      { path: 'accept-invite', element: <AcceptInvitePage /> },
      { path: 'demo', element: <Navigate to="/demo/admin" replace /> },
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
            <AdminDashboardDemoPage />
          </DemoAdminAutoAuth>
        ),
      },
      {
        path: 'demo/admin/volunteers',
        element: (
          <DemoAdminAutoAuth>
            <AdminVolunteersPage />
          </DemoAdminAutoAuth>
        ),
      },
      {
        path: 'demo/admin/volunteers/:id',
        element: (
          <DemoAdminAutoAuth>
            <AdminSubmissionDetailPage />
          </DemoAdminAutoAuth>
        ),
      },
      {
        path: 'demo/admin/submissions/:id',
        element: <RedirectDemoLegacyAdminSubmissionDetail />,
      },
      {
        path: 'demo/admin/forms',
        element: (
          <DemoAdminAutoAuth>
            <AdminFormsListPage organizationSlug={DEMO_ORGANIZATION_SLUG} />
          </DemoAdminAutoAuth>
        ),
      },
      {
        path: 'demo/admin/forms/:formSlug',
        element: (
          <DemoAdminAutoAuth>
            <AdminFormViewPage organizationSlug={DEMO_ORGANIZATION_SLUG} />
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
        path: ':organizationSlug/admin/forms/new',
        element: (
          <AdminRouteGuard>
            <AdminFormCreatePage />
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
        path: ':organizationSlug/admin/volunteers',
        element: (
          <AdminRouteGuard>
            <AdminVolunteersPage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/volunteers/:id',
        element: (
          <AdminRouteGuard>
            <AdminSubmissionDetailPage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/volunteers/:id/edit',
        element: (
          <AdminRouteGuard>
            <AdminSubmissionEditPage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/submissions/:id',
        element: (
          <AdminRouteGuard>
            <RedirectLegacyAdminSubmissionDetail />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/submissions/:id/edit',
        element: (
          <AdminRouteGuard>
            <RedirectLegacyAdminSubmissionEdit />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/profile',
        element: (
          <AdminRouteGuard>
            <AdminProfilePage />
          </AdminRouteGuard>
        ),
      },
      {
        path: ':organizationSlug/admin/team',
        element: (
          <AdminRouteGuard>
            <RedirectAdminTeamToProfile />
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
      { path: ':organizationSlug', element: <OrganizationRootRedirect /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])

export default function App() {
  return <RouterProvider router={router} />
}
