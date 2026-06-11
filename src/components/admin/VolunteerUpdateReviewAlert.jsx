import { useMemo, useState } from 'react'
import { formatDateTime } from '../../constants/labels'
import {
  buildVolunteerUpdateDiff,
  groupVolunteerUpdateChanges,
} from '../../utils/volunteerUpdateDiff'

export default function VolunteerUpdateReviewAlert({
  submission,
  detail,
  markReviewPending,
  markReviewError,
  onMarkReviewed,
}) {
  const [comparisonOpen, setComparisonOpen] = useState(false)

  const snapshot = detail?.volunteerUpdatePendingSnapshot
  const groupedChanges = useMemo(() => {
    const changes = buildVolunteerUpdateDiff(snapshot, detail)
    return groupVolunteerUpdateChanges(changes)
  }, [snapshot, detail])

  const hasSnapshot = Boolean(snapshot)
  const hasChanges = groupedChanges.length > 0

  function handleMarkReviewed() {
    setComparisonOpen(false)
    onMarkReviewed()
  }

  return (
    <div className="admin-volunteer-update-review">
      <div className="admin-volunteer-update-review__alert" role="status">
        <p className="admin-volunteer-update-review__text">
          This volunteer updated their submission on{' '}
          {formatDateTime(submission.volunteerSelfUpdatedAt)}.
        </p>
        <div className="admin-volunteer-update-review__actions">
          <button
            type="button"
            className="admin-button admin-button--inline admin-volunteer-update-review__button"
            disabled={!hasSnapshot}
            aria-expanded={comparisonOpen}
            onClick={() => setComparisonOpen((open) => !open)}
          >
            {comparisonOpen ? 'Hide changes' : 'Review changes'}
          </button>
          <button
            type="button"
            className={`admin-button admin-button--inline admin-volunteer-update-review__button${markReviewPending ? ' admin-button--busy' : ''}`}
            disabled={markReviewPending}
            onClick={handleMarkReviewed}
          >
            {markReviewPending ? 'Saving…' : 'Mark reviewed'}
          </button>
        </div>
      </div>

      {markReviewError ? (
        <p className="admin-error admin-volunteer-update-review__error">{markReviewError}</p>
      ) : null}

      {comparisonOpen ? (
        <div className="admin-volunteer-update-review__panel">
          {!hasSnapshot ? (
            <p className="admin-muted">
              Change details are not available for this update (saved before comparison was
              enabled).
            </p>
          ) : !hasChanges ? (
            <p className="admin-muted">No field differences were detected compared to the saved snapshot.</p>
          ) : (
            groupedChanges.map((group) => (
              <section key={group.section} className="admin-volunteer-update-review__section">
                <h3 className="admin-volunteer-update-review__section-title">{group.section}</h3>
                <ul className="admin-volunteer-update-review__list">
                  {group.items.map((item) => (
                    <li key={`${group.section}-${item.label}`} className="admin-volunteer-update-review__item">
                      <div className="admin-volunteer-update-review__item-head">
                        <span className="admin-volunteer-update-review__item-label">{item.label}</span>
                        <span className="admin-volunteer-update-review__badge">Changed</span>
                      </div>
                      <div className="admin-volunteer-update-review__values">
                        <div className="admin-volunteer-update-review__value">
                          <span className="admin-volunteer-update-review__value-label">Before</span>
                          <span className="admin-volunteer-update-review__value-text">{item.before}</span>
                        </div>
                        <div className="admin-volunteer-update-review__value">
                          <span className="admin-volunteer-update-review__value-label">After</span>
                          <span className="admin-volunteer-update-review__value-text">{item.after}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}
