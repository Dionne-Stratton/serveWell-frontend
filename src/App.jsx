import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import ProtectedAdminRoute from './components/admin/ProtectedAdminRoute'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminLoginPage from './pages/AdminLoginPage'
import AdminSubmissionDetailPage from './pages/AdminSubmissionDetailPage'
import DemoHomePage from './pages/DemoHomePage'
import LandingPage from './pages/LandingPage'
import ServePage from './pages/ServePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/demo" element={<DemoHomePage />} />
          <Route path="/demo/serve" element={<ServePage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  )
}
