import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  ApiError,
  connectPlanningCenterIntegration,
  disconnectPlanningCenterIntegration,
  getAdminForms,
  getAdminSubmissions,
  getPlanningCenterIntegration,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import { useAdminAuth } from '../auth/useAdminAuth'
import softBtn from '../styles/adminSoftButtons.module.css'
import {
  adminVolunteersFilteredPath,
  adminFormsPath,
} from '../utils/organizationPaths'

const ACTION_STATUSES = [
  { status: 'new', label: 'New' },
  { status: 'follow_up_needed', label: 'Follow-up needed' },
  { status: 'approved_ready_to_schedule', label: 'Ready to Schedule' },
]

export default function AdminDashboardPage({
  organizationSlug: organizationSlugProp,
  demoMode = false,
}) {
  const { organizationSlug: organizationSlugParam } = useParams()
  const organizationSlug = organizationSlugProp ?? organizationSlugParam
  const { admin } = useAdminAuth()
  const isOrganizationOwner = admin?.role === 'owner'
  const PLANNING_CENTER_OWNER_ONLY_HINT =
    'Only the organization owner can manage the shared Planning Center connection.'
  const [counts, setCounts] = useState(null)
  const [activeForms, setActiveForms] = useState(null)
  const [planningCenterIntegration, setPlanningCenterIntegration] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [integrationError, setIntegrationError] = useState('')
  const [integrationActionPending, setIntegrationActionPending] = useState(false)

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
        const integrationData = demoMode
          ? null
          : await getPlanningCenterIntegration()

        if (!cancelled) {
          setCounts(
            ACTION_STATUSES.map(({ status, label }, index) => ({
              status,
              label,
              count: countResults[index]?.submissions?.length ?? 0,
            })),
          )
          setActiveForms(active)
          setPlanningCenterIntegration(integrationData?.integration ?? null)
        }
      } catch (err) {
        if (!cancelled) {
          setCounts(null)
          setActiveForms(null)
          setPlanningCenterIntegration(null)
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
  }, [demoMode])

  const formsPath = adminFormsPath(organizationSlug)
  const integrationStatus = demoMode
    ? 'not_connected'
    : planningCenterIntegration?.status ?? 'not_connected'
  const isPlanningCenterLinked = integrationStatus === 'connected'
  const isPlanningCenterTokenUsable = planningCenterIntegration?.tokenUsable === true
  const needsPlanningCenterReconnect =
    isPlanningCenterLinked && !isPlanningCenterTokenUsable
  const integrationStatusLabel = getPlanningCenterStatusLabel(planningCenterIntegration)
  const integrationButtonLabel = getPlanningCenterActionLabel(planningCenterIntegration)

  async function handlePlanningCenterAction() {
    if (demoMode || integrationActionPending || !isOrganizationOwner) {
      return
    }

    setIntegrationError('')
    setIntegrationActionPending(true)

    try {
      if (isPlanningCenterLinked && isPlanningCenterTokenUsable) {
        const data = await disconnectPlanningCenterIntegration()
        setPlanningCenterIntegration(data.integration)
        return
      }

      const data = await connectPlanningCenterIntegration()

      if (data.authorizationUrl) {
        window.location.assign(data.authorizationUrl)
        return
      }

      setIntegrationError('Planning Center did not return a connection URL.')
    } catch (err) {
      setIntegrationError(
        err instanceof ApiError
          ? err.message
          : 'Unable to update the Planning Center connection.',
      )
    } finally {
      setIntegrationActionPending(false)
    }
  }

  return (
    <AdminLayout>
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
            {demoMode ? (
              'No active forms are configured for the demo.'
            ) : (
              <>
                No active forms yet.{' '}
                <Link to={formsPath}>Go to Forms</Link> to create one or turn a form on.
              </>
            )}
          </p>
        ) : null}
      </section>

      <section className="admin-dashboard-panel" aria-labelledby="dashboard-integrations-heading">
        <h2 id="dashboard-integrations-heading" className="admin-dashboard-section__title">
          Integrations
        </h2>
        <div className="admin-integration-block">
          <div className="admin-integration-row">
            <div className="admin-integration-row__info">
              <span className="admin-integration-row__name">Planning Center</span>
              <span
                className={`admin-integration-row__status${needsPlanningCenterReconnect ? ' admin-integration-row__status--warning' : ''}`}
              >
                {integrationStatusLabel}
              </span>
            </div>
            <div className="admin-integration-row__actions">
              <button
                type="button"
                className={`${softBtn.softBtn} ${demoMode || !isOrganizationOwner ? 'admin-integration-row__action--disabled' : ''}`}
                disabled={demoMode || integrationActionPending || !isOrganizationOwner}
                aria-disabled={demoMode || integrationActionPending || !isOrganizationOwner}
                onClick={handlePlanningCenterAction}
              >
                {integrationActionPending ? 'Working...' : integrationButtonLabel}
              </button>
              {!demoMode && !isOrganizationOwner ? (
                <span className="admin-info-tip">
                  <button
                    type="button"
                    className="admin-info-mark"
                    aria-label={PLANNING_CENTER_OWNER_ONLY_HINT}
                  >
                    i
                  </button>
                  <span className="admin-info-tip__bubble" role="tooltip">
                    {PLANNING_CENTER_OWNER_ONLY_HINT}
                  </span>
                </span>
              ) : null}
            </div>
          </div>
          {!demoMode && needsPlanningCenterReconnect ? (
            <p className="admin-muted admin-integration-row__help admin-integration-row__help--warning">
              {isOrganizationOwner
                ? 'The Planning Center sign-in has expired. Use Reconnect Planning Center to sync volunteers again.'
                : 'The Planning Center sign-in has expired. Ask your organization owner to reconnect from this dashboard.'}
            </p>
          ) : null}
          {!demoMode ? (
            <p className="admin-muted admin-integration-row__help">
              When you connect, we create a <strong>SW: …</strong> tab on person profiles for each
              volunteer form (for example <strong>SW: Volunteering</strong>), with custom fields
              filled when you send a volunteer from ServeWell to Planning Center.
            </p>
          ) : null}
        </div>
        {integrationError ? (
          <p className="admin-error admin-integration-row__message">{integrationError}</p>
        ) : null}
        {demoMode ? (
          <p className="admin-muted admin-integration-row__demo-note">
            In a live church account, connecting Planning Center would let you send an approved
            volunteer to People, add notes, and map their serving interests to the right teams—
            without retyping everything from ServeWell.
          </p>
        ) : null}
      </section>
    </AdminLayout>
  )
}

function getPlanningCenterStatusLabel(integration) {
  if (!integration || integration.status === 'not_connected') {
    return 'Not connected'
  }

  if (integration.status === 'connected') {
    if (integration.tokenUsable === false) {
      const org = integration.externalOrganizationName
      return org
        ? `Reconnect required (${org})`
        : 'Reconnect required — session expired'
    }

    return integration.externalOrganizationName
      ? `Connected to ${integration.externalOrganizationName}`
      : 'Connected'
  }

  if (integration.status === 'disabled') {
    return 'Disconnected'
  }

  return 'Connection error'
}

function getPlanningCenterActionLabel(integration) {
  if (!integration || integration.status !== 'connected') {
    return 'Connect Planning Center'
  }

  if (integration.tokenUsable === false) {
    return 'Reconnect Planning Center'
  }

  return 'Disconnect Planning Center'
}
