/* eslint-disable react-refresh/only-export-components -- context is consumed via useAdminAuth */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, adminLogin, getCurrentAdmin, registerOrganization } from '../api/client'
import { clearAdminToken, getAdminToken, setAdminToken, setDemoAdminToken } from './token'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'

export const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [organization, setOrganization] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearAdminToken()
    setAdmin(null)
    setOrganization(null)
  }, [])

  const applySession = useCallback((data) => {
    setAdmin(data.admin ?? null)
    setOrganization(data.organization ?? null)
  }, [])

  /** Demo admin uses a separate token; keep demo out of the main staff session. */
  const detachDemoFromMainSession = useCallback((token) => {
    if (token) {
      setDemoAdminToken(token)
    }
    clearAdminToken()
    setAdmin(null)
    setOrganization(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      setAdmin(null)
      setOrganization(null)
      return false
    }

    try {
      const data = await getCurrentAdmin()
      if (data.organization?.slug === DEMO_ORGANIZATION_SLUG) {
        detachDemoFromMainSession(token)
        return false
      }
      applySession(data)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        clearAdminToken()
      }
      setAdmin(null)
      setOrganization(null)
      return false
    }
  }, [applySession, detachDemoFromMainSession])

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const token = getAdminToken()
      if (!token) {
        if (!cancelled) {
          setAdmin(null)
          setOrganization(null)
          setLoading(false)
        }
        return
      }

      try {
        const data = await getCurrentAdmin()
        if (!cancelled) {
          if (data.organization?.slug === DEMO_ORGANIZATION_SLUG) {
            detachDemoFromMainSession(token)
          } else {
            applySession(data)
          }
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          clearAdminToken()
        }
        if (!cancelled) {
          setAdmin(null)
          setOrganization(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadSession()

    return () => {
      cancelled = true
    }
  }, [applySession, detachDemoFromMainSession])

  const login = useCallback(
    async (email, password) => {
      const data = await adminLogin({ email, password })
      if (data.organization?.slug === DEMO_ORGANIZATION_SLUG) {
        setDemoAdminToken(data.token)
        throw new ApiError(
          'The demo dashboard opens from Home → Open demo. It does not use staff sign-in.',
          'DEMO_NOT_STAFF_LOGIN',
        )
      }
      setAdminToken(data.token)
      applySession(data)
      return { admin: data.admin, organization: data.organization }
    },
    [applySession],
  )

  const register = useCallback(
    async (payload) => {
      const data = await registerOrganization(payload)
      setAdminToken(data.token)
      applySession(data)
      return { admin: data.admin, organization: data.organization }
    },
    [applySession],
  )

  const value = useMemo(
    () => ({
      admin,
      organization,
      loading,
      isAuthenticated: Boolean(admin),
      login,
      register,
      logout,
      refreshSession,
    }),
    [admin, organization, loading, login, register, logout, refreshSession],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
