const defaultPublicSiteOrigin = "https://servewell.app";

export function getPublicSiteOrigin() {
  const configured = import.meta.env.VITE_PUBLIC_SITE_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  return defaultPublicSiteOrigin;
}

export function publicVolunteerFormUrl(organizationSlug, formSlug) {
  const origin = getPublicSiteOrigin();
  return `${origin}/${encodeURIComponent(organizationSlug)}/forms/${encodeURIComponent(formSlug)}`;
}
