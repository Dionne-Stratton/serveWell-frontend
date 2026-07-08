import { formatDateOnly } from '../../constants/labels'

export default function GeneratedScheduleAssignSummary({ summary, onDismiss }) {
  if (!summary) {
    return null
  }

  const { slotsNeeded, slotsFilled, slotsUnfilled, attentionItems = [] } = summary
  const allFilled = slotsUnfilled === 0 && slotsNeeded > 0

  return (
    <section
      className={`admin-schedule-assign-summary${allFilled ? ' admin-schedule-assign-summary--complete' : ' admin-schedule-assign-summary--attention'}`}
      aria-labelledby="schedule-assign-summary-title"
    >
      <div className="admin-schedule-assign-summary__head">
        <h2 id="schedule-assign-summary-title" className="admin-schedule-assign-summary__title">
          Scheduling summary
        </h2>
        {onDismiss ? (
          <button
            type="button"
            className="admin-dialog__close admin-schedule-assign-summary__dismiss"
            aria-label="Dismiss summary"
            onClick={onDismiss}
          >
            ×
          </button>
        ) : null}
      </div>
      <p className="admin-schedule-assign-summary__stats">
        <strong>{slotsFilled}</strong> of <strong>{slotsNeeded}</strong> volunteer slots filled
        {slotsUnfilled > 0 ? (
          <>
            {' '}
            · <strong>{slotsUnfilled}</strong> still open
          </>
        ) : null}
      </p>
      {allFilled ? (
        <p className="admin-muted">All staffing slots were filled automatically. Review before publishing.</p>
      ) : (
        <p className="admin-muted">
          Some slots could not be filled automatically. Review events below and assign volunteers
          manually before publishing.
        </p>
      )}
      {attentionItems.length > 0 ? (
        <ul className="admin-schedule-assign-summary__attention-list">
          {attentionItems.map((item) => (
            <li key={`${item.occurrenceId}-${item.requirementId}`}>
              <span className="admin-schedule-assign-summary__attention-badge">Needs volunteers</span>
              {formatDateOnly(item.occurrenceDate)} — {item.occurrenceName} — {item.servingAreaName} (
              {item.assignedCount}/{item.neededCount} assigned)
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
