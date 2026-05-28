import { Link } from "react-router-dom";

export default function PageShell({
  title,
  children,
  showHomeLink = false,
  backLink = null,
  className = "",
}) {
  const shellClass = className ? `page-shell ${className}` : "page-shell";

  return (
    <div className={shellClass}>
      {backLink ? (
        <p className="page-shell__back">
          <Link to={backLink.to}>{backLink.label}</Link>
        </p>
      ) : showHomeLink ? (
        <p className="page-shell__back">
          <Link to="/">ServeWell home</Link>
        </p>
      ) : null}
      <header className="page-shell__header">
        {/* <p className="page-shell__brand">ServeWell</p> */}
        {title ? <h1 className="page-shell__title">{title}</h1> : null}
      </header>
      <main className="page-shell__main">{children}</main>
    </div>
  );
}
