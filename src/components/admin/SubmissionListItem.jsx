import { Link } from 'react-router-dom'
import {
  formatAvailabilityList,
  formatDateTime,
  labelFrequency,
  labelPreferredContact,
  labelSubmissionStatus
} from '../../constants/labels'

export default function SubmissionListItem({ submission }) {
  const name = `${submission.firstName} ${submission.lastName}`.trim()
  const areas = submission.servingAreas?.length
    ? submission.servingAreas.join(', ')
    : '—'

  return (
    <article className="admin-submission-card">
      <header className="admin-submission-card__header">
        <h2 className="admin-submission-card__name">
          <Link to={`/admin/submissions/${submission.id}`}>{name}</Link>
        </h2>
        <span className={`admin-status admin-status--${submission.status}`}>
          {labelSubmissionStatus(submission.status)}
        </span>
      </header>
      <dl className="admin-dl admin-dl--compact">
        <div>
          <dt>Contact</dt>
          <dd>
            {submission.email ?? submission.phone ?? '—'}
            {submission.email && submission.phone ? ` · ${submission.phone}` : ''}
          </dd>
        </div>
        <div>
          <dt>Preferred contact</dt>
          <dd>{labelPreferredContact(submission.preferredContactMethod)}</dd>
        </div>
        <div>
          <dt>Frequency</dt>
          <dd>{labelFrequency(submission.overallFrequency)}</dd>
        </div>
        <div>
          <dt>Availability</dt>
          <dd>{formatAvailabilityList(submission.availability)}</dd>
        </div>
        <div>
          <dt>Serving areas</dt>
          <dd>{areas}</dd>
        </div>
        <div>
          <dt>Submitted</dt>
          <dd>{formatDateTime(submission.createdAt)}</dd>
        </div>
      </dl>
      {(submission.requiresBackgroundCheck || submission.requiresTraining) && (
        <ul className="admin-flags">
          {submission.requiresBackgroundCheck ? <li>Background check</li> : null}
          {submission.requiresTraining ? <li>Training</li> : null}
        </ul>
      )}
      <p className="admin-submission-card__action">
        <Link to={`/admin/submissions/${submission.id}`} className="admin-link-button">
          View details
        </Link>
      </p>
    </article>
  )
}
