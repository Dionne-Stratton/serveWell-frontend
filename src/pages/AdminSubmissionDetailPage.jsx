import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth'
import {
  adminVolunteerEditPath,
  adminVolunteersPath,
  resolveAdminOrganizationSlug,
} from '../utils/organizationPaths'
import {
  ApiError,
  createAdminSubmissionNote,
  deleteAdminNote,
  deleteAdminSubmission,
  getAdminSubmissionDetail,
  getPlanningCenterIntegration,
  pushAdminSubmissionToPlanningCenter,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import DeleteVolunteerSubmissionDialog from '../components/admin/DeleteVolunteerSubmissionDialog'
import AdminSubmissionStatusSelect from '../components/admin/AdminSubmissionStatusSelect'
import softBtn from '../styles/adminSoftButtons.module.css'
import {
  formatAvailabilityList,
  formatDateTime,
  labelExperience,
  labelFrequency,
  labelPreferredContact,
} from '../constants/labels'

function DetailIcon({ children, className = '' }) {
  return (
    <span className={`admin-detail-icon${className ? ` ${className}` : ''}`} aria-hidden>
      {children}
    </span>
  )
}

function IconCalendar() {
  return (
    <DetailIcon>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M7 3v3M17 3v3M4 8h16M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z" />
      </svg>
    </DetailIcon>
  )
}

function IconRefresh() {
  return (
    <DetailIcon className="admin-detail-icon--accent">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </DetailIcon>
  )
}

function IconWarning() {
  return (
    <DetailIcon className="admin-detail-icon--warn">
      <svg viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2 2 20h20L12 2zm0 5.5a1 1 0 0 1 1 1v5a1 1 0 1 1-2 0v-5a1 1 0 0 1 1-1zm0 10.25a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5z" />
      </svg>
    </DetailIcon>
  )
}

function IconCheckCircle() {
  return (
    <DetailIcon className="admin-detail-icon--ok">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </DetailIcon>
  )
}

function IconPencil() {
  return (
    <DetailIcon className="admin-detail-icon--inline-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path
          d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </DetailIcon>
  )
}

function IconContact() {
  return (
    <DetailIcon className="admin-detail-icon--section">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    </DetailIcon>
  )
}

function DetailSection({ title, children, titleIcon = null }) {
  return (
    <section className="admin-detail-section">
      <h2 className="admin-detail-section__title">
        {titleIcon ? (
          <span className="admin-detail-section__title-mark">{titleIcon}</span>
        ) : null}
        <span>{title}</span>
      </h2>
      {children}
    </section>
  )
}

function DetailRow({ label, value }) {
  return (
    <div className="admin-detail-row">
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  )
}

function formatAdminActorLabel(actor) {
  if (!actor) {
    return ''
  }
  const name = actor.displayName?.trim()
  const email = actor.email?.trim()
  if (name && email && name.toLowerCase() !== email.toLowerCase()) {
    return `${name} (${email})`
  }
  return name || email || ''
}

function formatPlanningCenterSyncedLine(submission) {
  if (!submission?.planningCenterSyncedAt || !submission?.planningCenterSyncedBy) {
    return null
  }
  const who = formatAdminActorLabel(submission.planningCenterSyncedBy)
  return `Last synced to Planning Center ${formatDateTime(submission.planningCenterSyncedAt)} by ${who}`
}

export default function AdminSubmissionDetailPage() {
  const { id, organizationSlug: organizationSlugParam } = useParams()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { organization } = useAdminAuth()
  const organizationSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const volunteersPath = adminVolunteersPath(organizationSlug)
  const demoMode = pathname.startsWith('/demo/admin')
  const editPath = demoMode ? null : adminVolunteerEditPath(organizationSlug, id)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [planningCenterIntegration, setPlanningCenterIntegration] = useState(null)
  const [planningCenterPushPending, setPlanningCenterPushPending] = useState(false)
  const [planningCenterPushError, setPlanningCenterPushError] = useState('')
  const [noteDraft, setNoteDraft] = useState('')
  const [noteError, setNoteError] = useState('')
  const [noteSubmitting, setNoteSubmitting] = useState(false)
  const [deletingNoteId, setDeletingNoteId] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [saveNotice, setSaveNotice] = useState('')
  const location = useLocation()

  const loadDetail = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminSubmissionDetail(id)
      setDetail(data)
    } catch (err) {
      setDetail(null)
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load this volunteer.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadDetail()
  }, [loadDetail])

  useEffect(() => {
    if (!location.state?.submissionSaved) {
      return
    }

    setSaveNotice(
      location.state.planningCenterStale
        ? 'Submission saved. This submission has been edited since it was last synced. Sync to Planning Center to update the external record.'
        : 'Submission saved.',
    )
    navigate(pathname, { replace: true, state: null })
  }, [location.state, navigate, pathname])

  useEffect(() => {
    if (demoMode) {
      setPlanningCenterIntegration(null)
      return
    }

    let cancelled = false

    async function loadIntegration() {
      try {
        const data = await getPlanningCenterIntegration()
        if (!cancelled) {
          setPlanningCenterIntegration(data.integration ?? null)
        }
      } catch {
        if (!cancelled) {
          setPlanningCenterIntegration(null)
        }
      }
    }

    loadIntegration()

    return () => {
      cancelled = true
    }
  }, [demoMode])

  async function handleAddNote(event) {
    event.preventDefault()
    const text = noteDraft.trim()
    if (!text) {
      return
    }

    setNoteError('')
    setNoteSubmitting(true)

    try {
      await createAdminSubmissionNote(id, text)
      setNoteDraft('')
      const data = await getAdminSubmissionDetail(id)
      setDetail(data)
    } catch (err) {
      setNoteError(
        err instanceof ApiError ? err.message : 'Unable to save that note.',
      )
    } finally {
      setNoteSubmitting(false)
    }
  }

  async function handleDeleteNote(noteId) {
    setNoteError('')
    setDeletingNoteId(noteId)

    try {
      await deleteAdminNote(noteId)
      const data = await getAdminSubmissionDetail(id)
      setDetail(data)
    } catch (err) {
      setNoteError(
        err instanceof ApiError ? err.message : 'Unable to delete that note.',
      )
    } finally {
      setDeletingNoteId(null)
    }
  }

  const submission = detail?.submission
  const planningCenterSyncedLine = submission
    ? formatPlanningCenterSyncedLine(submission)
    : null
  const isPlanningCenterConnected =
    planningCenterIntegration?.status === 'connected' &&
    planningCenterIntegration?.tokenUsable === true
  const planningCenterNeedsReconnect =
    planningCenterIntegration?.status === 'connected' &&
    planningCenterIntegration?.tokenUsable === false
  const hasEmailOrPhone =
    Boolean(submission?.email?.trim()) || Boolean(submission?.phone?.trim())
  const isLinkedToPlanningCenter = Boolean(
    submission?.planningCenterPersonId?.trim(),
  )
  const stalePlanningCenterSync = Boolean(submission?.editedSinceLastPlanningCenterSync)
  const planningCenterUpToDate =
    isLinkedToPlanningCenter &&
    !stalePlanningCenterSync &&
    Boolean(submission?.planningCenterSyncedAt)
  const showStaleSyncMessage =
    stalePlanningCenterSync || Boolean(saveNotice && saveNotice.includes('synced'))
  const showEditBanner = Boolean(
    editPath || saveNotice || stalePlanningCenterSync || planningCenterUpToDate,
  )
  const editBannerTone = showStaleSyncMessage
    ? 'warn'
    : planningCenterUpToDate
      ? 'synced'
      : 'plain'
  const canPushToPlanningCenter =
    !demoMode &&
    isPlanningCenterConnected &&
    hasEmailOrPhone &&
    !planningCenterPushPending

  let planningCenterDisabledReason = ''
  if (!demoMode && submission) {
    if (planningCenterNeedsReconnect) {
      planningCenterDisabledReason =
        'Planning Center sign-in expired. Your organization owner must reconnect from the dashboard.'
    } else if (!isPlanningCenterConnected) {
      planningCenterDisabledReason =
        'Connect Planning Center from your dashboard first.'
    } else if (!hasEmailOrPhone) {
      planningCenterDisabledReason =
        'This volunteer needs an email address or phone number before they can be added to Planning Center.'
    }
  }

  async function handleConfirmDeleteSubmission() {
    setDeleteError('')
    setDeletePending(true)

    try {
      await deleteAdminSubmission(id)
      navigate(volunteersPath, { replace: true })
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : 'Unable to delete this volunteer.',
      )
      setDeletePending(false)
    }
  }

  async function handleAddToPlanningCenter() {
    if (!canPushToPlanningCenter) {
      return
    }

    setPlanningCenterPushError('')
    setPlanningCenterPushPending(true)

    try {
      await pushAdminSubmissionToPlanningCenter(id)
      setSaveNotice('')
      await loadDetail()
    } catch (err) {
      setPlanningCenterPushError(
        err instanceof ApiError
          ? err.message
          : isLinkedToPlanningCenter
            ? 'Unable to sync this volunteer to Planning Center.'
            : 'Unable to add this volunteer to Planning Center.',
      )
    } finally {
      setPlanningCenterPushPending(false)
    }
  }

  return (
    <AdminLayout
      title={
        submission
          ? `${submission.firstName} ${submission.lastName}`
          : 'Volunteer detail'
      }
    >
      <p className="admin-back">
        <Link to={volunteersPath}>← Back to volunteers</Link>
      </p>

      {loading ? <p className="admin-loading">Loading volunteer…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {submission ? (
        <>
          <section className="admin-detail-section admin-detail-toolbar">
            <div className="admin-detail-toolbar__row">
              <p className="admin-detail-toolbar__submitted">
                <IconCalendar />
                <span>Submitted {formatDateTime(submission.createdAt)}</span>
              </p>
              {!demoMode ? (
                <div className="admin-detail-toolbar__sync">
                  <div className="admin-planning-center-row">
                    <button
                      type="button"
                      className={`admin-button admin-button--inline admin-button--planning-center admin-button--planning-center-outline${planningCenterPushPending ? ' admin-button--busy' : ''}`}
                      disabled={!canPushToPlanningCenter}
                      onClick={handleAddToPlanningCenter}
                    >
                      {planningCenterPushPending
                        ? isLinkedToPlanningCenter
                          ? 'Syncing…'
                          : 'Sending…'
                        : isLinkedToPlanningCenter
                          ? 'Sync to Planning Center'
                          : 'Add to Planning Center'}
                    </button>
                    {planningCenterDisabledReason ? (
                      <span className="admin-info-tip">
                        <button
                          type="button"
                          className="admin-info-mark"
                          aria-label={planningCenterDisabledReason}
                        >
                          i
                        </button>
                        <span className="admin-info-tip__bubble" role="tooltip">
                          {planningCenterDisabledReason}
                        </span>
                      </span>
                    ) : null}
                  </div>
                  {planningCenterPushError ? (
                    <p className="admin-error admin-detail-toolbar__sync-error">
                      {planningCenterPushError}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
            <div className="admin-detail-toolbar__row admin-detail-toolbar__row--main">
              <div className="admin-detail-toolbar__status">
                <AdminSubmissionStatusSelect
                  submissionId={submission.id}
                  status={submission.status}
                  label="Status"
                  inline
                  autosavedHint="below"
                  onUpdated={(nextStatus) =>
                    setDetail((current) =>
                      current
                        ? {
                            ...current,
                            submission: { ...current.submission, status: nextStatus },
                          }
                        : current,
                    )
                  }
                />
                {submission.isArchived ? (
                  <span className="admin-tag admin-tag--muted">Archived</span>
                ) : null}
              </div>
              {!demoMode && planningCenterSyncedLine ? (
                <div className="admin-detail-toolbar__pc-sync">
                  <IconRefresh />
                  <p>{planningCenterSyncedLine}</p>
                </div>
              ) : null}
            </div>
          </section>

          {showEditBanner ? (
            <div
              className={[
                'admin-detail-edit-banner',
                editBannerTone === 'warn'
                  ? 'admin-detail-edit-banner--warn'
                  : editBannerTone === 'synced'
                    ? 'admin-detail-edit-banner--synced'
                    : 'admin-detail-edit-banner--plain',
              ].join(' ')}
            >
              {saveNotice && !showStaleSyncMessage ? (
                <p className="admin-success admin-detail-edit-banner__saved">{saveNotice}</p>
              ) : null}
              {showStaleSyncMessage ? (
                <>
                  <IconWarning />
                  <div className="admin-detail-edit-banner__text">
                    <p className="admin-detail-edit-banner__title">
                      This submission has been edited since it was last synced.
                    </p>
                    <p className="admin-detail-edit-banner__subtitle">
                      Sync to Planning Center to update the external record.
                    </p>
                  </div>
                </>
              ) : null}
              {planningCenterUpToDate && !showStaleSyncMessage ? (
                <>
                  <IconCheckCircle />
                  <div className="admin-detail-edit-banner__text">
                    <p className="admin-detail-edit-banner__title">
                      Up to date with Planning Center
                    </p>
                    <p className="admin-detail-edit-banner__subtitle">
                      Matches your last sync. Edit here, then sync again if you change intake
                      fields.
                    </p>
                  </div>
                </>
              ) : null}
              {editPath ? (
                <Link
                  to={editPath}
                  className="admin-button admin-button--soft-blue admin-button--inline admin-detail-edit-banner__edit"
                >
                  <IconPencil />
                  Edit submission
                </Link>
              ) : null}
            </div>
          ) : null}

          <DetailSection title="Contact" titleIcon={<IconContact />}>
            <dl className="admin-dl">
              <DetailRow label="Email" value={submission.email} />
              <DetailRow label="Phone" value={submission.phone} />
              <DetailRow
                label="Preferred contact"
                value={labelPreferredContact(submission.preferredContactMethod)}
              />
            </dl>
          </DetailSection>

          <DetailSection title="Serving preferences">
            <dl className="admin-dl">
              <DetailRow
                label="Overall frequency"
                value={labelFrequency(submission.overallFrequency)}
              />
              <DetailRow
                label="Availability"
                value={formatAvailabilityList(submission.availability)}
              />
              <DetailRow
                label="Special events"
                value={submission.openToSpecialEvents ? 'Open to helping' : 'Not selected'}
              />
            </dl>
          </DetailSection>

          {detail.interests?.length ? (
            <DetailSection title="Serving areas">
              <ul className="admin-interest-list">
                {detail.interests.map((interest) => (
                  <li key={interest.id} className="admin-interest-card">
                    <h3>{interest.servingAreaName}</h3>
                    <dl className="admin-dl admin-dl--compact">
                      <DetailRow
                        label="Effective frequency"
                        value={labelFrequency(interest.effectiveFrequency)}
                      />
                      {interest.usesAreaSpecificFrequency ? (
                        <DetailRow
                          label="Area limit"
                          value={labelFrequency(interest.areaSpecificFrequency)}
                        />
                      ) : null}
                      <DetailRow
                        label="Experience"
                        value={labelExperience(interest.experienceLevel)}
                      />
                      <DetailRow label="Notes" value={interest.interestNotes} />
                    </dl>
                    <ul className="admin-flags admin-flags--inline">
                      {interest.requiresBackgroundCheck ? (
                        <li>Background check</li>
                      ) : null}
                      {interest.requiresTraining ? <li>Training</li> : null}
                    </ul>
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {detail.requirementConfirmations?.length ? (
            <DetailSection title="Requirement confirmations">
              <ul className="admin-confirm-list">
                {detail.requirementConfirmations.map((item) => (
                  <li key={`${item.requirementId}-${item.servingAreaName}`}>
                    <strong>{item.servingAreaName}</strong> — {item.label}
                    {item.confirmed ? ' (confirmed)' : ' (not confirmed)'}
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          <DetailSection title="Volunteer notes">
            <dl className="admin-dl">
              <DetailRow label="Experience notes" value={submission.experienceNotes} />
              <DetailRow label="Additional notes" value={submission.additionalNotes} />
            </dl>
          </DetailSection>

          <DetailSection title="Staff notes">
            <p className="admin-notes-intro">
              Internal notes for your team. Volunteers do not see these.
            </p>
            <form className="admin-note-form" onSubmit={handleAddNote}>
              <label className="admin-label" htmlFor="staff-note">
                Add a note
              </label>
              <textarea
                id="staff-note"
                className="admin-textarea"
                rows={3}
                value={noteDraft}
                onChange={(event) => setNoteDraft(event.target.value)}
                placeholder="Follow-up, conversation summary, etc."
                disabled={noteSubmitting}
              />
              <button
                type="submit"
                className={`admin-button${noteSubmitting ? ' admin-button--busy' : ''}`}
                disabled={noteSubmitting || !noteDraft.trim()}
              >
                {noteSubmitting ? 'Saving…' : 'Add note'}
              </button>
            </form>
            {noteError ? <p className="admin-error">{noteError}</p> : null}
            {detail.adminNotes?.length ? (
              <ul className="admin-notes-list">
                {detail.adminNotes.map((note) => (
                  <li key={note.id} className="admin-notes-list__item">
                    <p>{note.note}</p>
                    <p className="admin-notes-list__meta">
                      {formatDateTime(note.createdAt)}
                    </p>
                    <button
                      type="button"
                      className="admin-link-button admin-notes-list__delete"
                      onClick={() => handleDeleteNote(note.id)}
                      disabled={deletingNoteId === note.id}
                    >
                      {deletingNoteId === note.id ? 'Deleting…' : 'Delete'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="admin-notes-empty">No staff notes yet.</p>
            )}
          </DetailSection>

          <section
            className="admin-detail-section admin-form-block--danger"
            aria-labelledby="delete-volunteer-heading"
          >
            <h2 id="delete-volunteer-heading" className="admin-detail-section__title">
              Remove from ServeWell
            </h2>
            <button
              type="button"
              className={softBtn.softBtnDanger}
              disabled={deletePending}
              onClick={() => {
                setDeleteError('')
                setDeleteDialogOpen(true)
              }}
            >
              Delete
            </button>
          </section>
        </>
      ) : null}

      <DeleteVolunteerSubmissionDialog
        open={deleteDialogOpen}
        volunteerName={
          submission ? `${submission.firstName} ${submission.lastName}` : ''
        }
        deleting={deletePending}
        error={deleteError}
        onConfirm={handleConfirmDeleteSubmission}
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
