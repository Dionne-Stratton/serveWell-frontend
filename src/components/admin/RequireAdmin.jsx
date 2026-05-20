import { Navigate, useLocation } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import '../../styles/admin.css'

export default function RequireAdmin({ children }) {
  const { admin, loading } = useAdminAuth()
  const location = useLocation()

  if (loading) {
    return <p className="admin-loading">Checking your session…</p>
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  return children
}
