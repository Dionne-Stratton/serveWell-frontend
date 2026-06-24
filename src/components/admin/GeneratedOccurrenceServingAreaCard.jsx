import { useMemo, useState } from 'react'
import GeneratedOccurrenceNotesSection from './GeneratedOccurrenceNotesSection'
import GeneratedOccurrenceRequirementAssignments from './GeneratedOccurrenceRequirementAssignments'
import GeneratedOccurrenceResourcesSection from './GeneratedOccurrenceResourcesSection'
import {
  requirementNeedsVolunteers,
  requirementStaffingStatus,
} from './occurrenceScope'

export default function GeneratedOccurrenceServingAreaCard({
  requirement,
  notes,
  resources,
  servingAreaOptions,
  generatedScheduleId,
  occurrenceId,
  expanded,
  onToggleExpanded,
  onOccurrenceUpdated,
}) {
  const [error, setError] = useState('')

  const staffingStatus = requirementStaffingStatus(requirement)
  const isFull = staffingStatus === 'complete'
  const areaScope = useMemo(() => {
    const areaId = requirement.scheduleServingAreaId
    return areaId ? { areaId } : null
  }, [requirement.scheduleServingAreaId])

  const idPrefix = `occ-area-${requirement.id}`

  function handleOccurrenceUpdated(next) {
    if (next) {
      setError('')
      onOccurrenceUpdated(next)
    }
  }

  const panelProps = {
    servingAreaOptions,
    generatedScheduleId,
    occurrenceId,
    onOccurrenceUpdated: handleOccurrenceUpdated,
    embedded: true,
  }

  return (
    <article
      className={`admin-generated-occurrence-card admin-generated-occurrence-dialog__area-card admin-generated-occurrence-card--staffing-${staffingStatus}`}
    >
      <div className="admin-generated-occurrence-card__toolbar">
        <div className="admin-generated-occurrence-dialog__area-card-summary">
          <h3 className="admin-generated-occurrence-card__title">{requirement.displayName}</h3>
          <p
            className={`admin-generated-occurrence-card__staffing-summary admin-generated-occurrence-card__staffing-summary--${staffingStatus}`}
          >
            {requirement.assignedCount}/{requirement.neededCount} assigned
            {isFull ? ' · Fully covered' : ' · Needs volunteers'}
          </p>
        </div>
        <button
          type="button"
          className="admin-generated-occurrence-card__expand"
          aria-expanded={expanded}
          aria-controls={`${idPrefix}-panel`}
          onClick={onToggleExpanded}
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded ? (
        <div
          id={`${idPrefix}-panel`}
          className="admin-generated-occurrence-dialog__area-card-body"
        >
          {error ? <p className="admin-error">{error}</p> : null}

          <GeneratedOccurrenceRequirementAssignments
            requirement={requirement}
            generatedScheduleId={generatedScheduleId}
            occurrenceId={occurrenceId}
            onOccurrenceUpdated={handleOccurrenceUpdated}
            onError={setError}
            compact
          />

          {areaScope ? (
            <>
              <GeneratedOccurrenceNotesSection
                {...panelProps}
                notes={notes}
                scope={areaScope}
                idPrefix={`${idPrefix}-notes`}
                onError={setError}
              />
              <GeneratedOccurrenceResourcesSection
                {...panelProps}
                resources={resources}
                scope={areaScope}
                idPrefix={`${idPrefix}-resources`}
                onError={setError}
              />
            </>
          ) : (
            <p className="admin-help">
              Notes and files for this row require a template serving area link.
            </p>
          )}
        </div>
      ) : null}
    </article>
  )
}

export function defaultServingAreaCardExpanded(requirement) {
  return requirementNeedsVolunteers(requirement)
}
