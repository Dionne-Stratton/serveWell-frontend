import { useCallback, useEffect, useState } from 'react'
import {
  ApiError,
  getAdminScheduleServingAreaOptions,
  getAdminSchedules,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import CreateScheduleWizard from '../components/admin/CreateScheduleWizard'
import { formatDateTime } from '../constants/labels'

export default function AdminSchedulesPage() {
  const [schedules, setSchedules] = useState([])
  const [catalogForms, setCatalogForms] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)

  const loadSchedules = useCallback(async () => {
    setListLoading(true)
    setListError('')

    try {
      const data = await getAdminSchedules()
      setSchedules(Array.isArray(data?.schedules) ? data.schedules : [])
    } catch (err) {
      setSchedules([])
      setListError(err instanceof ApiError ? err.message : 'Unable to load schedules.')
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError('')

    try {
      const data = await getAdminScheduleServingAreaOptions()
      setCatalogForms(Array.isArray(data?.forms) ? data.forms : [])
    } catch (err) {
      setCatalogError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load serving areas for the wizard.',
      )
    } finally {
      setCatalogLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadSchedules()
  }, [loadSchedules])

  function openWizard() {
    setWizardOpen(true)
    if (!catalogForms.length && !catalogLoading) {
      void loadCatalog()
    }
  }

  function handleSaved(created) {
    setSchedules((current) => [
      {
        id: created.id,
        name: created.name,
        scheduleType: created.scheduleType,
        rhythmCount: created.rhythms?.length ?? 0,
        servingAreaCount: created.servingAreas?.length ?? 0,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
      },
      ...current,
    ])
  }

  return (
    <AdminLayout>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Schedules</h1>
          <p className="admin-page-subtitle">
            Set up recurring service times and staffing needs for your serving areas.
          </p>
        </div>
        <button
          type="button"
          className="admin-button"
          onClick={openWizard}
        >
          Create schedule
        </button>
      </header>

      {listLoading ? <p className="admin-loading">Loading…</p> : null}
      {listError ? <p className="admin-error">{listError}</p> : null}

      {!listLoading && !listError && schedules.length === 0 ? (
        <div className="admin-empty-state">
          <p>No schedules yet. Create one to connect serving areas with recurring service times.</p>
        </div>
      ) : null}

      {!listLoading && !listError && schedules.length > 0 ? (
        <ul className="admin-schedule-list">
          {schedules.map((schedule) => (
            <li key={schedule.id} className="admin-schedule-card">
              <h2 className="admin-schedule-card__title">{schedule.name}</h2>
              <p className="admin-schedule-card__meta admin-muted">
                {schedule.rhythmCount} service time{schedule.rhythmCount === 1 ? '' : 's'} ·{' '}
                {schedule.servingAreaCount} serving area
                {schedule.servingAreaCount === 1 ? '' : 's'} · Created{' '}
                {formatDateTime(schedule.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      <CreateScheduleWizard
        open={wizardOpen}
        catalogForms={catalogForms}
        catalogLoading={catalogLoading}
        catalogError={catalogError}
        onClose={() => setWizardOpen(false)}
        onSaved={handleSaved}
        onRetryCatalog={() => void loadCatalog()}
      />
    </AdminLayout>
  )
}
