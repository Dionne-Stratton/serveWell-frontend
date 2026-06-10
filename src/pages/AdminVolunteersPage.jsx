import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ApiError,
  getAdminForms,
  getAdminFormDetail,
  getAdminSubmissions,
  getPlanningCenterImportSources,
} from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import softBtn from '../styles/adminSoftButtons.module.css'
import SubmissionListItem from '../components/admin/SubmissionListItem'
import { submissionStatusOptions } from '../constants/enums'

const emptyFilters = {
  search: '',
  status: '',
  source: '',
  formSectionId: '',
  includeArchived: false,
}

function filtersToQuery(filters) {
  const source = filters.source?.trim() ?? ''
  let formId
  let planningCenterImportTabName

  if (source.startsWith('form:')) {
    formId = Number(source.slice(5))
  } else if (source.startsWith('pc:')) {
    planningCenterImportTabName = source.slice(3)
  }

  return {
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    formId: formId && !Number.isNaN(formId) ? formId : undefined,
    planningCenterImportTabName: planningCenterImportTabName || undefined,
    formSectionId: filters.formSectionId ? Number(filters.formSectionId) : undefined,
    archived: filters.includeArchived ? undefined : false,
  }
}

function sourceUsesServeWellForm(source) {
  return typeof source === 'string' && source.startsWith('form:')
}

function isAllowedStatus(value) {
  return submissionStatusOptions.some((option) => option.value === value)
}

export default function AdminVolunteersPage() {
  const [searchParams] = useSearchParams()
  const statusFromUrl = searchParams.get('status')
  const initialStatus =
    statusFromUrl && isAllowedStatus(statusFromUrl) ? statusFromUrl : ''

  const [submissions, setSubmissions] = useState([])
  const [forms, setForms] = useState([])
  const [importTabNames, setImportTabNames] = useState([])
  const [formSections, setFormSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draftFilters, setDraftFilters] = useState(() => ({
    ...emptyFilters,
    status: initialStatus,
  }))
  const [appliedFilters, setAppliedFilters] = useState(() => ({
    ...emptyFilters,
    status: initialStatus,
  }))

  const fetchSubmissions = useCallback(async (filters) => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminSubmissions(filtersToQuery(filters))
      setSubmissions(data.submissions ?? [])
    } catch (err) {
      setSubmissions([])
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load submissions. Is the API running?',
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSubmissions(appliedFilters)
  }, [appliedFilters, fetchSubmissions])

  useEffect(() => {
    if (!statusFromUrl || !isAllowedStatus(statusFromUrl)) {
      return
    }

    setDraftFilters((current) =>
      current.status === statusFromUrl ? current : { ...current, status: statusFromUrl },
    )
    setAppliedFilters((current) =>
      current.status === statusFromUrl ? current : { ...emptyFilters, status: statusFromUrl },
    )
  }, [statusFromUrl])

  useEffect(() => {
    let cancelled = false

    async function loadForms() {
      try {
        const [formsData, importSourcesData] = await Promise.all([
          getAdminForms(),
          getPlanningCenterImportSources().catch(() => ({
            planningCenterImportTabNames: [],
          })),
        ])
        if (!cancelled) {
          setForms(formsData.forms ?? [])
          setImportTabNames(importSourcesData.planningCenterImportTabNames ?? [])
        }
      } catch {
        if (!cancelled) {
          setForms([])
          setImportTabNames([])
        }
      }
    }

    loadForms()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const source = draftFilters.source

    if (!sourceUsesServeWellForm(source)) {
      setFormSections([])
      return undefined
    }

    const formId = Number(source.slice(5))

    let cancelled = false

    async function loadSections() {
      try {
        const data = await getAdminFormDetail(formId)
        if (!cancelled) {
          setFormSections(
            (data.sections ?? []).map((section) => ({
              id: section.id,
              title: section.title,
            })),
          )
        }
      } catch {
        if (!cancelled) {
          setFormSections([])
        }
      }
    }

    loadSections()

    return () => {
      cancelled = true
    }
  }, [draftFilters.source])

  function handleFilterSubmit(event) {
    event.preventDefault()
    setAppliedFilters({ ...draftFilters })
  }

  function handleSubmissionStatusUpdated(submissionId, nextStatus) {
    setSubmissions((current) =>
      current.map((item) =>
        item.id === submissionId ? { ...item, status: nextStatus } : item,
      ),
    )
  }

  function handleClearFilters() {
    setDraftFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
    setFormSections([])
  }

  return (
    <AdminLayout>
      <form className="admin-filters" onSubmit={handleFilterSubmit}>
        <div className="admin-filters__row">
          <div className="admin-field">
            <label className="admin-label" htmlFor="submission-search">
              Search
            </label>
            <input
              id="submission-search"
              className="admin-input"
              type="search"
              placeholder="Name, email, or phone"
              value={draftFilters.search}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="submission-source">
              Form / source
            </label>
            <select
              id="submission-source"
              className="admin-input admin-input--select"
              value={draftFilters.source}
              onChange={(event) => {
                const nextSource = event.target.value
                setDraftFilters((current) => ({
                  ...current,
                  source: nextSource,
                  formSectionId: '',
                }))
              }}
            >
              <option value="">All forms &amp; sources</option>
              {forms.length > 0 ? (
                <optgroup label="ServeWell forms">
                  {forms.map((form) => (
                    <option key={`form-${form.id}`} value={`form:${form.id}`}>
                      {form.name}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              {importTabNames.length > 0 ? (
                <optgroup label="Planning Center imports">
                  {importTabNames.map((tabName) => (
                    <option key={`pc-${tabName}`} value={`pc:${tabName}`}>
                      {tabName}
                    </option>
                  ))}
                </optgroup>
              ) : null}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="submission-section">
              Section
            </label>
            <select
              id="submission-section"
              className="admin-input admin-input--select"
              value={draftFilters.formSectionId}
              disabled={!sourceUsesServeWellForm(draftFilters.source)}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  formSectionId: event.target.value,
                }))
              }
            >
              <option value="">
                {sourceUsesServeWellForm(draftFilters.source)
                  ? 'All sections'
                  : 'Choose a ServeWell form first'}
              </option>
              {formSections.map((section) => (
                <option key={section.id} value={String(section.id)}>
                  {section.title}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="submission-status">
              Status
            </label>
            <select
              id="submission-status"
              className="admin-input admin-input--select"
              value={draftFilters.status}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  status: event.target.value,
                }))
              }
            >
              <option value="">All statuses</option>
              {submissionStatusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <label className="admin-choice">
          <input
            type="checkbox"
            checked={draftFilters.includeArchived}
            onChange={(event) =>
              setDraftFilters((current) => ({
                ...current,
                includeArchived: event.target.checked,
              }))
            }
          />
          <span>Include archived submissions</span>
        </label>
        <div className="admin-filters__actions">
          <button type="submit" className={softBtn.softBtn}>
            Apply filters
          </button>
          <button type="button" className={softBtn.softBtn} onClick={handleClearFilters}>
            Clear
          </button>
        </div>
      </form>

      {loading ? <p className="admin-loading">Loading submissions…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && !error ? (
        <>
          <p className="admin-summary">
            {submissions.length === 0
              ? 'No submissions match your filters.'
              : `${submissions.length} submission${submissions.length === 1 ? '' : 's'}`}
          </p>
          <div className="admin-submission-list">
            {submissions.map((submission) => (
              <SubmissionListItem
                key={submission.id}
                submission={submission}
                onStatusUpdated={handleSubmissionStatusUpdated}
              />
            ))}
          </div>
        </>
      ) : null}
    </AdminLayout>
  )
}
