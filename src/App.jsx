import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import AdminRouteGuard from './components/admin/AdminRouteGuard'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import { DEMO_ORGANIZATION_SLUG } from './constants/demo'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSubmissionDetailPage from './pages/AdminSubmissionDetailPage'
import DemoHomePage from './pages/DemoHomePage'
import LandingPage from './pages/LandingPage'
import OrganizationLandingPage from './pages/OrganizationLandingPage'
import ServePage from './pages/ServePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoHomePage />} />
          <Route
            path="/demo/serve"
            element={<ServePage organizationSlug={DEMO_ORGANIZATION_SLUG} />}
          />
          <Route
            path="/demo/volunteer"
            element={<ServePage organizationSlug={DEMO_ORGANIZATION_SLUG} />}
          />
          <Route path="/demo/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/demo/admin"
            element={
              <ProtectedAdminRoute>
                <AdminDashboardPage />
              </ProtectedAdminRoute>
            }
          />
          <Route
            path="/demo/admin/submissions/:id"
            element={
              <ProtectedAdminRoute>
                <AdminSubmissionDetailPage />
              </ProtectedAdminRoute>
            }
          />
          <Route path="/:organizationSlug/volunteer" element={<ServePage />} />
          <Route path="/:organizationSlug/admin/login" element={<AdminLoginPage />} />
          <Route
            path="/:organizationSlug/admin"
            element={
              <AdminRouteGuard>
                <AdminDashboardPage />
              </AdminRouteGuard>
            }
          />
          <Route
            path="/:organizationSlug/admin/submissions/:id"
            element={
              <AdminRouteGuard>
                <AdminSubmissionDetailPage />
              </AdminRouteGuard>
            }
          />
          <Route path="/:organizationSlug" element={<OrganizationLandingPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
