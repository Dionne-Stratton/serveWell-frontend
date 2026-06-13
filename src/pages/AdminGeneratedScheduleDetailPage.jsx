import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ApiError, deleteAdminGeneratedSchedule, getAdminGeneratedSchedule } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import DeleteScheduleDialog from '../components/admin/DeleteScheduleDialog'
import GeneratedOccurrenceDetailDialog from '../components/admin/GeneratedOccurrenceDetailDialog'
import GeneratedScheduleStatus from '../components/admin/GeneratedScheduleStatus'
import { formatBlackoutDateRange, formatDateOnly } from '../constants/labels'
import { formatScheduleTime, labelScheduleType } from '../constants/schedule'
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

export default function AdminGeneratedScheduleDetailPage() {
  const { organizationSlug, id } = useParams()
  const navigate = useNavigate()
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeOccurrenceId, setActiveOccurrenceId] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

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
          <header className="admin-page-header">
            <div>
              <p className="admin-schedule-template-eyebrow admin-muted">Generated schedule</p>
              <h1 className="admin-page-title">{schedule.name}</h1>
            </div>
            <div className="admin-page-header__actions">
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
              Click an event to view details and edit staffing for that date only.
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
                    <button
                      type="button"
                      className="admin-generated-occurrence-card admin-generated-occurrence-card--clickable"
                      onClick={() => setActiveOccurrenceId(occurrence.id)}
                    >
                      <header className="admin-generated-occurrence-card__header">
                        <h3 className="admin-generated-occurrence-card__title">
                          {formatDateOnly(occurrence.occurrenceDate)}
                        </h3>
                        <p className="admin-muted admin-generated-occurrence-card__meta">
                          {occurrence.name} · {formatScheduleTime(occurrence.startTime)}
                        </p>
                      </header>
                      {occurrence.requirements.length ? (
                        <ul className="admin-generated-occurrence-card__staffing">
                          {occurrence.requirements.map((req) => (
                            <li key={req.id}>
                              {req.displayName}: {req.assignedCount}/{req.neededCount} assigned
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="admin-muted">No staffing needs defined.</p>
                      )}
                    </button>
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
        </>
      ) : null}
    </AdminLayout>
  )
}
