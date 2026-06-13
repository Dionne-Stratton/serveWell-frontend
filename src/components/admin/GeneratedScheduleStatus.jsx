import {
  labelGeneratedScheduleStatus,
  normalizeGeneratedScheduleStatus,
} from '../../constants/generatedScheduleStatus'

export default function GeneratedScheduleStatus({ status, className = '' }) {
  const normalized = normalizeGeneratedScheduleStatus(status)
  const label = labelGeneratedScheduleStatus(normalized)

  return (
    <span
      className={[
        'admin-generated-schedule-status',
        `admin-generated-schedule-status--${normalized}`,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {label}
    </span>
  )
}
