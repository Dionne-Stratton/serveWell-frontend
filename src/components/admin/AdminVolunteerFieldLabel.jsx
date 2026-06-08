function RequiredMark() {
  return (
    <span className="admin-label-required" aria-hidden>
      {' '}
      *
    </span>
  )
}

/** Label + inline validation message so inputs do not shift when errors appear. */
export default function AdminVolunteerFieldLabel({
  htmlFor,
  children,
  error,
  errorId,
  required = false,
  reserveErrorSlot = true,
}) {
  const showSlot = reserveErrorSlot || error

  return (
    <div className="admin-label-row">
      <label className="admin-label admin-label-row__text" htmlFor={htmlFor}>
        {children}
        {required ? <RequiredMark /> : null}
      </label>
      {showSlot ? (
        <span
          className={`admin-field-error${error ? '' : ' admin-field-error--placeholder'}`}
          id={error ? errorId : undefined}
          role={error ? 'alert' : undefined}
          aria-hidden={error ? undefined : true}
        >
          {error || '\u00a0'}
        </span>
      ) : null}
    </div>
  )
}
