import {
  experienceLevelOptions,
  frequencyOptions,
} from '../../constants/enums'
import {
  confirmationKey,
} from '../serve/volunteerFormUtils'

function RequiredMark() {
  return (
    <span className="admin-label-required" aria-hidden>
      {' '}
      *
    </span>
  )
}

export default function AdminServingAreaInlineDetail({
  area,
  detail,
  confirmations,
  fieldErrors,
  onUpdateInterest,
  onToggleConfirmation,
}) {
  const acknowledgmentRequirements = area.requirements.filter(
    (requirement) => requirement.requiresConfirmation,
  )
  const infoRequirements = area.requirements.filter(
    (requirement) => !requirement.requiresConfirmation,
  )

  return (
    <div className="admin-area-inline" id={`serve-area-${area.id}`}>
      {infoRequirements.map((requirement) => (
        <p key={requirement.id} className="admin-area-inline__info">
          <strong>{requirement.label}</strong>
          {requirement.description ? ` — ${requirement.description}` : null}
        </p>
      ))}

      {acknowledgmentRequirements.map((requirement) => {
        const errorKey = `confirmation-${area.id}-${requirement.id}`
        return (
          <div key={requirement.id} className="admin-area-inline__ack">
            <p className="admin-muted admin-area-inline__ack-lead">
              <strong>{requirement.label}</strong>
              {requirement.description ? ` — ${requirement.description}` : null}
            </p>
            <label className="admin-choice admin-choice--inline">
              <input
                type="checkbox"
                checked={Boolean(
                  confirmations[confirmationKey(area.id, requirement.id)],
                )}
                onChange={(event) =>
                  onToggleConfirmation(
                    area.id,
                    requirement.id,
                    event.target.checked,
                  )
                }
              />
              <span>
                Confirmed
                <RequiredMark />
              </span>
            </label>
            {fieldErrors[errorKey] ? (
              <p className="admin-error-inline" id={`error-${errorKey}`}>
                {fieldErrors[errorKey]}
              </p>
            ) : null}
          </div>
        )
      })}

      <label className="admin-choice admin-choice--inline">
        <input
          type="checkbox"
          checked={detail.usesAreaSpecificFrequency}
          onChange={(event) =>
            onUpdateInterest(area.id, {
              usesAreaSpecificFrequency: event.target.checked,
              areaSpecificFrequency: event.target.checked
                ? detail.areaSpecificFrequency
                : '',
            })
          }
        />
        <span>Limit frequency for this area (optional)</span>
      </label>

      {detail.usesAreaSpecificFrequency ? (
        <div className="admin-field">
          <label className="admin-label" htmlFor={`area-frequency-${area.id}`}>
            Frequency for this area
            <RequiredMark />
          </label>
          <select
            id={`area-frequency-${area.id}`}
            className="admin-input admin-input--select"
            value={detail.areaSpecificFrequency}
            onChange={(event) =>
              onUpdateInterest(area.id, {
                areaSpecificFrequency: event.target.value,
              })
            }
          >
            <option value="">Select…</option>
            {frequencyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {fieldErrors[`areaFrequency-${area.id}`] ? (
            <p
              className="admin-error-inline"
              id={`error-areaFrequency-${area.id}`}
            >
              {fieldErrors[`areaFrequency-${area.id}`]}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="admin-field">
        <label className="admin-label" htmlFor={`experience-${area.id}`}>
          Experience in this area (optional)
        </label>
        <select
          id={`experience-${area.id}`}
          className="admin-input admin-input--select"
          value={detail.experienceLevel}
          onChange={(event) =>
            onUpdateInterest(area.id, { experienceLevel: event.target.value })
          }
        >
          <option value="">Select…</option>
          {experienceLevelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-field">
        <label className="admin-label" htmlFor={`notes-${area.id}`}>
          Notes for this area (optional)
        </label>
        <textarea
          id={`notes-${area.id}`}
          className="admin-textarea"
          rows={2}
          value={detail.interestNotes}
          onChange={(event) =>
            onUpdateInterest(area.id, { interestNotes: event.target.value })
          }
        />
      </div>
    </div>
  )
}
