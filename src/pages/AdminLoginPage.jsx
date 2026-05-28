import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { adminDashboardPath } from "../utils/organizationPaths";
import { ApiError } from "../api/client";
import { useAdminAuth } from "../auth/useAdminAuth";
import PageShell from "../components/PageShell";
import "../styles/admin.css";

export default function AdminLoginPage({ organizationSlug: organizationSlugProp }) {
  const { organizationSlug: organizationSlugParam } = useParams();
  const organizationSlug = organizationSlugProp ?? organizationSlugParam;
  const { admin, loading, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const redirectTo =
    location.state?.from ??
    adminDashboardPath(organizationSlug);

  useEffect(() => {
    if (!loading && admin) {
      navigate(redirectTo, { replace: true });
    }
  }, [admin, loading, navigate, redirectTo]);

  if (loading) {
    return (
      <PageShell title="Admin login" showHomeLink={false}>
        <p className="admin-loading">Checking your session…</p>
      </PageShell>
    );
  }

  if (admin) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell title="Admin login" showHomeLink>
      <form className="admin-login-form" onSubmit={handleSubmit}>
        <p className="lede">
          Staff sign-in for reviewing volunteer submissions.
        </p>
        <div className="admin-field">
          <label className="admin-label" htmlFor="admin-email">
            Email
          </label>
          <input
            id="admin-email"
            className="admin-input"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        <div className="admin-field">
          <label className="admin-label" htmlFor="admin-password">
            Password
          </label>
          <input
            id="admin-password"
            className="admin-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </div>
        {error ? <p className="admin-error">{error}</p> : null}
        <button type="submit" className="admin-button" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </PageShell>
  );
}
