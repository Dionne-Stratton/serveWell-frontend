import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, getAdminForms, getAdminFormDetail, getAdminSubmissions } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import softBtn from '../styles/adminSoftButtons.module.css'
import SubmissionListItem from '../components/admin/SubmissionListItem'
import { submissionStatusOptions } from '../constants/enums'

const emptyFilters = {
  search: '',
  status: '',
  formId: '',
  formSectionId: '',
  includeArchived: false,
}

function filtersToQuery(filters) {
  return {
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    formId: filters.formId ? Number(filters.formId) : undefined,
    formSectionId: filters.formSectionId ? Number(filters.formSectionId) : undefined,
    archived: filters.includeArchived ? undefined : false,
  }
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
        const data = await getAdminForms()
        if (!cancelled) {
          setForms(data.forms ?? [])
        }
      } catch {
        if (!cancelled) {
          setForms([])
        }
      }
    }

    loadForms()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const formId = draftFilters.formId

    if (!formId) {
      setFormSections([])
      return undefined
    }

    let cancelled = false

    async function loadSections() {
      try {
        const data = await getAdminFormDetail(Number(formId))
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
  }, [draftFilters.formId])

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
            <label className="admin-label" htmlFor="submission-form">
              Form
            </label>
            <select
              id="submission-form"
              className="admin-input admin-input--select"
              value={draftFilters.formId}
              onChange={(event) => {
                const nextFormId = event.target.value
                setDraftFilters((current) => ({
                  ...current,
                  formId: nextFormId,
                  formSectionId: '',
                }))
              }}
            >
              <option value="">All forms</option>
              {forms.map((form) => (
                <option key={form.id} value={String(form.id)}>
                  {form.name}
                </option>
              ))}
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
              disabled={!draftFilters.formId}
              onChange={(event) =>
                setDraftFilters((current) => ({
                  ...current,
                  formSectionId: event.target.value,
                }))
              }
            >
              <option value="">
                {draftFilters.formId ? 'All sections' : 'Choose a form first'}
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
