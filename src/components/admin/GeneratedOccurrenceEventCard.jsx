import { formatDateOnly } from '../../constants/labels'
import { formatScheduleTime } from '../../constants/schedule'
import {
  getOccurrenceStaffingProgress,
  occurrenceStaffingSummaryLabel,
} from '../../utils/generatedOccurrenceStaffing'

export default function GeneratedOccurrenceEventCard({
  occurrence,
  expanded,
  onToggleExpanded,
  onOpen,
}) {
  const progress = getOccurrenceStaffingProgress(occurrence.requirements)
  const summaryLabel = occurrenceStaffingSummaryLabel(progress)
  const staffingStatus = !progress.hasNeeds
    ? 'none'
    : progress.fullyStaffed
      ? 'complete'
      : 'incomplete'
  const hasBreakdown = progress.hasNeeds

  return (
    <article
      className={`admin-generated-occurrence-card admin-generated-occurrence-card--staffing-${staffingStatus}`}
    >
      <div className="admin-generated-occurrence-card__toolbar">
        <button
          type="button"
          className="admin-generated-occurrence-card__open"
          onClick={() => onOpen(occurrence.id)}
        >
          <header className="admin-generated-occurrence-card__header">
            <h3 className="admin-generated-occurrence-card__title">
              {formatDateOnly(occurrence.occurrenceDate)}
            </h3>
            <p className="admin-muted admin-generated-occurrence-card__meta">
              {occurrence.name} · {formatScheduleTime(occurrence.startTime)}
            </p>
          </header>
          <p
            className={`admin-generated-occurrence-card__staffing-summary admin-generated-occurrence-card__staffing-summary--${staffingStatus}`}
          >
            {summaryLabel}
          </p>
        </button>

        {hasBreakdown ? (
          <button
            type="button"
            className="admin-generated-occurrence-card__expand"
            aria-expanded={expanded}
            aria-controls={`occurrence-staffing-${occurrence.id}`}
            onClick={(event) => {
              event.stopPropagation()
              onToggleExpanded(occurrence.id)
            }}
          >
            {expanded ? 'Hide staffing' : 'Show staffing'}
          </button>
        ) : null}
      </div>

      {expanded && hasBreakdown ? (
        <ul
          id={`occurrence-staffing-${occurrence.id}`}
          className="admin-generated-occurrence-card__staffing"
        >
          {occurrence.requirements.map((req) => {
            const rowComplete = (req.assignedCount ?? 0) >= (req.neededCount ?? 0)

            return (
              <li
                key={req.id}
                className={
                  rowComplete
                    ? 'admin-generated-occurrence-card__staffing-row--complete'
                    : 'admin-generated-occurrence-card__staffing-row--incomplete'
                }
              >
                {req.displayName}: {req.assignedCount}/{req.neededCount} assigned
              </li>
            )
          })}
        </ul>
      ) : null}

      {!hasBreakdown ? (
        <p className="admin-muted admin-generated-occurrence-card__staffing-empty">
          No staffing needs defined.
        </p>
      ) : null}
    </article>
  )
}
