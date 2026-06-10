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
  markVolunteerUpdateReviewed,
  pushAdminSubmissionToPlanningCenter,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
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

function IconCheckCircle() {
  return (
    <DetailIcon>
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

const PLANNING_CENTER_PUSH_OVERWRITE_NOTICE =
  'Pushing overwrites this person’s volunteering data in Planning Center with what you have in ServeWell. If someone changed them in Planning Center after the last push, those changes will be lost—double-check before you push.'

function formatPlanningCenterSyncedLine(submission) {
  if (!submission?.planningCenterSyncedAt || !submission?.planningCenterSyncedBy) {
    return null
  }
  const who = formatAdminActorLabel(submission.planningCenterSyncedBy)
  return `Last pushed to Planning Center ${formatDateTime(submission.planningCenterSyncedAt)} by ${who}`
}

function formatPlanningCenterImportedLine(submission) {
  if (!submission?.planningCenterImportedAt) {
    return null
  }
  const who = formatAdminActorLabel(submission.planningCenterImportedBy)
  const byClause = who ? ` by ${who}` : ''
  return `Imported from Planning Center ${formatDateTime(submission.planningCenterImportedAt)}${byClause}`
}

export default function AdminSubmissionDetailPage() {
  const { id, organizationSlug: organizationSlugParam } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { pathname } = location
  const { organization } = useAdminAuth()
  const organizationSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const volunteersPath = adminVolunteersPath(organizationSlug)
  const demoMode = pathname.startsWith('/demo/admin')
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
  const [planningCenterDirtyHint, setPlanningCenterDirtyHint] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [markReviewPending, setMarkReviewPending] = useState(false)
  const [markReviewError, setMarkReviewError] = useState('')

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
    setPlanningCenterDirtyHint(false)
  }, [id])

  useEffect(() => {
    if (!location.state?.submissionSaved) {
      return
    }

    if (location.state.planningCenterStale) {
      setPlanningCenterDirtyHint(true)
    }
    setToastMessage('Submission saved.')
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

  async function handleMarkVolunteerUpdateReviewed() {
    setMarkReviewError('')
    setMarkReviewPending(true)

    try {
      const data = await markVolunteerUpdateReviewed(id)
      setDetail(data)
    } catch (err) {
      setMarkReviewError(
        err instanceof ApiError
          ? err.message
          : 'Unable to mark this update as reviewed.',
      )
    } finally {
      setMarkReviewPending(false)
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
  const editPath =
    demoMode || !submission?.formId
      ? null
      : adminVolunteerEditPath(organizationSlug, id)
  const planningCenterImportedLine = submission
    ? formatPlanningCenterImportedLine(submission)
    : null
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
  const planningCenterSyncDirty =
    stalePlanningCenterSync || planningCenterDirtyHint
  const planningCenterNothingToSync =
    isLinkedToPlanningCenter && planningCenterUpToDate && !planningCenterSyncDirty
  const canPushToPlanningCenter =
    !demoMode &&
    isPlanningCenterConnected &&
    hasEmailOrPhone &&
    !planningCenterPushPending &&
    !planningCenterNothingToSync

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
    } else if (planningCenterNothingToSync) {
      planningCenterDisabledReason = 'Up to date — nothing to push.'
    }
  }

  const showPlanningCenterPushOverwriteTip =
    isLinkedToPlanningCenter &&
    planningCenterSyncDirty &&
    canPushToPlanningCenter

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
      setPlanningCenterDirtyHint(false)
      await loadDetail()
    } catch (err) {
      setPlanningCenterPushError(
        err instanceof ApiError
          ? err.message
          : isLinkedToPlanningCenter
            ? 'Unable to push this volunteer to Planning Center.'
            : 'Unable to add this volunteer to Planning Center.',
      )
    } finally {
      setPlanningCenterPushPending(false)
    }
  }

  return (
    <AdminLayout>
      <div className="admin-detail-top-nav">
        <p className="admin-back">
          <Link to={volunteersPath}>← Back to volunteers</Link>
        </p>
        {submission && editPath ? (
          <Link
            to={editPath}
            className="admin-button admin-button--inline admin-button--compact admin-button--soft-blue admin-detail-top-nav__edit"
          >
            <IconPencil />
            Edit submission
          </Link>
        ) : null}
      </div>

      {loading ? <p className="admin-loading">Loading volunteer…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {submission?.volunteerUpdateReviewNeeded && submission.volunteerSelfUpdatedAt ? (
        <div className="admin-detail-volunteer-update-banner" role="status">
          <div className="admin-detail-volunteer-update-banner__accent" aria-hidden="true" />
          <div className="admin-detail-volunteer-update-banner__icon-wrap" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path
                d="M21 12a9 9 0 1 1-2.64-6.36M21 3v6h-6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="admin-detail-volunteer-update-banner__content">
            <p className="admin-detail-volunteer-update-banner__title">
              Volunteer updated this submission on{' '}
              {formatDateTime(submission.volunteerSelfUpdatedAt)}.
            </p>
            <p className="admin-detail-volunteer-update-banner__subtitle">
              This update needs your review.
            </p>
            {markReviewError ? (
              <p className="admin-error admin-detail-volunteer-update-banner__error">
                {markReviewError}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            className={`admin-detail-volunteer-update-banner__action${markReviewPending ? ' admin-detail-volunteer-update-banner__action--busy' : ''}`}
            disabled={markReviewPending}
            onClick={handleMarkVolunteerUpdateReviewed}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="m5 12.5 2.5 2.5L19 5.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>{markReviewPending ? 'Saving…' : 'Mark update reviewed'}</span>
          </button>
        </div>
      ) : null}

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
                      title={planningCenterDisabledReason || undefined}
                      onClick={handleAddToPlanningCenter}
                    >
                      {planningCenterPushPending
                        ? isLinkedToPlanningCenter
                          ? 'Pushing…'
                          : 'Sending…'
                        : isLinkedToPlanningCenter
                          ? 'Push to Planning Center'
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
                    {showPlanningCenterPushOverwriteTip ? (
                      <span className="admin-info-tip">
                        <button
                          type="button"
                          className="admin-info-mark"
                          aria-label={PLANNING_CENTER_PUSH_OVERWRITE_NOTICE}
                        >
                          i
                        </button>
                        <span
                          className="admin-info-tip__bubble admin-info-tip__bubble--wide"
                          role="tooltip"
                        >
                          {PLANNING_CENTER_PUSH_OVERWRITE_NOTICE}
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
                {submission.planningCenterImportedAt ? (
                  <span className="admin-submission-card__pc-import-badge">
                    Imported from Planning Center
                  </span>
                ) : null}
              </div>
              {planningCenterImportedLine ? (
                <p className="admin-muted admin-detail-toolbar__import-line">
                  {planningCenterImportedLine}
                </p>
              ) : null}
              {!demoMode && planningCenterSyncedLine ? (
                <div
                  className={[
                    'admin-detail-toolbar__pc-sync',
                    planningCenterSyncDirty
                      ? 'admin-detail-toolbar__pc-sync--dirty'
                      : planningCenterUpToDate
                        ? 'admin-detail-toolbar__pc-sync--clean'
                        : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {planningCenterUpToDate && !planningCenterSyncDirty ? (
                    <IconCheckCircle />
                  ) : (
                    <IconRefresh />
                  )}
                  <p>{planningCenterSyncedLine}</p>
                </div>
              ) : null}
            </div>
          </section>

          <DetailSection title="Contact" titleIcon={<IconContact />}>
            <dl className="admin-dl">
              <DetailRow label="Form / source" value={submission.formName} />
              <DetailRow
                label="Name"
                value={`${submission.firstName} ${submission.lastName}`.trim()}
              />
              <DetailRow label="Email" value={submission.email} />
              <DetailRow label="Phone" value={submission.phone} />
              <DetailRow
                label="Preferred contact"
                value={labelPreferredContact(submission.preferredContactMethod)}
              />
            </dl>
          </DetailSection>

          {submission.planningCenterImportedAt ? (
            <DetailSection title="Imported Planning Center data">
              {submission.planningCenterImportTabName ? (
                <p className="admin-muted admin-detail-import-tab-name">
                  Tab: {submission.planningCenterImportTabName}
                </p>
              ) : null}
              {submission.planningCenterImportCustomFields?.length > 0 ? (
                <dl className="admin-dl admin-dl--compact">
                  {submission.planningCenterImportCustomFields.map((field) => (
                    <DetailRow
                      key={field.fieldDefinitionId}
                      label={field.name}
                      value={field.value?.trim() ? field.value : '—'}
                    />
                  ))}
                </dl>
              ) : (
                <p className="admin-muted">No custom fields were on this tab.</p>
              )}
            </DetailSection>
          ) : null}

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

      <AdminToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </AdminLayout>
  )
}
