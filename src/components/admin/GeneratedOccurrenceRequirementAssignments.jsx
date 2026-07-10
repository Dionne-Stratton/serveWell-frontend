import { useEffect, useRef, useState } from 'react'
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
  readOnly = false,
}) {
  const isFull = requirement.assignedCount >= requirement.neededCount
  const canAssign = Boolean(requirement.scheduleServingAreaId) && !isFull && !readOnly
  const eligibleKey = canAssign
    ? `${generatedScheduleId}:${occurrenceId}:${requirement.id}:${requirement.assignedCount}:${requirement.assignments?.length ?? 0}`
    : `closed:${requirement.id}`

  const [eligible, setEligible] = useState([])
  const [eligibleStatus, setEligibleStatus] = useState(canAssign ? 'loading' : 'ready')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [removingId, setRemovingId] = useState(null)
  const [prevEligibleKey, setPrevEligibleKey] = useState(eligibleKey)
  const onErrorRef = useRef(onError)

  useEffect(() => {
    onErrorRef.current = onError
  }, [onError])

  if (eligibleKey !== prevEligibleKey) {
    setPrevEligibleKey(eligibleKey)
    setSelectedSubmissionId('')
    if (canAssign) {
      setEligibleStatus('loading')
    } else {
      setEligible([])
      setEligibleStatus('ready')
    }
  }

  const eligibleReady = eligibleStatus === 'ready'
  const eligiblePending = !eligibleReady
  const noEligibleVolunteers = eligibleReady && eligible.length === 0
  const showVolunteerPicker = eligibleReady && eligible.length > 0

  useEffect(() => {
    if (!canAssign) {
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const data = await getAdminGeneratedOccurrenceEligibleVolunteers(
          generatedScheduleId,
          occurrenceId,
          requirement.id,
        )
        if (cancelled) {
          return
        }
        setEligible(Array.isArray(data?.volunteers) ? data.volunteers : [])
        setEligibleStatus('ready')
      } catch (err) {
        if (cancelled) {
          return
        }
        setEligible([])
        setEligibleStatus('ready')
        onErrorRef.current(
          err instanceof ApiError ? err.message : 'Unable to load volunteers.',
        )
      }
    })()

    return () => {
      cancelled = true
    }
  }, [canAssign, eligibleKey, generatedScheduleId, occurrenceId, requirement.id])

  async function reloadEligible() {
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
      onError(
        err instanceof ApiError ? err.message : 'Unable to load volunteers.',
      )
    }
  }

  async function handleAssign() {
    if (!selectedSubmissionId) {
      onError('Choose a volunteer to assign.')
      return
    }

    const submissionId = Number(selectedSubmissionId)
    const selectedVolunteer = eligible.find((volunteer) => volunteer.submissionId === submissionId)
    const needsMultipleRolesConfirm = Boolean(selectedVolunteer?.multipleRolesOnOccurrenceWarning)
    const needsFrequencyConfirm = Boolean(selectedVolunteer?.frequencyLimitWarning)

    if (needsMultipleRolesConfirm || needsFrequencyConfirm) {
      const lines = []
      if (needsMultipleRolesConfirm) {
        const roles = selectedVolunteer.otherRolesOnOccurrence?.filter(Boolean) ?? []
        const roleList = roles.length ? roles.join(', ') : 'another role'
        lines.push(
          `This volunteer is already assigned to ${roleList} on this event.`,
        )
      }
      if (needsFrequencyConfirm) {
        lines.push(
          'This assignment would exceed their stated serving frequency for this schedule or month.',
        )
      }
      lines.push('Assign them to this role anyway?')
      const confirmed = window.confirm(lines.join('\n\n'))
      if (!confirmed) {
        return
      }
    }

    setAssigning(true)
    onError('')

    try {
      const data = await createAdminGeneratedOccurrenceAssignment(
        generatedScheduleId,
        occurrenceId,
        {
          requirementId: requirement.id,
          submissionId,
          ...(needsMultipleRolesConfirm ? { confirmMultipleRolesOnOccurrence: true } : {}),
          ...(needsFrequencyConfirm ? { confirmFrequencyOverride: true } : {}),
        },
      )
      onOccurrenceUpdated(data.occurrence)
      setSelectedSubmissionId('')
      void reloadEligible()
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
      void reloadEligible()
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
            ) : (
              <span className="admin-generated-occurrence-assignment-block__needs-badge">
                {' '}
                · Needs volunteers
              </span>
            )}
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
              {!readOnly ? (
                <button
                  type="button"
                  className="admin-danger-button admin-danger-button--compact"
                  disabled={removingId === assignment.id}
                  onClick={() => void handleRemove(assignment.id)}
                >
                  {removingId === assignment.id ? 'Removing…' : 'Remove'}
                </button>
              ) : null}
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
                No eligible volunteers (approved / ready to schedule with this serving area as an interest)
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
                {eligible.map((volunteer) => {
                  const suffixParts = []
                  if (volunteer.multipleRolesOnOccurrenceWarning) {
                    const roles = volunteer.otherRolesOnOccurrence?.filter(Boolean) ?? []
                    suffixParts.push(
                      roles.length
                        ? `already on this event: ${roles.join(', ')}`
                        : 'already on this event',
                    )
                  }
                  if (volunteer.frequencyLimitWarning) {
                    suffixParts.push('over frequency preference')
                  }
                  const suffix = suffixParts.length ? ` (${suffixParts.join('; ')})` : ''

                  return (
                    <option key={volunteer.submissionId} value={volunteer.submissionId}>
                      {volunteer.displayName}
                      {suffix}
                    </option>
                  )
                })}
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
