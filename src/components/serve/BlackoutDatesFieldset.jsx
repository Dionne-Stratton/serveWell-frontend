import {
  applyBlackoutEndChange,
  applyBlackoutStartChange,
  emptyBlackoutDateRow,
  latestIsoDate,
  todayIsoDateLocal,
} from './blackoutDateUtils'

export default function BlackoutDatesFieldset({
  rows,
  onChange,
  fieldErrors = {},
  variant = 'serve',
}) {
  const isServe = variant === 'serve'
  const disallowPastDates = isServe
  const changeOptions = { disallowPastDates }

  function updateRow(index, patch) {
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  function removeRow(index) {
    onChange(rows.filter((_, i) => i !== index))
  }

  function addRow() {
    onChange([...rows, emptyBlackoutDateRow()])
  }

  const legendClass = isServe ? 'serve-fieldset__legend' : undefined
  const fieldsetClass = isServe ? 'serve-fieldset' : 'admin-volunteer-edit__blackout'
  const helpClass = isServe ? 'serve-help' : 'admin-help'
  const rowClass = isServe ? 'serve-blackout-row' : 'admin-blackout-row'
  const actionsClass = isServe ? 'serve-blackout-actions' : 'admin-blackout-actions'
  const addButtonClass = isServe
    ? 'serve-button serve-button--secondary serve-blackout-add'
    : 'admin-secondary-button admin-blackout-add'

  const today = disallowPastDates ? todayIsoDateLocal() : null

  return (
    <fieldset className={fieldsetClass} id="blackout-dates">
      {!isServe ? null : <legend className={legendClass}>Blackout dates</legend>}
      {isServe ? null : (
        <>
          <legend className="admin-visually-hidden">Blackout dates</legend>
          <h3 className="admin-volunteer-edit__subsection-title">Blackout dates</h3>
        </>
      )}
      <p className={helpClass}>
        Add any upcoming dates you know you won&apos;t be available to serve.
      </p>
      {fieldErrors.blackoutDates ? (
        <p className={isServe ? 'serve-field-error' : 'admin-error-inline'}>{fieldErrors.blackoutDates}</p>
      ) : null}
      {rows.length === 0 ? (
        <p className={isServe ? 'serve-muted' : 'admin-muted'}>No blackout dates added yet.</p>
      ) : (
        <ul className={isServe ? 'serve-blackout-list' : 'admin-blackout-list'}>
          {rows.map((row, index) => {
            const startValue = row.startDate?.trim() ?? ''
            const endValue = row.endDate?.trim() ?? ''
            const endMin = disallowPastDates
              ? latestIsoDate(startValue, today) || today
              : startValue || undefined

            return (
            <li key={`blackout-${index}`} className={rowClass}>
              <div className={isServe ? 'serve-field' : 'admin-field'}>
                <label className={isServe ? 'serve-label' : 'admin-label'} htmlFor={`blackout-start-${index}`}>
                  Start date
                </label>
                <input
                  id={`blackout-start-${index}`}
                  type="date"
                  className={isServe ? 'serve-input' : 'admin-input'}
                  value={row.startDate}
                  min={disallowPastDates ? today : undefined}
                  max={endValue || undefined}
                  onChange={(event) =>
                    updateRow(index, applyBlackoutStartChange(row, event.target.value, changeOptions))
                  }
                />
                {fieldErrors[`blackoutDates-${index}-start`] ? (
                  <p className={isServe ? 'serve-field-error' : 'admin-error-inline'}>
                    {fieldErrors[`blackoutDates-${index}-start`]}
                  </p>
                ) : null}
              </div>
              <div className={isServe ? 'serve-field' : 'admin-field'}>
                <label className={isServe ? 'serve-label' : 'admin-label'} htmlFor={`blackout-end-${index}`}>
                  End date
                </label>
                <input
                  id={`blackout-end-${index}`}
                  type="date"
                  className={isServe ? 'serve-input' : 'admin-input'}
                  value={row.endDate}
                  min={endMin || undefined}
                  onChange={(event) =>
                    updateRow(index, applyBlackoutEndChange(row, event.target.value, changeOptions))
                  }
                />
                {fieldErrors[`blackoutDates-${index}-end`] ? (
                  <p className={isServe ? 'serve-field-error' : 'admin-error-inline'}>
                    {fieldErrors[`blackoutDates-${index}-end`]}
                  </p>
                ) : null}
              </div>
              <div className={isServe ? 'serve-field' : 'admin-field'}>
                <label className={isServe ? 'serve-label' : 'admin-label'} htmlFor={`blackout-note-${index}`}>
                  Note
                </label>
                <input
                  id={`blackout-note-${index}`}
                  type="text"
                  className={isServe ? 'serve-input' : 'admin-input'}
                  value={row.note}
                  placeholder="Optional"
                  onChange={(event) => updateRow(index, { note: event.target.value })}
                />
              </div>
              <div className={actionsClass}>
                <button
                  type="button"
                  className={
                    isServe
                      ? 'serve-link-button'
                      : 'admin-danger-button admin-danger-button--compact'
                  }
                  onClick={() => removeRow(index)}
                >
                  Remove
                </button>
              </div>
            </li>
            )
          })}
        </ul>
      )}
      <button type="button" className={addButtonClass} onClick={addRow}>
        Add blackout date
      </button>
    </fieldset>
  )
}
