/** When on, this serving area is hidden from the public volunteer form. */
export default function AdminAreaHideToggle({ hidden, onChange, inputId }) {
  return (
    <div className="admin-visibility">
      <span className="admin-visibility__label" id={`${inputId}-label`}>
        Visibility
      </span>
      <label className="admin-toggle" htmlFor={inputId}>
        <input
          id={inputId}
          type="checkbox"
          className="admin-toggle__input"
          checked={hidden}
          onChange={(event) => onChange(event.target.checked)}
          aria-labelledby={`${inputId}-label`}
        />
        <span className="admin-toggle__track" aria-hidden="true">
          <span className="admin-toggle__thumb" />
        </span>
        <span className="admin-toggle__text">{hidden ? 'Hidden from form' : 'Visible on form'}</span>
      </label>
    </div>
  )
}
