import { Link } from "react-router-dom";

export default function PageShell({
  title,
  children,
  showHomeLink = false,
  backLink = null,
  headerEnd = null,
  className = "",
}) {
  const shellClass = className ? `page-shell ${className}` : "page-shell";
  const hasTopRow = Boolean(backLink || showHomeLink || headerEnd);

  return (
    <div className={shellClass}>
      {hasTopRow ? (
        <div className="page-shell__top">
          <div className="page-shell__top-start">
            {backLink ? (
              <p className="page-shell__back">
                <Link to={backLink.to}>{backLink.label}</Link>
              </p>
            ) : showHomeLink ? (
              <p className="page-shell__back">
                <Link to="/">ServeWell home</Link>
              </p>
            ) : null}
          </div>
          {headerEnd ? (
            <div className="page-shell__top-end">{headerEnd}</div>
          ) : null}
        </div>
      ) : null}
      <header className="page-shell__header">
        {/* <p className="page-shell__brand">ServeWell</p> */}
        {title ? <h1 className="page-shell__title">{title}</h1> : null}
      </header>
      <main className="page-shell__main">{children}</main>
    </div>
  );
}
