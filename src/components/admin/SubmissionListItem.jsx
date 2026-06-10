import { Link, useLocation, useParams } from 'react-router-dom'
import { useAdminAuth } from '../../auth/useAdminAuth'
import { adminVolunteerDetailPath, resolveAdminOrganizationSlug } from '../../utils/organizationPaths'
import softBtn from '../../styles/adminSoftButtons.module.css'
import AdminSubmissionStatusSelect from './AdminSubmissionStatusSelect'
import {
  formatAvailabilityList,
  formatDateTime,
  labelFrequency,
  labelPreferredContact,
} from '../../constants/labels'

export default function SubmissionListItem({ submission, onStatusUpdated }) {
  const { organizationSlug: organizationSlugParam } = useParams()
  const { pathname } = useLocation()
  const { organization } = useAdminAuth()
  const organizationSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const detailPath = adminVolunteerDetailPath(organizationSlug, submission.id)
  const name = `${submission.firstName} ${submission.lastName}`.trim()
  const areas = submission.servingAreas?.length
    ? submission.servingAreas.join(', ')
    : '—'

  const staffNotes = submission.staffNotes ?? []
  const hasRequirementTags =
    submission.requiresBackgroundCheck || submission.requiresTraining
  const volunteerUpdateReviewNeeded = Boolean(submission.volunteerUpdateReviewNeeded)

  return (
    <article className="admin-submission-card">
      <header className="admin-submission-card__header">
        <h2 className="admin-submission-card__name">
          <Link to={detailPath}>{name}</Link>
          {volunteerUpdateReviewNeeded ? (
            <span className="admin-submission-card__volunteer-update-badge">
              Volunteer updated
            </span>
          ) : null}
          {submission.planningCenterImportedAt ? (
            <span className="admin-submission-card__pc-import-badge">
              Imported from Planning Center
            </span>
          ) : null}
        </h2>
        <AdminSubmissionStatusSelect
          submissionId={submission.id}
          status={submission.status}
          inline
          autosavedHint="below"
          onUpdated={(nextStatus) => onStatusUpdated?.(submission.id, nextStatus)}
        />
      </header>
      <dl className="admin-dl admin-dl--compact">
        <div>
          <dt>Form / source</dt>
          <dd>{submission.formName ?? '—'}</dd>
        </div>
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
        {hasRequirementTags ? (
          <div>
            <dt>Requirements</dt>
            <dd>
              <ul className="admin-submission-requirements">
                {submission.requiresBackgroundCheck ? <li>Background check</li> : null}
                {submission.requiresTraining ? <li>Training</li> : null}
              </ul>
            </dd>
          </div>
        ) : null}
        {staffNotes.length > 0 ? (
          <div>
            <dt>Staff notes</dt>
            <dd>
              {staffNotes.map((note, index) => (
                <span key={note.id}>
                  {index > 0 ? <br /> : null}
                  {index > 0 ? <br /> : null}
                  {note.note}
                </span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
      <p className="admin-submission-card__action">
        <Link to={detailPath} className={softBtn.softBtn}>
          View details
        </Link>
      </p>
    </article>
  )
}
