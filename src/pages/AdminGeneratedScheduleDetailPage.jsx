import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, deleteAdminGeneratedSchedule, getAdminGeneratedSchedule, publishAdminGeneratedSchedule } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
import DeleteScheduleDialog from '../components/admin/DeleteScheduleDialog'
import GeneratedOccurrenceDetailDialog from '../components/admin/GeneratedOccurrenceDetailDialog'
import GeneratedOccurrenceEventCard from '../components/admin/GeneratedOccurrenceEventCard'
import GeneratedScheduleStatus from '../components/admin/GeneratedScheduleStatus'
import PublishGeneratedScheduleDialog from '../components/admin/PublishGeneratedScheduleDialog'
import { formatBlackoutDateRange, formatDateTime } from '../constants/labels'
import { normalizeGeneratedScheduleStatus } from '../constants/generatedScheduleStatus'
import { labelScheduleType } from '../constants/schedule'
import {
  adminScheduleDetailPath,
  adminSchedulesPath,
} from '../utils/organizationPaths'

function mergeOccurrenceIntoSchedule(schedule, updatedOccurrence) {
  if (!schedule || !updatedOccurrence) {
    return schedule
  }

  return {
    ...schedule,
    occurrences: schedule.occurrences.map((occ) =>
      occ.id === updatedOccurrence.id
        ? {
            id: updatedOccurrence.id,
            occurrenceDate: updatedOccurrence.occurrenceDate,
            name: updatedOccurrence.name,
            startTime: updatedOccurrence.startTime,
            templateRhythmId: updatedOccurrence.templateRhythmId,
            requirements: updatedOccurrence.requirements,
          }
        : occ,
    ),
  }
}

function formatPublicationToast(publicationEmails) {
  if (!publicationEmails) {
    return 'Schedule published.'
  }

  const sent = publicationEmails.emailsSent ?? 0
  const skipped = publicationEmails.skippedMissingEmail ?? 0

  if (sent === 0 && skipped === 0) {
    return 'Schedule published.'
  }

  const parts = ['Schedule published.']

  if (sent > 0) {
    parts.push(`${sent} volunteer ${sent === 1 ? 'email' : 'emails'} sent.`)
  }

  if (skipped > 0) {
    parts.push(
      `${skipped} ${skipped === 1 ? 'volunteer was' : 'volunteers were'} skipped (no email on file).`,
    )
  }

  return parts.join(' ')
}

export default function AdminGeneratedScheduleDetailPage() {
  const { organizationSlug, id } = useParams()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeOccurrenceId, setActiveOccurrenceId] = useState(null)
  const [expandedOccurrenceIds, setExpandedOccurrenceIds] = useState(() => new Set())
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const scheduleStatus = schedule ? normalizeGeneratedScheduleStatus(schedule.status) : 'draft'
  const isDraft = scheduleStatus === 'draft'

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const data = await getAdminGeneratedSchedule(id)
      setSchedule(data.generatedSchedule ?? null)
    } catch (err) {
      setSchedule(null)
      setLoadError(err instanceof ApiError ? err.message : 'Unable to load schedule.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  function handleOccurrenceSaved(updatedOccurrence) {
    setSchedule((current) => mergeOccurrenceIntoSchedule(current, updatedOccurrence))
  }

  function toggleOccurrenceExpanded(occurrenceId) {
    setExpandedOccurrenceIds((current) => {
      const next = new Set(current)
      if (next.has(occurrenceId)) {
        next.delete(occurrenceId)
      } else {
        next.add(occurrenceId)
      }
      return next
    })
  }

  async function confirmDeleteSchedule() {
    setDeleteError('')
    setDeleting(true)

    try {
      await deleteAdminGeneratedSchedule(id)
      navigate(adminSchedulesPath(organizationSlug), {
        replace: true,
        state: { generatedScheduleDeleted: true },
      })
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Unable to delete schedule.')
    } finally {
      setDeleting(false)
    }
  }

  async function confirmPublishSchedule() {
    setPublishError('')
    setPublishing(true)

    try {
      const data = await publishAdminGeneratedSchedule(id)
      setSchedule(data.generatedSchedule ?? null)
      setPublishOpen(false)
      setToastMessage(formatPublicationToast(data.publicationEmails))
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : 'Unable to publish schedule.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <AdminLayout>
      <p className="admin-detail-top-nav">
        <Link to={adminSchedulesPath(organizationSlug)} className="admin-detail-top-nav__back">
          ← Schedules
        </Link>
      </p>

      {loading ? <p className="admin-loading">Loading…</p> : null}
      {loadError ? <p className="admin-error">{loadError}</p> : null}

      {!loading && !loadError && schedule ? (
        <>
          <header className="admin-page-header admin-page-header--stacked-actions">
            <div>
              <p className="admin-schedule-template-eyebrow admin-muted">Generated schedule</p>
              <div className="admin-generated-schedule-detail__title-row">
                <h1 className="admin-page-title">{schedule.name}</h1>
                <GeneratedScheduleStatus status={schedule.status} />
              </div>
            </div>
            <div className="admin-page-header__actions">
              {isDraft ? (
                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => {
                    setPublishError('')
                    setPublishOpen(true)
                  }}
                >
                  Publish schedule
                </button>
              ) : null}
              <button
                type="button"
                className="admin-danger-button"
                onClick={() => {
                  setDeleteError('')
                  setDeleteOpen(true)
                }}
              >
                Delete schedule
              </button>
            </div>
          </header>

          <section className="admin-schedule-detail-section">
            <h2 className="admin-schedule-detail-section__title">Overview</h2>
            <dl className="admin-dl admin-dl--compact">
              <div>
                <dt>Status</dt>
                <dd>
                  <GeneratedScheduleStatus status={schedule.status} />
                </dd>
              </div>
              {schedule.publishedAt ? (
                <div>
                  <dt>Published</dt>
                  <dd>{formatDateTime(schedule.publishedAt)}</dd>
                </div>
              ) : null}
              <div>
                <dt>Date range</dt>
                <dd>{formatBlackoutDateRange(schedule.startDate, schedule.endDate)}</dd>
              </div>
              <div>
                <dt>Template</dt>
                <dd>
                  <Link to={adminScheduleDetailPath(organizationSlug, schedule.scheduleTemplateId)}>
                    {schedule.templateName}
                  </Link>
                  <span className="admin-muted">
                    {' '}
                    ({labelScheduleType(schedule.templateScheduleType)})
                  </span>
                </dd>
              </div>
            </dl>
            <p className="admin-help admin-generated-schedule-overview-help">
              Click an event to open details. Use Show staffing on a card to expand the breakdown
              without leaving the list.
            </p>
          </section>

          <section className="admin-schedule-detail-section">
            <h2 className="admin-schedule-detail-section__title">Events</h2>
            {schedule.occurrences.length === 0 ? (
              <p className="admin-muted">No events were generated.</p>
            ) : (
              <ul className="admin-generated-occurrence-list">
                {schedule.occurrences.map((occurrence) => (
                  <li key={occurrence.id}>
                    <GeneratedOccurrenceEventCard
                      occurrence={occurrence}
                      expanded={expandedOccurrenceIds.has(occurrence.id)}
                      onToggleExpanded={toggleOccurrenceExpanded}
                      onOpen={setActiveOccurrenceId}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <GeneratedOccurrenceDetailDialog
            open={activeOccurrenceId != null}
            generatedScheduleId={schedule.id}
            occurrenceId={activeOccurrenceId}
            onClose={() => setActiveOccurrenceId(null)}
            onSaved={handleOccurrenceSaved}
          />

          <DeleteScheduleDialog
            open={deleteOpen}
            scheduleName={schedule.name}
            deleting={deleting}
            error={deleteError}
            variant="generated"
            onConfirm={() => void confirmDeleteSchedule()}
            onCancel={() => setDeleteOpen(false)}
          />

          <PublishGeneratedScheduleDialog
            open={publishOpen}
            scheduleName={schedule.name}
            publishing={publishing}
            error={publishError}
            onConfirm={() => void confirmPublishSchedule()}
            onCancel={() => setPublishOpen(false)}
          />
        </>
      ) : null}
      <AdminToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </AdminLayout>
  )
}
