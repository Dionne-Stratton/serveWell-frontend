import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ApiError,
  getPlanningCenterIntegration,
  getPlanningCenterPeopleTabs,
  importPlanningCenterPerson,
  previewPlanningCenterImport,
  searchPlanningCenterPeople,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import softBtn from '../styles/adminSoftButtons.module.css'
import {
  adminDashboardPath,
  adminVolunteerDetailPath,
} from '../utils/organizationPaths'

const SEARCH_DEBOUNCE_MS = 350

export default function AdminImportPage() {
  const { organizationSlug } = useParams()

  const [integration, setIntegration] = useState(null)
  const [integrationLoading, setIntegrationLoading] = useState(true)
  const [tabs, setTabs] = useState([])

  const [personQuery, setPersonQuery] = useState('')
  const [personResults, setPersonResults] = useState([])
  const [personSearchPending, setPersonSearchPending] = useState(false)
  const [selectedPerson, setSelectedPerson] = useState(null)

  const [tabId, setTabId] = useState('')

  const [preview, setPreview] = useState(null)
  const [previewPending, setPreviewPending] = useState(false)
  const [importPending, setImportPending] = useState(false)
  const [error, setError] = useState('')
  const [alreadyImportedSubmissionId, setAlreadyImportedSubmissionId] = useState(null)
  const [importSuccessSubmissionId, setImportSuccessSubmissionId] = useState(null)

  const dashboardPath = adminDashboardPath(organizationSlug)

  const isConnected =
    integration?.status === 'connected' && integration?.tokenUsable === true
  const needsReconnect =
    integration?.status === 'connected' && integration?.tokenUsable === false

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIntegrationLoading(true)
      setError('')

      try {
        const integrationData = await getPlanningCenterIntegration()
        const connectedIntegration = integrationData?.integration ?? null
        let tabsList = []

        if (
          connectedIntegration?.status === 'connected' &&
          connectedIntegration?.tokenUsable !== false
        ) {
          try {
            const tabsData = await getPlanningCenterPeopleTabs()
            tabsList = tabsData.tabs ?? []
          } catch {
            tabsList = []
          }
        }

        if (!cancelled) {
          setIntegration(connectedIntegration)
          setTabs(tabsList)
        }
      } catch (err) {
        if (!cancelled) {
          setIntegration(null)
          setTabs([])
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load import settings. Is the API running?',
          )
        }
      } finally {
        if (!cancelled) {
          setIntegrationLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isConnected) {
      setPersonResults([])
      return undefined
    }

    const query = personQuery.trim()

    if (query.length < 2) {
      setPersonResults([])
      return undefined
    }

    const handle = window.setTimeout(async () => {
      setPersonSearchPending(true)

      try {
        const data = await searchPlanningCenterPeople(query)
        setPersonResults(data.people ?? [])
      } catch (err) {
        setPersonResults([])
        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to search Planning Center people.',
        )
      } finally {
        setPersonSearchPending(false)
      }
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(handle)
  }, [personQuery, isConnected])

  const canPreview = Boolean(selectedPerson && tabId)

  const importPayload = useMemo(() => {
    if (!selectedPerson || !tabId) {
      return null
    }

    return {
      personId: selectedPerson.id,
      tabId,
    }
  }, [selectedPerson, tabId])

  const runPreview = useCallback(async () => {
    if (!importPayload) {
      return
    }

    setPreviewPending(true)
    setError('')
    setAlreadyImportedSubmissionId(null)
    setImportSuccessSubmissionId(null)

    try {
      const data = await previewPlanningCenterImport(importPayload)
      setPreview(data.preview ?? null)
    } catch (err) {
      setPreview(null)
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to build import preview.',
      )
    } finally {
      setPreviewPending(false)
    }
  }, [importPayload])

  useEffect(() => {
    if (!canPreview) {
      setPreview(null)
      return
    }

    runPreview()
  }, [canPreview, runPreview])

  async function handleImport() {
    if (!importPayload || !preview) {
      return
    }

    setImportPending(true)
    setError('')
    setAlreadyImportedSubmissionId(null)

    try {
      const data = await importPlanningCenterPerson(importPayload)
      setImportSuccessSubmissionId(data.submissionId)
    } catch (err) {
      if (err instanceof ApiError && err.code === 'ALREADY_IMPORTED' && err.submissionId) {
        setAlreadyImportedSubmissionId(err.submissionId)
        setError('Already imported')
      } else {
        setError(
          err instanceof ApiError
            ? err.message
            : 'Unable to complete import.',
        )
      }
    } finally {
      setImportPending(false)
    }
  }

  function handleSelectPerson(person) {
    setSelectedPerson(person)
    setPersonQuery(person.displayName)
    setPersonResults([])
    setPreview(null)
    setImportSuccessSubmissionId(null)
    setAlreadyImportedSubmissionId(null)
    setError('')
  }

  const volunteerDetailPath =
    importSuccessSubmissionId || alreadyImportedSubmissionId
      ? adminVolunteerDetailPath(
          organizationSlug,
          importSuccessSubmissionId ?? alreadyImportedSubmissionId,
        )
      : null

  return (
    <AdminLayout>
      <section className="admin-dashboard-panel admin-import-panel" aria-labelledby="admin-import-heading">
        <h1 id="admin-import-heading" className="admin-dashboard-section__title">
          Import from Planning Center
        </h1>
        <p className="admin-muted admin-import-panel__lead">
          Pull a person&apos;s data from a Planning Center custom tab into ServeWell. The tab name
          becomes the volunteer&apos;s source label in Volunteers.
        </p>

        {integrationLoading ? (
          <p className="admin-muted">Loading…</p>
        ) : null}

        {!integrationLoading && !isConnected ? (
          <div className="admin-import-empty" role="status">
            <p>Connect Planning Center before importing people.</p>
            {needsReconnect ? (
              <p className="admin-muted">
                Your Planning Center sign-in has expired. Reconnect from the dashboard.
              </p>
            ) : null}
            <Link to={dashboardPath} className={`${softBtn.softBtn} admin-import-empty__action`}>
              Go to dashboard integrations
            </Link>
          </div>
        ) : null}

        {!integrationLoading && isConnected ? (
          <div className="admin-import-flow">
            <div className="admin-import-step">
              <h2 className="admin-import-step__title">1. Choose a person</h2>
              <label className="admin-label" htmlFor="pc-person-search">
                Search Planning Center
              </label>
              <input
                id="pc-person-search"
                type="search"
                className="admin-input"
                value={personQuery}
                onChange={(event) => {
                  setPersonQuery(event.target.value)
                  setSelectedPerson(null)
                  setPreview(null)
                }}
                placeholder="Name or email"
                autoComplete="off"
              />
              {personSearchPending ? (
                <p className="admin-muted admin-import-hint">Searching…</p>
              ) : null}
              {personResults.length > 0 && !selectedPerson ? (
                <ul className="admin-import-person-results">
                  {personResults.map((person) => (
                    <li key={person.id}>
                      <button
                        type="button"
                        className="admin-import-person-results__item"
                        onClick={() => handleSelectPerson(person)}
                      >
                        <span className="admin-import-person-results__name">
                          {person.displayName || 'Unnamed'}
                        </span>
                        <span className="admin-import-person-results__meta">
                          {[person.email, person.phone].filter(Boolean).join(' · ') ||
                            'No contact on file'}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {selectedPerson ? (
                <p className="admin-import-selected">
                  Selected: <strong>{selectedPerson.displayName}</strong>
                </p>
              ) : null}
            </div>

            <div className="admin-import-step">
              <h2 className="admin-import-step__title">2. Choose a Planning Center tab</h2>
              <label className="admin-label" htmlFor="import-tab-select">
                Custom tab to import
              </label>
              <select
                id="import-tab-select"
                className="admin-input admin-input--select"
                value={tabId}
                onChange={(event) => {
                  setTabId(event.target.value)
                  setPreview(null)
                  setImportSuccessSubmissionId(null)
                  setAlreadyImportedSubmissionId(null)
                }}
              >
                <option value="">Select a tab…</option>
                {tabs.map((tab) => (
                  <option key={tab.id} value={tab.id}>
                    {tab.name}
                  </option>
                ))}
              </select>
              <p className="admin-muted admin-import-hint">
                All fields on this tab are stored as imported source data. The tab does not need to
                match a ServeWell form.
              </p>
            </div>

            <div className="admin-import-step">
              <h2 className="admin-import-step__title">3. Preview</h2>
              {previewPending ? <p className="admin-muted">Building preview…</p> : null}
              {!previewPending && !canPreview ? (
                <p className="admin-muted">Select a person and tab to preview.</p>
              ) : null}
              {preview ? (
                <div className="admin-import-preview">
                  <dl className="admin-dl admin-dl--compact">
                    <div>
                      <dt>Name</dt>
                      <dd>
                        {preview.firstName} {preview.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd>{preview.email ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{preview.phone ?? '—'}</dd>
                    </div>
                    <div>
                      <dt>Planning Center tab</dt>
                      <dd>{preview.tabName}</dd>
                    </div>
                  </dl>
                  <div className="admin-import-preview__fields">
                    <h3 className="admin-import-preview__fields-title">Tab fields</h3>
                    {preview.customFields?.length > 0 ? (
                      <ul className="admin-import-preview__field-list">
                        {preview.customFields.map((field) => (
                          <li key={field.fieldDefinitionId}>
                            <span className="admin-import-preview__field-name">{field.name}</span>
                            <span className="admin-import-preview__field-value">
                              {field.value?.trim() ? field.value : '—'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="admin-muted">This tab has no field definitions.</p>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="admin-import-actions">
              <button
                type="button"
                className={`${softBtn.softBtn} ${softBtn.softBtnPrimary}`}
                disabled={!preview || importPending || Boolean(importSuccessSubmissionId)}
                onClick={handleImport}
              >
                {importPending ? 'Importing…' : 'Import into ServeWell'}
              </button>
            </div>

            {error ? (
              <p className="admin-error" role="alert">
                {error}
                {alreadyImportedSubmissionId && volunteerDetailPath ? (
                  <>
                    {' '}
                    <Link to={volunteerDetailPath}>View existing record</Link>
                  </>
                ) : null}
              </p>
            ) : null}

            {importSuccessSubmissionId && volunteerDetailPath ? (
              <p className="admin-import-success" role="status">
                Import complete.{' '}
                <Link to={volunteerDetailPath}>Open volunteer record</Link>
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </AdminLayout>
  )
}
