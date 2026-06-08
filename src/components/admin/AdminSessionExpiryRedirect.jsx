import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import { ADMIN_SESSION_EXPIRED_EVENT } from '../../auth/adminSessionExpiry'

/**
 * Sends staff to login when an authenticated API call returns 401 / UNAUTHORIZED.
 */
export default function AdminSessionExpiryRedirect() {
  const navigate = useNavigate()
  const { logout } = useAdminAuth()

  useEffect(() => {
    function handleSessionExpired(event) {
      const loginPath = event.detail?.loginPath ?? '/login'
      logout()
      navigate(loginPath, { replace: true, state: { sessionExpired: true } })
    }

    window.addEventListener(ADMIN_SESSION_EXPIRED_EVENT, handleSessionExpired)
    return () => {
      window.removeEventListener(ADMIN_SESSION_EXPIRED_EVENT, handleSessionExpired)
    }
  }, [logout, navigate])

  return null
}
