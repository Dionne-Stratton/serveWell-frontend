import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ApiError, getCurrentAdmin, requestPasswordResetFromProfile } from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
import { adminTeamPath, resolveAdminOrganizationSlug } from '../utils/organizationPaths'

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
  const { admin, organization } = useAdminAuth()
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

          {!demoMode && organizationSlug ? (
            <p className="admin-help">
              <Link to={adminTeamPath(organizationSlug)}>Team</Link> — manage who can
              access this organization.
            </p>
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
                  className={`admin-button admin-button--secondary${resetPending ? ' admin-button--busy' : ''}`}
                  disabled={resetPending}
                  onClick={handleSendResetEmail}
                >
                  {resetPending ? 'Sending…' : 'Send password reset email'}
                </button>
                {resetError ? <p className="admin-error">{resetError}</p> : null}
              </>
            )}
          </section>
        </>
      ) : null}
      <AdminToast message={resetToast} onDismiss={() => setResetToast('')} />
    </AdminLayout>
  )
}
