import {
  experienceLevelOptions,
  frequencyOptions,
} from "../../constants/enums";
import RequiredMark from "./RequiredMark";
import { confirmationKey } from "./volunteerFormUtils";

export default function ServingAreaInlineDetail({
  area,
  detail,
  confirmations,
  fieldErrors,
  onUpdateInterest,
  onToggleConfirmation,
}) {
  const acknowledgmentRequirements = area.requirements.filter(
    (requirement) => requirement.requiresConfirmation,
  );
  const infoRequirements = area.requirements.filter(
    (requirement) => !requirement.requiresConfirmation,
  );

  return (
    <div className="serve-area-inline" id={`serve-area-${area.id}`}>
      {area.publicNote ? (
        <p className="serve-info-note serve-info-note--area">{area.publicNote}</p>
      ) : null}

      {infoRequirements.map((requirement) => (
        <div key={requirement.id} className="serve-info-note">
          <p className="serve-info-note__label">
            <strong>{requirement.label}</strong>
          </p>
          {requirement.description ? (
            <p className="serve-info-note__desc">{requirement.description}</p>
          ) : null}
        </div>
      ))}

      {acknowledgmentRequirements.map((requirement) => {
        const errorKey = `confirmation-${area.id}-${requirement.id}`;
        return (
          <div key={requirement.id} className="serve-ack">
            <div className="serve-ack__info">
              <p className="serve-ack__label">
                <strong>{requirement.label}</strong>
              </p>
              {requirement.description ? (
                <p className="serve-ack__desc">{requirement.description}</p>
              ) : null}
            </div>
            <label className="serve-choice serve-ack__check">
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
                I understand and agree
                <RequiredMark />
              </span>
            </label>
            {fieldErrors[errorKey] ? (
              <p className="serve-field-error" id={`error-${errorKey}`}>
                {fieldErrors[errorKey]}
              </p>
            ) : null}
          </div>
        );
      })}

      <div className="serve-field serve-field--compact">
        <label className="serve-choice">
          <input
            type="checkbox"
            checked={detail.usesAreaSpecificFrequency}
            onChange={(event) =>
              onUpdateInterest(area.id, {
                usesAreaSpecificFrequency: event.target.checked,
                areaSpecificFrequency: event.target.checked
                  ? detail.areaSpecificFrequency
                  : "",
              })
            }
          />
          <span>Limit frequency for this area (optional)</span>
        </label>
      </div>

      {detail.usesAreaSpecificFrequency ? (
        <div className="serve-field serve-field--compact">
          <label className="serve-label" htmlFor={`area-frequency-${area.id}`}>
            Frequency for this area
            <RequiredMark />
          </label>
          <select
            id={`area-frequency-${area.id}`}
            className="serve-input serve-input--select"
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
              className="serve-field-error"
              id={`error-areaFrequency-${area.id}`}
            >
              {fieldErrors[`areaFrequency-${area.id}`]}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="serve-field serve-field--compact">
        <label className="serve-label" htmlFor={`experience-${area.id}`}>
          Experience in this area (optional)
        </label>
        <select
          id={`experience-${area.id}`}
          className="serve-input serve-input--select"
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

      <div className="serve-field serve-field--compact">
        <label className="serve-label" htmlFor={`notes-${area.id}`}>
          Notes for this area (optional)
        </label>
        <textarea
          id={`notes-${area.id}`}
          className="serve-input serve-input--textarea"
          rows={2}
          value={detail.interestNotes}
          onChange={(event) =>
            onUpdateInterest(area.id, { interestNotes: event.target.value })
          }
        />
      </div>
    </div>
  );
}
