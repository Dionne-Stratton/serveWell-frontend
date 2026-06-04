import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth'
import { adminVolunteersPath, resolveAdminOrganizationSlug } from '../utils/organizationPaths'
import {
  ApiError,
  createAdminSubmissionNote,
  deleteAdminNote,
  getAdminSubmissionDetail,
  getPlanningCenterIntegration,
  pushAdminSubmissionToPlanningCenter,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminSubmissionStatusSelect from '../components/admin/AdminSubmissionStatusSelect'
import {
  formatAvailabilityList,
  formatDateTime,
  labelExperience,
  labelFrequency,
  labelPreferredContact,
} from '../constants/labels'

function DetailSection({ title, children }) {
  return (
    <section className="admin-detail-section">
      <h2 className="admin-detail-section__title">{title}</h2>
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

export default function AdminSubmissionDetailPage() {
  const { id, organizationSlug: organizationSlugParam } = useParams()
  const { pathname } = useLocation()
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
  const isPlanningCenterConnected =
    planningCenterIntegration?.status === 'connected'
  const hasEmailOrPhone =
    Boolean(submission?.email?.trim()) || Boolean(submission?.phone?.trim())
  const isLinkedToPlanningCenter = Boolean(
    submission?.planningCenterPersonId?.trim(),
  )
  const canPushToPlanningCenter =
    !demoMode &&
    isPlanningCenterConnected &&
    hasEmailOrPhone &&
    !planningCenterPushPending

  let planningCenterDisabledReason = ''
  if (!demoMode && submission) {
    if (!isPlanningCenterConnected) {
      planningCenterDisabledReason =
        'Connect Planning Center from your dashboard first.'
    } else if (!hasEmailOrPhone) {
      planningCenterDisabledReason =
        'This volunteer needs an email address or phone number before they can be added to Planning Center.'
    }
  }

  async function handleAddToPlanningCenter() {
    if (!canPushToPlanningCenter) {
      return
    }

    setPlanningCenterPushError('')
    setPlanningCenterPushPending(true)

    try {
      const data = await pushAdminSubmissionToPlanningCenter(id)
      const nextPersonId =
        data.submission?.planningCenterPersonId ?? data.personId ?? null
      if (data.submission || nextPersonId) {
        setDetail((current) =>
          current
            ? {
                ...current,
                submission: {
                  ...current.submission,
                  ...(data.submission?.status
                    ? { status: data.submission.status }
                    : {}),
                  ...(nextPersonId
                    ? { planningCenterPersonId: nextPersonId }
                    : {}),
                },
              }
            : current,
        )
      } else {
        await loadDetail()
      }
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
          <div className="admin-detail-meta">
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
            <div className="admin-detail-meta__aside">
              {!demoMode ? (
                <div className="admin-planning-center-row">
                  <button
                    type="button"
                    className={`admin-button admin-button--secondary admin-button--inline admin-button--planning-center${planningCenterPushPending ? ' admin-button--busy' : ''}`}
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
              ) : null}
              {planningCenterPushError ? (
                <p className="admin-error admin-planning-center-row__error">
                  {planningCenterPushError}
                </p>
              ) : null}
              <span className="admin-detail-meta__date">
                Submitted {formatDateTime(submission.createdAt)}
              </span>
            </div>
          </div>

          <DetailSection title="Contact">
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
        </>
      ) : null}
    </AdminLayout>
  )
}
