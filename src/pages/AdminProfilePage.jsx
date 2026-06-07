import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminOrganization,
  getCurrentAdmin,
  requestPasswordResetFromProfile,
} from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import DeleteOrganizationDialog from '../components/admin/DeleteOrganizationDialog'
import AdminToast from '../components/admin/AdminToast'
import softBtn from '../styles/adminSoftButtons.module.css'
import { resolveAdminOrganizationSlug } from '../utils/organizationPaths'

const ORG_TYPE_LABELS = {
  church: 'Church',
  ministry: 'Ministry',
  other: 'Other',
}

function labelOrgType(value) {
  return ORG_TYPE_LABELS[value] ?? value ?? '—'
}

function ProfileRow({ label, value }) {
  return (
    <div className="admin-detail-row">
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  )
}

export default function AdminProfilePage() {
  const { organizationSlug: organizationSlugParam } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { admin, organization, logout } = useAdminAuth()
  const organizationSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const demoMode = pathname.startsWith('/demo/admin')
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState('')
  const [resetToast, setResetToast] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetPending, setResetPending] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const loadProfile = useCallback(async () => {
    if (demoMode) {
      setProfile({ admin, organization })
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await getCurrentAdmin()
      setProfile(data)
    } catch (err) {
      setProfile(null)
      setError(
        err instanceof ApiError ? err.message : 'Unable to load your profile.',
      )
    } finally {
      setLoading(false)
    }
  }, [admin, demoMode, organization])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleSendResetEmail() {
    setResetError('')
    setResetToast('')
    setResetPending(true)

    try {
      await requestPasswordResetFromProfile()
      setResetToast('Email sent')
    } catch (err) {
      setResetError(
        err instanceof ApiError
          ? err.message
          : 'Unable to send reset email. Try again later.',
      )
    } finally {
      setResetPending(false)
    }
  }

  const sessionAdmin = profile?.admin ?? admin
  const sessionOrg = profile?.organization ?? organization
  const isOwner = sessionAdmin?.role === 'owner'

  async function handleConfirmDeleteOrganization() {
    if (!sessionOrg?.slug) {
      return
    }

    setDeleteError('')
    setDeletePending(true)

    try {
      await deleteAdminOrganization(sessionOrg.slug)
      setDeleteDialogOpen(false)
      logout()
      navigate('/login', {
        replace: true,
        state: { flashSuccess: 'Organization deleted.' },
      })
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : 'Unable to delete this organization.',
      )
      setDeletePending(false)
    }
  }

  return (
    <AdminLayout title="Your account">
      {loading ? <p className="admin-loading">Loading profile…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {sessionAdmin ? (
        <>
          <section className="admin-detail-section">
            <h2 className="admin-detail-section__title">You</h2>
            <dl className="admin-dl">
              <ProfileRow label="Name" value={sessionAdmin.displayName} />
              <ProfileRow label="Sign-in email" value={sessionAdmin.email} />
              <ProfileRow
                label="Role"
                value={
                  sessionAdmin.role === 'owner'
                    ? 'Owner'
                    : sessionAdmin.role === 'admin'
                      ? 'Admin'
                      : sessionAdmin.role
                }
              />
            </dl>
          </section>

          {sessionOrg ? (
            <section className="admin-detail-section">
              <h2 className="admin-detail-section__title">Organization</h2>
              <dl className="admin-dl">
                <ProfileRow label="Name" value={sessionOrg.name} />
                <ProfileRow
                  label="Dashboard URL"
                  value={
                    organizationSlug ? `/${organizationSlug}/admin` : sessionOrg.slug
                  }
                />
                <ProfileRow
                  label="Type"
                  value={labelOrgType(sessionOrg.organizationType)}
                />
                <ProfileRow
                  label="Contact email"
                  value={sessionOrg.contactEmail}
                />
                <ProfileRow label="Website" value={sessionOrg.websiteUrl} />
              </dl>
            </section>
          ) : null}

          <section className="admin-detail-section">
            <h2 className="admin-detail-section__title">Password</h2>
            {demoMode ? (
              <p className="admin-notes-intro">
                Password reset is not available in the demo environment.
              </p>
            ) : (
              <>
                <button
                  type="button"
                  className={softBtn.softBtn}
                  disabled={resetPending}
                  onClick={handleSendResetEmail}
                >
                  {resetPending ? 'Sending…' : 'Send password reset email'}
                </button>
                {resetError ? <p className="admin-error">{resetError}</p> : null}
              </>
            )}
          </section>

          {isOwner && !demoMode && sessionOrg?.slug ? (
            <section
              className="admin-detail-section admin-profile-danger"
              aria-labelledby="profile-danger-heading"
            >
              <h2 id="profile-danger-heading" className="admin-detail-section__title">
                Danger zone
              </h2>
              <p className="admin-muted admin-profile-danger__lead">
                Permanently delete this organization and all ServeWell data for it, including
                every admin account. Planning Center People records are not changed.
              </p>
              <button
                type="button"
                className={softBtn.softBtnDanger}
                onClick={() => {
                  setDeleteError('')
                  setDeleteDialogOpen(true)
                }}
              >
                Delete organization…
              </button>
            </section>
          ) : null}
        </>
      ) : null}
      <AdminToast message={resetToast} onDismiss={() => setResetToast('')} />
      <DeleteOrganizationDialog
        open={deleteDialogOpen}
        organizationName={sessionOrg?.name}
        organizationSlug={sessionOrg?.slug}
        deleting={deletePending}
        error={deleteError}
        onConfirm={handleConfirmDeleteOrganization}
        onCancel={() => {
          if (!deletePending) {
            setDeleteDialogOpen(false)
            setDeleteError('')
          }
        }}
      />
    </AdminLayout>
  )
}
