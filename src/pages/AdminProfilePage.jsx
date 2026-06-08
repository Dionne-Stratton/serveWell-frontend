import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminOrganization,
  getCurrentAdmin,
  patchAdminMe,
  patchAdminOrganization,
  patchAdminNotificationPreferences,
  requestPasswordResetFromProfile,
} from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import AdminProfileTeamSection from '../components/admin/AdminProfileTeamSection'
import EditableOrganizationSection from '../components/admin/EditableOrganizationSection'
import EditableProfileField from '../components/admin/EditableProfileField'
import DeleteOrganizationDialog from '../components/admin/DeleteOrganizationDialog'
import AdminToast from '../components/admin/AdminToast'
import softBtn from '../styles/adminSoftButtons.module.css'
import { resolveAdminOrganizationSlug } from '../utils/organizationPaths'

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
  const { admin, organization, logout, refreshSession } = useAdminAuth()
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
  const [notificationPrefs, setNotificationPrefs] = useState(null)
  const [notifyPrefsSaving, setNotifyPrefsSaving] = useState(false)
  const [notifyPrefsError, setNotifyPrefsError] = useState('')

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
      setNotificationPrefs(
        data.notificationPreferences ?? {
          newSubmissions: true,
          readyToSchedule: false,
          volunteerUpdated: false,
          adminJoined: data.admin?.role === 'owner',
        },
      )
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

  async function handleNotificationPrefChange(key, checked) {
    if (demoMode || !notificationPrefs) {
      return
    }

    const previous = notificationPrefs
    const next = { ...notificationPrefs, [key]: checked }
    setNotificationPrefs(next)
    setNotifyPrefsError('')
    setNotifyPrefsSaving(true)

    try {
      const payload =
        key === 'newSubmissions'
          ? { newSubmissions: checked }
          : key === 'adminJoined'
            ? { adminJoined: checked }
            : { readyToSchedule: checked }
      const data = await patchAdminNotificationPreferences(payload)
      setNotificationPrefs(data.notificationPreferences ?? next)
      setProfile((current) =>
        current ? { ...current, notificationPreferences: data.notificationPreferences } : current,
      )
    } catch (err) {
      setNotificationPrefs(previous)
      setNotifyPrefsError(
        err instanceof ApiError ? err.message : 'Unable to save notification preferences.',
      )
    } finally {
      setNotifyPrefsSaving(false)
    }
  }

  async function handleSaveOrganization(payload) {
    const data = await patchAdminOrganization(payload)
    setProfile(data)
    setNotificationPrefs(
      data.notificationPreferences ?? notificationPrefs,
    )
    await refreshSession()
  }

  async function handleSaveProfileField(field, value) {
    const data = await patchAdminMe(
      field === 'displayName' ? { displayName: value } : { email: value },
    )
    setProfile(data)
    setNotificationPrefs(
      data.notificationPreferences ?? notificationPrefs,
    )
    await refreshSession()
  }

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
              <EditableProfileField
                label="Name"
                value={sessionAdmin.displayName}
                disabled={demoMode}
                autoComplete="name"
                onSave={(value) => handleSaveProfileField('displayName', value)}
              />
              <EditableProfileField
                label="Sign-in email"
                value={sessionAdmin.email}
                inputType="email"
                disabled={demoMode}
                autoComplete="email"
                onSave={(value) => handleSaveProfileField('email', value)}
              />
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
            <EditableOrganizationSection
              organization={sessionOrg}
              canEdit={isOwner && !demoMode}
              onSave={handleSaveOrganization}
            />
          ) : null}

          <AdminProfileTeamSection demoMode={demoMode} />

          <section className="admin-detail-section">
            <h2 className="admin-detail-section__title">Notifications</h2>
            {demoMode ? (
              <p className="admin-notes-intro">
                Email notifications are not available in the demo environment.
              </p>
            ) : notificationPrefs ? (
              <>
                <p className="admin-muted admin-profile-notify__lead">
                  Choose which volunteer activity emails you receive for this organization.
                </p>
                <div className="admin-profile-notify__list">
                  <label className="admin-choice admin-choice--inline">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.newSubmissions}
                      disabled={notifyPrefsSaving}
                      onChange={(event) =>
                        handleNotificationPrefChange('newSubmissions', event.target.checked)
                      }
                    />
                    <span>New volunteer submissions</span>
                  </label>
                  <label className="admin-choice admin-choice--inline">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.readyToSchedule}
                      disabled={notifyPrefsSaving}
                      onChange={(event) =>
                        handleNotificationPrefChange('readyToSchedule', event.target.checked)
                      }
                    />
                    <span>Submissions marked ready to schedule</span>
                  </label>
                  {isOwner ? (
                    <label className="admin-choice admin-choice--inline">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.adminJoined === true}
                        disabled={notifyPrefsSaving}
                        onChange={(event) =>
                          handleNotificationPrefChange('adminJoined', event.target.checked)
                        }
                      />
                      <span>Invited admin joins your organization</span>
                    </label>
                  ) : null}
                  <label className="admin-choice admin-choice--inline admin-choice--disabled">
                    <input type="checkbox" checked={false} disabled />
                    <span>
                      Volunteer updated their submission{' '}
                      <span className="admin-muted">(Coming soon)</span>
                    </span>
                  </label>
                </div>
                {notifyPrefsError ? <p className="admin-error">{notifyPrefsError}</p> : null}
              </>
            ) : null}
          </section>

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
