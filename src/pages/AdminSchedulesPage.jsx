import { useCallback, useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ApiError,
  deleteAdminSchedule,
  getAdminGeneratedSchedules,
  getAdminScheduleServingAreaOptions,
  getAdminSchedules,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import AdminToast from '../components/admin/AdminToast'
import CreateGeneratedScheduleDialog from '../components/admin/CreateGeneratedScheduleDialog'
import CreateScheduleWizard from '../components/admin/CreateScheduleWizard'
import DeleteScheduleDialog from '../components/admin/DeleteScheduleDialog'
import GeneratedScheduleStatus from '../components/admin/GeneratedScheduleStatus'
import { formatDateTime } from '../constants/labels'
import { labelScheduleType } from '../constants/schedule'
import softBtn from '../styles/adminSoftButtons.module.css'
import {
  adminGeneratedScheduleDetailPath,
  adminScheduleDetailPath,
} from '../utils/organizationPaths'

export default function AdminSchedulesPage() {
  const { organizationSlug } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [templates, setTemplates] = useState([])
  const [generatedSchedules, setGeneratedSchedules] = useState([])
  const [catalogForms, setCatalogForms] = useState([])
  const [listLoading, setListLoading] = useState(true)
  const [generatedLoading, setGeneratedLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [generatedError, setGeneratedError] = useState('')
  const [catalogError, setCatalogError] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [createScheduleOpen, setCreateScheduleOpen] = useState(false)
  const [createScheduleTemplateId, setCreateScheduleTemplateId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const loadTemplates = useCallback(async () => {
    setListLoading(true)
    setListError('')

    try {
      const data = await getAdminSchedules()
      setTemplates(Array.isArray(data?.schedules) ? data.schedules : [])
    } catch (err) {
      setTemplates([])
      setListError(err instanceof ApiError ? err.message : 'Unable to load schedule templates.')
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadGeneratedSchedules = useCallback(async () => {
    setGeneratedLoading(true)
    setGeneratedError('')

    try {
      const data = await getAdminGeneratedSchedules()
      setGeneratedSchedules(
        Array.isArray(data?.generatedSchedules) ? data.generatedSchedules : [],
      )
    } catch (err) {
      setGeneratedSchedules([])
      setGeneratedError(
        err instanceof ApiError ? err.message : 'Unable to load generated schedules.',
      )
    } finally {
      setGeneratedLoading(false)
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
    void loadTemplates()
    void loadGeneratedSchedules()
  }, [loadTemplates, loadGeneratedSchedules])

  useEffect(() => {
    if (location.state?.templateDeleted) {
      setToastMessage('Template deleted.')
      window.history.replaceState({}, document.title)
    }

    if (location.state?.createGeneratedFromTemplateId) {
      setCreateScheduleTemplateId(location.state.createGeneratedFromTemplateId)
      setCreateScheduleOpen(true)
      window.history.replaceState({}, document.title)
    }
  }, [location.state])

  const canCreateSchedule = templates.length > 0 && !listLoading

  function openWizard() {
    setWizardOpen(true)
    if (!catalogForms.length && !catalogLoading) {
      void loadCatalog()
    }
  }

  function openCreateScheduleDialog() {
    setCreateScheduleTemplateId(null)
    setCreateScheduleOpen(true)
  }

  function handleSaved(created) {
    setTemplates((current) => [
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
    setToastMessage('Template created.')
  }

  function handleGeneratedCreated(created) {
    setCreateScheduleOpen(false)
    setCreateScheduleTemplateId(null)
    void loadGeneratedSchedules()
    navigate(adminGeneratedScheduleDetailPath(organizationSlug, created.id))
  }

  async function confirmDeleteFromList() {
    if (!deleteTarget) {
      return
    }

    setDeleteError('')
    setDeleting(true)

    try {
      await deleteAdminSchedule(deleteTarget.id)
      setTemplates((current) => current.filter((row) => row.id !== deleteTarget.id))
      setDeleteTarget(null)
      setToastMessage('Template deleted.')
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Unable to delete template.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <AdminLayout>
      <header className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Schedules</h1>
          <p className="admin-page-subtitle">
            Manage active volunteer schedules and reusable templates you generate them from.
          </p>
        </div>
      </header>

      <section className="admin-schedules-hub-section" aria-labelledby="active-schedules-heading">
        <div className="admin-schedules-hub-section__header">
          <h2 id="active-schedules-heading" className="admin-schedules-hub-section__title">
            Active &amp; Upcoming Schedules
          </h2>
          <span className="admin-schedules-hub-section__action-wrap">
            <button
              type="button"
              className="admin-button admin-button--inline"
              disabled={!canCreateSchedule}
              onClick={openCreateScheduleDialog}
            >
              Create schedule
            </button>
            {!canCreateSchedule && !listLoading ? (
              <span className="admin-schedules-hub-section__soon admin-muted">
                Add a schedule template first
              </span>
            ) : null}
          </span>
        </div>

        {generatedLoading ? <p className="admin-loading">Loading schedules…</p> : null}
        {generatedError ? <p className="admin-error">{generatedError}</p> : null}

        {!generatedLoading && !generatedError && generatedSchedules.length === 0 ? (
          <div className="admin-empty-state">
            <p>
              No active schedules yet. Create a schedule from one of your templates when you&apos;re
              ready.
            </p>
          </div>
        ) : null}

        {!generatedLoading && !generatedError && generatedSchedules.length > 0 ? (
          <ul className="admin-schedule-list">
            {generatedSchedules.map((row) => (
              <li key={row.id} className="admin-schedule-card">
                <div className="admin-schedule-card__main">
                  <Link
                    to={adminGeneratedScheduleDetailPath(organizationSlug, row.id)}
                    className="admin-schedule-card__link"
                  >
                    <h3 className="admin-schedule-card__title">{row.name}</h3>
                    <p className="admin-schedule-card__meta">
                      <GeneratedScheduleStatus status={row.status} />
                      <span className="admin-muted">
                        {' '}
                        · {row.occurrenceCount} event
                        {row.occurrenceCount === 1 ? '' : 's'} · From {row.templateName}
                      </span>
                    </p>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="admin-schedules-hub-section" aria-labelledby="schedule-templates-heading">
        <div className="admin-schedules-hub-section__header">
          <h2 id="schedule-templates-heading" className="admin-schedules-hub-section__title">
            Schedule Templates
          </h2>
          <button type="button" className="admin-button admin-button--inline" onClick={openWizard}>
            Create schedule template
          </button>
        </div>
        <p className="admin-help admin-schedules-hub-section__lead">
          Templates define serving areas, events, and staffing needs. Use them to build actual
          schedules later.
        </p>

        {listLoading ? <p className="admin-loading">Loading templates…</p> : null}
        {listError ? <p className="admin-error">{listError}</p> : null}

        {!listLoading && !listError && templates.length === 0 ? (
          <div className="admin-empty-state">
            <p>No templates yet. Create one to set up events and staffing for your serving areas.</p>
          </div>
        ) : null}

        {!listLoading && !listError && templates.length > 0 ? (
          <ul className="admin-schedule-list">
            {templates.map((template) => (
              <li key={template.id} className="admin-schedule-card">
                <div className="admin-schedule-card__main">
                  <Link
                    to={adminScheduleDetailPath(organizationSlug, template.id)}
                    className="admin-schedule-card__link"
                  >
                    <h3 className="admin-schedule-card__title">{template.name}</h3>
                    <p className="admin-schedule-card__meta admin-muted">
                      Template · {labelScheduleType(template.scheduleType)} · {template.rhythmCount}{' '}
                      event{template.rhythmCount === 1 ? '' : 's'} · {template.servingAreaCount}{' '}
                      serving area
                      {template.servingAreaCount === 1 ? '' : 's'} · Updated{' '}
                      {formatDateTime(template.updatedAt ?? template.createdAt)}
                    </p>
                  </Link>
                </div>
                <button
                  type="button"
                  className={`${softBtn.softBtnDanger} admin-schedule-card__delete`}
                  onClick={() => {
                    setDeleteError('')
                    setDeleteTarget(template)
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <CreateGeneratedScheduleDialog
        open={createScheduleOpen}
        templates={templates}
        initialTemplateId={createScheduleTemplateId}
        onClose={() => {
          setCreateScheduleOpen(false)
          setCreateScheduleTemplateId(null)
        }}
        onCreated={handleGeneratedCreated}
      />

      <CreateScheduleWizard
        open={wizardOpen}
        catalogForms={catalogForms}
        catalogLoading={catalogLoading}
        catalogError={catalogError}
        onClose={() => setWizardOpen(false)}
        onSaved={handleSaved}
        onRetryCatalog={() => void loadCatalog()}
      />

      <DeleteScheduleDialog
        open={Boolean(deleteTarget)}
        scheduleName={deleteTarget?.name}
        deleting={deleting}
        error={deleteError}
        variant="template"
        onConfirm={() => void confirmDeleteFromList()}
        onCancel={() => setDeleteTarget(null)}
      />

      <AdminToast message={toastMessage} onDismiss={() => setToastMessage('')} />
    </AdminLayout>
  )
}
