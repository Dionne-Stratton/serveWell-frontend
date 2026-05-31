import { Link } from "react-router-dom";

function ShellHomeLink({ to, label }) {
  return (
    <Link to={to} className="page-shell__home-link">
      <img src="/logo.png" alt="" className="page-shell__home-logo" width={28} height={28} />
      <span>{label}</span>
    </Link>
  );
}

function isHomeTarget(to) {
  return to === "/";
}

export default function PageShell({
  title,
  titleLogo = false,
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
                {isHomeTarget(backLink.to) ? (
                  <ShellHomeLink to={backLink.to} label={backLink.label} />
                ) : (
                  <Link to={backLink.to}>{backLink.label}</Link>
                )}
              </p>
            ) : showHomeLink ? (
              <p className="page-shell__back">
                <ShellHomeLink to="/" label="ServeWell home" />
              </p>
            ) : null}
          </div>
          {headerEnd ? (
            <div className="page-shell__top-end">{headerEnd}</div>
          ) : null}
        </div>
      ) : null}
      <header className="page-shell__header">
        {title ? (
          titleLogo ? (
            <div className="page-shell__title-row">
              <img
                src="/logo.png"
                alt=""
                className="page-shell__title-logo"
                width={40}
                height={40}
              />
              <h1 className="page-shell__title">{title}</h1>
            </div>
          ) : (
            <h1 className="page-shell__title">{title}</h1>
          )
        ) : null}
      </header>
      <main className="page-shell__main">{children}</main>
    </div>
  );
}
