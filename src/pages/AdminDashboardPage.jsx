import { useCallback, useEffect, useState } from 'react'
import { ApiError, getAdminSubmissions } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import SubmissionListItem from '../components/admin/SubmissionListItem'
import { submissionStatusOptions } from '../constants/enums'

export default function AdminDashboardPage() {
  const [submissions, setSubmissions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)

  const loadSubmissions = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const data = await getAdminSubmissions({
        search: searchInput.trim() || undefined,
        status: statusFilter || undefined,
        archived: includeArchived ? undefined : false
      })
      setSubmissions(data.submissions ?? [])
    } catch (err) {
      setSubmissions([])
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to load submissions. Is the API running?'
      )
    } finally {
      setLoading(false)
    }
  }, [searchInput, statusFilter, includeArchived])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const data = await getAdminSubmissions({
          search: searchInput.trim() || undefined,
          status: statusFilter || undefined,
          archived: includeArchived ? undefined : false
        })
        if (!cancelled) {
          setSubmissions(data.submissions ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setSubmissions([])
          setError(
            err instanceof ApiError
              ? err.message
              : 'Unable to load submissions. Is the API running?'
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [searchInput, statusFilter, includeArchived])

  function handleFilterSubmit(event) {
    event.preventDefault()
    loadSubmissions()
  }

  return (
    <AdminLayout title="Admin dashboard">
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
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="submission-status">
              Status
            </label>
            <select
              id="submission-status"
              className="admin-input admin-input--select"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
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
            checked={includeArchived}
            onChange={(event) => setIncludeArchived(event.target.checked)}
          />
          <span>Include archived submissions</span>
        </label>
        <div className="admin-filters__actions">
          <button type="submit" className="admin-button admin-button--secondary">
            Apply filters
          </button>
          <button
            type="button"
            className="admin-button admin-button--secondary"
            onClick={() => {
              setSearchInput('')
              setStatusFilter('')
              setIncludeArchived(false)
            }}
          >
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
              <SubmissionListItem key={submission.id} submission={submission} />
            ))}
          </div>
        </>
      ) : null}
    </AdminLayout>
  )
}
