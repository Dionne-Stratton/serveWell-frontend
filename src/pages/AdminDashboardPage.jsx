import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { ApiError, getAdminForms, getAdminSubmissions } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import {
  adminVolunteersFilteredPath,
  organizationAdminFormsPath,
  organizationPlanningCenterIntegrationPath,
} from '../utils/organizationPaths'

const ACTION_STATUSES = [
  { status: 'new', label: 'New' },
  { status: 'follow_up_needed', label: 'Follow-up needed' },
  { status: 'approved_ready_to_schedule', label: 'Ready to Schedule' },
]

export default function AdminDashboardPage() {
  const { organizationSlug } = useParams()
  const [counts, setCounts] = useState(null)
  const [activeForms, setActiveForms] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadError('')

      try {
        const countResults = await Promise.all(
          ACTION_STATUSES.map(({ status }) =>
            getAdminSubmissions({ status, archived: false }),
          ),
        )

        const formsData = await getAdminForms()
        const forms = formsData.forms ?? []
        const active = forms.filter((form) => form.isActive)

        if (!cancelled) {
          setCounts(
            ACTION_STATUSES.map(({ status, label }, index) => ({
              status,
              label,
              count: countResults[index]?.submissions?.length ?? 0,
            })),
          )
          setActiveForms(active)
        }
      } catch (err) {
        if (!cancelled) {
          setCounts(null)
          setActiveForms(null)
          setLoadError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load dashboard. Is the API running?',
          )
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const formsPath = organizationAdminFormsPath(organizationSlug)
  const integrationPath = organizationPlanningCenterIntegrationPath(organizationSlug)

  return (
    <AdminLayout title="Dashboard">
      {loadError ? <p className="admin-error">{loadError}</p> : null}

      <section className="admin-dashboard-section" aria-labelledby="dashboard-action-heading">
        <h2 id="dashboard-action-heading" className="admin-dashboard-section__title">
          Needs attention
        </h2>
        <div className="admin-dashboard-stats">
          {counts === null && !loadError ? (
            <p className="admin-loading">Loading counts…</p>
          ) : null}
          {counts?.map(({ status, label, count }) => (
            <Link
              key={status}
              to={adminVolunteersFilteredPath(organizationSlug, status)}
              className="admin-stat-card"
            >
              <span className="admin-stat-card__count">{count}</span>
              <span className="admin-stat-card__label">{label}</span>
              <span className="admin-stat-card__hint">View in Volunteers</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="admin-dashboard-panel" aria-labelledby="dashboard-forms-heading">
        <h2 id="dashboard-forms-heading" className="admin-dashboard-section__title">
          Active forms
        </h2>
        {activeForms === null && !loadError ? (
          <p className="admin-loading">Loading forms…</p>
        ) : null}
        {activeForms?.length ? (
          <ul className="admin-dashboard-form-list">
            {activeForms.map((form) => (
              <li key={form.id}>{form.name}</li>
            ))}
          </ul>
        ) : null}
        {activeForms && activeForms.length === 0 ? (
          <p className="admin-muted">
            No active forms yet.{' '}
            <Link to={formsPath}>Go to Forms</Link> to create one or turn a form on.
          </p>
        ) : null}
      </section>

      <section className="admin-dashboard-panel" aria-labelledby="dashboard-integrations-heading">
        <h2 id="dashboard-integrations-heading" className="admin-dashboard-section__title">
          Integrations
        </h2>
        <div className="admin-integration-row">
          <div className="admin-integration-row__info">
            <span className="admin-integration-row__name">Planning Center</span>
            <span className="admin-integration-row__status">Not connected</span>
          </div>
          <Link
            to={integrationPath}
            className="admin-button admin-button--secondary admin-button--inline admin-button--compact"
          >
            Manage Integration
          </Link>
        </div>
      </section>
    </AdminLayout>
  )
}
