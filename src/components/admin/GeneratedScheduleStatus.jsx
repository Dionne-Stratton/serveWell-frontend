import {
  labelGeneratedScheduleStatus,
  normalizeGeneratedScheduleStatus,
} from '../../constants/generatedScheduleStatus'

export default function GeneratedScheduleStatus({
  status,
  hasUnsentVolunteerUpdates = false,
  className = '',
}) {
  const normalized = normalizeGeneratedScheduleStatus(status)
  const label = labelGeneratedScheduleStatus(normalized)
  const showUnsent = normalized === 'published' && hasUnsentVolunteerUpdates
  const displayLabel = showUnsent ? `${label} • Unsent Changes` : label

  return (
    <span
      className={[
        'admin-generated-schedule-status',
        `admin-generated-schedule-status--${normalized}`,
        showUnsent ? 'admin-generated-schedule-status--unsent' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {displayLabel}
    </span>
  )
}
