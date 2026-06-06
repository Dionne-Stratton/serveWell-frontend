import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import {
  ApiError,
  getAdminTeam,
  inviteAdminTeamMember,
  removeAdminTeamMember,
  revokeAdminTeamInvite,
} from '../api/client'
import { useAdminAuth } from '../auth/useAdminAuth'
import AdminLayout from '../components/admin/AdminLayout'
import softBtn from '../styles/adminSoftButtons.module.css'
import {
  adminProfilePath,
  resolveAdminOrganizationSlug,
} from '../utils/organizationPaths'

function labelRole(role) {
  if (role === 'owner') return 'Owner'
  if (role === 'admin') return 'Admin'
  return role ?? '—'
}

export default function AdminTeamPage() {
  const { organizationSlug: organizationSlugParam } = useParams()
  const { pathname } = useLocation()
  const { organization } = useAdminAuth()
  const organizationSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const demoMode = pathname.startsWith('/demo/admin')
  const profilePath = organizationSlug ? adminProfilePath(organizationSlug) : null

  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [invitePending, setInvitePending] = useState(false)
  const [actionPendingId, setActionPendingId] = useState(null)

  const loadTeam = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminTeam()
      setTeam(data)
    } catch (err) {
      setTeam(null)
      setError(err instanceof ApiError ? err.message : 'Unable to load team.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!demoMode) {
      loadTeam()
    } else {
      setLoading(false)
    }
  }, [demoMode, loadTeam])

  const canManage = team?.canManage === true

  async function handleInvite(event) {
    event.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInvitePending(true)

    try {
      await inviteAdminTeamMember(inviteEmail.trim())
      setInviteEmail('')
      setInviteSuccess('Invitation sent.')
      await loadTeam()
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.message : 'Unable to send invitation.')
    } finally {
      setInvitePending(false)
    }
  }

  async function handleRevokeInvite(inviteId) {
    setActionPendingId(`invite-${inviteId}`)
    try {
      await revokeAdminTeamInvite(inviteId)
      await loadTeam()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to revoke invitation.')
    } finally {
      setActionPendingId(null)
    }
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm('Remove this admin from your organization?')) {
      return
    }

    setActionPendingId(`member-${memberId}`)
    try {
      await removeAdminTeamMember(memberId)
      await loadTeam()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to remove team member.')
    } finally {
      setActionPendingId(null)
    }
  }

  return (
    <AdminLayout title="Team">
      {profilePath ? (
        <p className="admin-back">
          <Link to={profilePath}>← Your account</Link>
        </p>
      ) : null}

      {demoMode ? (
        <p className="admin-muted">
          Team management is not shown in the demo environment.
        </p>
      ) : null}

      {loading ? <p className="admin-loading">Loading team…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!demoMode && team ? (
        <>
          <section className="admin-detail-section">
            <h2 className="admin-detail-section__title">Members</h2>
            <ul className="admin-team-list">
              {team.members?.map((member) => (
                <li key={member.id} className="admin-team-list__item">
                  <div>
                    <strong>{member.displayName}</strong>
                    <span className="admin-muted admin-team-list__meta">
                      {member.email} · {labelRole(member.role)}
                    </span>
                  </div>
                  {canManage && member.role === 'admin' ? (
                    <button
                      type="button"
                      className={softBtn.softBtnDanger}
                      disabled={actionPendingId === `member-${member.id}`}
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {team.pendingInvites?.length ? (
            <section className="admin-detail-section">
              <h2 className="admin-detail-section__title">Pending invitations</h2>
              <ul className="admin-team-list">
                {team.pendingInvites.map((invite) => (
                  <li key={invite.id} className="admin-team-list__item">
                    <span>{invite.email}</span>
                    {canManage ? (
                      <button
                        type="button"
                        className="admin-link-button"
                        disabled={actionPendingId === `invite-${invite.id}`}
                        onClick={() => handleRevokeInvite(invite.id)}
                      >
                        Revoke
                      </button>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {canManage ? (
            <section className="admin-detail-section">
              <h2 className="admin-detail-section__title">Invite admin</h2>
              <form className="admin-field-row" onSubmit={handleInvite}>
                <div className="admin-field admin-field--grow">
                  <label className="admin-label" htmlFor="team-invite-email">
                    Email
                  </label>
                  <input
                    id="team-invite-email"
                    className="admin-input"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className={`admin-button admin-button--inline${invitePending ? ' admin-button--busy' : ''}`}
                  disabled={invitePending || !inviteEmail.trim()}
                >
                  {invitePending ? 'Sending…' : 'Send invite'}
                </button>
              </form>
              {inviteError ? <p className="admin-error">{inviteError}</p> : null}
              {inviteSuccess ? <p className="admin-success">{inviteSuccess}</p> : null}
            </section>
          ) : (
            <p className="admin-muted">Only the organization owner can invite or remove admins.</p>
          )}
        </>
      ) : null}
    </AdminLayout>
  )
}
