import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  getAdminTeam,
  inviteAdminTeamMember,
  removeAdminTeamMember,
  revokeAdminTeamInvite,
} from '../../api/client'
import softBtn from '../../styles/adminSoftButtons.module.css'

const ADMIN_MEMBER_LIST_STORAGE_KEY = 'servewell_profile_admin_member_list_expanded'

function readAdminMemberListExpanded() {
  try {
    const stored = localStorage.getItem(ADMIN_MEMBER_LIST_STORAGE_KEY)
    if (stored === 'false') {
      return false
    }
    if (stored === 'true') {
      return true
    }
  } catch {
    // ignore unavailable storage
  }
  return true
}

function persistAdminMemberListExpanded(expanded) {
  try {
    localStorage.setItem(ADMIN_MEMBER_LIST_STORAGE_KEY, expanded ? 'true' : 'false')
  } catch {
    // ignore
  }
}

function labelRole(role) {
  if (role === 'owner') return 'Owner'
  if (role === 'admin') return 'Admin'
  return role ?? '—'
}

export default function AdminProfileTeamSection({ demoMode }) {
  const [team, setTeam] = useState(null)
  const [loading, setLoading] = useState(!demoMode)
  const [error, setError] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState('')
  const [invitePending, setInvitePending] = useState(false)
  const [actionPendingId, setActionPendingId] = useState(null)
  const [membersExpanded, setMembersExpanded] = useState(readAdminMemberListExpanded)

  function toggleMembersExpanded() {
    setMembersExpanded((current) => {
      const next = !current
      persistAdminMemberListExpanded(next)
      return next
    })
  }

  const loadTeam = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminTeam()
      setTeam(data)
    } catch (err) {
      setTeam(null)
      setError(err instanceof ApiError ? err.message : 'Unable to load admins.')
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
      setError(err instanceof ApiError ? err.message : 'Unable to remove admin.')
    } finally {
      setActionPendingId(null)
    }
  }

  if (demoMode) {
    return (
      <section className="admin-detail-section">
        <h2 className="admin-detail-section__title">Admin</h2>
        <p className="admin-muted">Admin management is not shown in the demo environment.</p>
      </section>
    )
  }

  const memberCount = team?.members?.length ?? 0

  return (
    <section className="admin-detail-section admin-profile-admin-card">
      <div className="admin-profile-admin-card__header">
        <h2 className="admin-detail-section__title admin-profile-admin-card__title">Admin</h2>
        {memberCount > 0 ? (
          <button
            type="button"
            className="admin-profile-admin-list__toggle"
            aria-expanded={membersExpanded}
            aria-controls="profile-admin-member-list"
            onClick={toggleMembersExpanded}
          >
            <span className="admin-profile-admin-list__chevron" aria-hidden>
              {membersExpanded ? '▾' : '▸'}
            </span>
            <span className="admin-profile-admin-list__toggle-text">
              {membersExpanded ? 'Hide' : 'Show'} ({memberCount})
            </span>
          </button>
        ) : null}
      </div>

      {loading ? <p className="admin-loading">Loading…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {team ? (
        <>
          {membersExpanded && memberCount > 0 ? (
            <div className="admin-profile-admin-member-panel">
              <ul id="profile-admin-member-list" className="admin-team-list">
                {team.members.map((member) => (
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
            </div>
          ) : null}

          <div className="admin-profile-admin-card__below-list">
            {team.pendingInvites?.length ? (
              <>
                <h3 className="admin-profile-team__subtitle">Pending invitations</h3>
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
              </>
            ) : null}

            {canManage ? (
              <div className="admin-profile-admin-invite">
                <h3 className="admin-profile-team__subtitle">Invite admin</h3>
                <p className="admin-muted admin-team-invite-note">
                  Anyone you invite will use your organization&apos;s shared Planning Center
                  connection in ServeWell—the same one connected on the dashboard.
                </p>
                <form className="admin-field-row" onSubmit={handleInvite}>
                  <div className="admin-field admin-field--grow">
                    <label className="admin-label" htmlFor="profile-team-invite-email">
                      Email
                    </label>
                    <input
                      id="profile-team-invite-email"
                      className="admin-input"
                      type="email"
                      value={inviteEmail}
                      onChange={(event) => setInviteEmail(event.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className={`${softBtn.softBtn} ${softBtn.matchFieldInput}${invitePending ? ` ${softBtn.saveBtnBusy}` : ''}`}
                    disabled={invitePending || !inviteEmail.trim()}
                  >
                    {invitePending ? 'Sending…' : 'Send invite'}
                  </button>
                </form>
                {inviteError ? <p className="admin-error">{inviteError}</p> : null}
                {inviteSuccess ? <p className="admin-success">{inviteSuccess}</p> : null}
              </div>
            ) : (
              <p className="admin-muted admin-profile-team__owner-note">
                Only the organization owner can invite or remove admins.
              </p>
            )}
          </div>
        </>
      ) : null}
    </section>
  )
}
