import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ApiError,
  createAdminGeneratedOccurrenceAssignment,
  deleteAdminGeneratedOccurrenceAssignment,
  getAdminGeneratedOccurrenceEligibleVolunteers,
} from '../../api/client'

export default function GeneratedOccurrenceRequirementAssignments({
  requirement,
  generatedScheduleId,
  occurrenceId,
  onOccurrenceUpdated,
  onError,
  compact = false,
}) {
  const [eligible, setEligible] = useState([])
  const [eligibleStatus, setEligibleStatus] = useState('loading')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const onErrorRef = useRef(onError)

  onErrorRef.current = onError

  const isFull = requirement.assignedCount >= requirement.neededCount
  const canAssign = Boolean(requirement.scheduleServingAreaId) && !isFull
  const eligibleReady = eligibleStatus === 'ready'
  const eligiblePending = !eligibleReady
  const noEligibleVolunteers = eligibleReady && eligible.length === 0
  const showVolunteerPicker = eligibleReady && eligible.length > 0

  const loadEligible = useCallback(async () => {
    if (!canAssign) {
      setEligible([])
      setEligibleStatus('ready')
      return
    }

    setEligibleStatus('loading')

    try {
      const data = await getAdminGeneratedOccurrenceEligibleVolunteers(
        generatedScheduleId,
        occurrenceId,
        requirement.id,
      )
      setEligible(Array.isArray(data?.volunteers) ? data.volunteers : [])
      setEligibleStatus('ready')
    } catch (err) {
      setEligible([])
      setEligibleStatus('ready')
      onErrorRef.current(
        err instanceof ApiError ? err.message : 'Unable to load volunteers.',
      )
    }
  }, [canAssign, generatedScheduleId, occurrenceId, requirement.id])

  useEffect(() => {
    setSelectedSubmissionId('')
    void loadEligible()
  }, [loadEligible, requirement.assignedCount, requirement.assignments?.length])

  async function handleAssign() {
    if (!selectedSubmissionId) {
      onError('Choose a volunteer to assign.')
      return
    }

    setAssigning(true)
    onError('')

    try {
      const data = await createAdminGeneratedOccurrenceAssignment(
        generatedScheduleId,
        occurrenceId,
        {
          requirementId: requirement.id,
          submissionId: Number(selectedSubmissionId),
        },
      )
      onOccurrenceUpdated(data.occurrence)
      setSelectedSubmissionId('')
      void loadEligible()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to assign volunteer.')
    } finally {
      setAssigning(false)
    }
  }

  async function handleRemove(assignmentId) {
    setRemovingId(assignmentId)
    onError('')

    try {
      const data = await deleteAdminGeneratedOccurrenceAssignment(
        generatedScheduleId,
        occurrenceId,
        assignmentId,
      )
      onOccurrenceUpdated(data.occurrence)
      void loadEligible()
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to remove assignment.')
    } finally {
      setRemovingId(null)
    }
  }

  const assignments = requirement.assignments ?? []

  return (
    <article
      className={`admin-generated-occurrence-assignment-block${compact ? ' admin-generated-occurrence-assignment-block--compact' : ''}`}
    >
      {!compact ? (
        <header className="admin-generated-occurrence-assignment-block__header">
          <h4 className="admin-generated-occurrence-assignment-block__title">
            {requirement.displayName}
          </h4>
          <p className="admin-muted admin-generated-occurrence-assignment-block__counts">
            {requirement.assignedCount}/{requirement.neededCount} assigned
            {isFull ? (
              <span className="admin-generated-occurrence-assignment-block__full-badge">
                {' '}
                · Fully covered
              </span>
            ) : null}
          </p>
        </header>
      ) : (
        <h4 className="admin-generated-occurrence-dialog__subsection-title admin-generated-occurrence-dialog__subsection-title--inline">
          Volunteers
        </h4>
      )}

      {assignments.length ? (
        <ul className="admin-generated-occurrence-assignment-block__volunteers">
          {assignments.map((assignment) => (
            <li key={assignment.id}>
              <span>{assignment.displayName}</span>
              <button
                type="button"
                className="admin-danger-button admin-danger-button--compact"
                disabled={removingId === assignment.id}
                onClick={() => void handleRemove(assignment.id)}
              >
                {removingId === assignment.id ? 'Removing…' : 'Remove'}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-muted admin-generated-occurrence-assignment-block__empty">
          No volunteers assigned yet.
        </p>
      )}

      {canAssign ? (
        <div
          className={`admin-generated-occurrence-assignment-block__assign-row${eligiblePending ? ' admin-generated-occurrence-assignment-block__assign-row--pending' : ''}`}
        >
          <div className="admin-field admin-generated-occurrence-assignment-block__select-field">
            <label className="admin-label" htmlFor={`assign-volunteer-${requirement.id}`}>
              Volunteer
            </label>
            {eligiblePending ? (
              <p
                id={`assign-volunteer-${requirement.id}`}
                className="admin-generated-occurrence-dialog__area-readonly admin-generated-occurrence-assignment-block__loading"
                aria-live="polite"
              >
                Loading volunteers…
              </p>
            ) : noEligibleVolunteers ? (
              <p
                id={`assign-volunteer-${requirement.id}`}
                className="admin-generated-occurrence-dialog__area-readonly admin-generated-occurrence-assignment-block__no-eligible"
              >
                No eligible active volunteers for this serving area
              </p>
            ) : (
              <select
                id={`assign-volunteer-${requirement.id}`}
                className="admin-input admin-input--select"
                value={selectedSubmissionId}
                disabled={assigning}
                onChange={(event) => setSelectedSubmissionId(event.target.value)}
              >
                <option value="">Select volunteer…</option>
                {eligible.map((volunteer) => (
                  <option key={volunteer.submissionId} value={volunteer.submissionId}>
                    {volunteer.displayName}
                  </option>
                ))}
              </select>
            )}
          </div>
          {showVolunteerPicker ? (
            <div className="admin-field admin-generated-occurrence-assignment-block__assign-action">
              <span className="admin-label admin-label--invisible" aria-hidden="true">
                Assign
              </span>
              <div className="admin-schedule-detail-row-action__button-wrap">
                <button
                  type="button"
                  className="admin-secondary-button"
                  disabled={assigning || !selectedSubmissionId}
                  onClick={() => void handleAssign()}
                >
                  {assigning ? 'Assigning…' : 'Assign volunteer'}
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {!requirement.scheduleServingAreaId ? (
        <p className="admin-help">
          This staffing row is not linked to a form serving area, so volunteer assignment is not
          available.
        </p>
      ) : null}
    </article>
  )
}
