import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getAdminGeneratedSchedule } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import GeneratedScheduleStatus from '../components/admin/GeneratedScheduleStatus'
import { formatBlackoutDateRange, formatDateOnly } from '../constants/labels'
import { formatScheduleTime, labelScheduleType } from '../constants/schedule'
import {
  adminScheduleDetailPath,
  adminSchedulesPath,
} from '../utils/organizationPaths'

export default function AdminGeneratedScheduleDetailPage() {
  const { organizationSlug, id } = useParams()
  const [schedule, setSchedule] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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
              Click an event later to edit assignments, add notes, or attach resources.
            </p>
          </section>

          <section className="admin-schedule-detail-section">
            <h2 className="admin-schedule-detail-section__title">Events</h2>
            {schedule.occurrences.length === 0 ? (
              <p className="admin-muted">No events were generated.</p>
            ) : (
              <ul className="admin-generated-occurrence-list">
                {schedule.occurrences.map((occurrence) => (
                  <li key={occurrence.id} className="admin-generated-occurrence-card">
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
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </AdminLayout>
  )
}
