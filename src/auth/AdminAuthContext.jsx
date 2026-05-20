/* eslint-disable react-refresh/only-export-components -- context is consumed via useAdminAuth */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError, adminLogin, fetchAdminMe } from '../api/client'
import { clearAdminToken, getAdminToken, setAdminToken } from './token'

export const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    clearAdminToken()
    setAdmin(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const token = getAdminToken()
    if (!token) {
      setAdmin(null)
      return false
    }

    try {
      const data = await fetchAdminMe()
      setAdmin(data.admin ?? null)
      return true
    } catch (error) {
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        clearAdminToken()
      }
      setAdmin(null)
      return false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadSession() {
      const token = getAdminToken()
      if (!token) {
        if (!cancelled) {
          setAdmin(null)
          setLoading(false)
        }
        return
      }

      try {
        const data = await fetchAdminMe()
        if (!cancelled) {
          setAdmin(data.admin ?? null)
        }
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          clearAdminToken()
        }
        if (!cancelled) {
          setAdmin(null)
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
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await adminLogin({ email, password })
    setAdminToken(data.token)
    setAdmin(data.admin)
    return data.admin
  }, [])

  const value = useMemo(
    () => ({
      admin,
      loading,
      isAuthenticated: Boolean(admin),
      login,
      logout,
      refreshSession
    }),
    [admin, loading, login, logout, refreshSession]
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}
