import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import AdminRouteGuard from './components/admin/AdminRouteGuard'
import DemoAdminAutoAuth from './components/admin/DemoAdminAutoAuth'
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
            element={<Navigate to="/demo/volunteer" replace />}
          />
          <Route
            path="/demo/volunteer"
            element={<ServePage organizationSlug={DEMO_ORGANIZATION_SLUG} />}
          />
          <Route
            path="/demo/admin/login"
            element={<Navigate to="/demo/admin" replace />}
          />
          <Route
            path="/demo/admin"
            element={
              <DemoAdminAutoAuth>
                <AdminDashboardPage />
              </DemoAdminAutoAuth>
            }
          />
          <Route
            path="/demo/admin/submissions/:id"
            element={
              <DemoAdminAutoAuth>
                <AdminSubmissionDetailPage />
              </DemoAdminAutoAuth>
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
