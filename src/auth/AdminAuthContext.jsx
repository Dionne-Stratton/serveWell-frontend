/* eslint-disable react-refresh/only-export-components -- context is consumed via useAdminAuth */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, adminLogin, getCurrentAdmin, registerOrganization } from '../api/client'
import { clearAdminToken, getAdminToken, setAdminToken } from './token'

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

  const refreshSession = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      setAdmin(null)
      setOrganization(null)
      return false
    }

    try {
      const data = await getCurrentAdmin()
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
  }, [applySession])

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
          applySession(data)
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
  }, [applySession])

  const login = useCallback(
    async (email, password) => {
      const data = await adminLogin({ email, password })
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
