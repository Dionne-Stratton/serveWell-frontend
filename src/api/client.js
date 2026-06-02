import { getActiveAdminToken } from "../auth/apiAuthScope";

const defaultBaseUrl = "https://servewell-server.dionnestratton.workers.dev";

export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL ?? defaultBaseUrl;
  return url.replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    throw new ApiError(
      "The server returned an invalid response.",
      "INVALID_RESPONSE",
    );
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  if (options.authenticated) {
    const token = getActiveAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...options,
    headers,
  });

  const body = await parseJsonResponse(response);

  if (!body.success) {
    const message = body.error?.message ?? "Something went wrong.";
    const code = body.error?.code;
    throw new ApiError(message, code);
  }

  return body.data;
}

export function getPublicVolunteerForm(organizationSlug) {
  return apiRequest(
    `/api/organizations/${encodeURIComponent(organizationSlug)}/volunteer-form`,
  );
}

export function getPublicFormBySlug(organizationSlug, formSlug) {
  return apiRequest(
    `/api/organizations/${encodeURIComponent(organizationSlug)}/forms/${encodeURIComponent(formSlug)}`,
  );
}

export function submitVolunteerForm(organizationSlug, formSlug, payload) {
  return apiRequest(
    `/api/organizations/${encodeURIComponent(organizationSlug)}/forms/${encodeURIComponent(formSlug)}/submissions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function adminLogin(credentials) {
  return apiRequest("/api/admin/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function registerOrganization(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getCurrentAdmin() {
  return apiRequest("/api/admin/me", { authenticated: true });
}

export function getAdminSubmissions(filters = {}) {
  const params = new URLSearchParams();

  if (filters.formId) params.set("formId", String(filters.formId));
  if (filters.status) params.set("status", filters.status);
  if (filters.archived === true) params.set("archived", "true");
  if (filters.archived === false) params.set("archived", "false");
  if (filters.servingAreaId)
    params.set("servingAreaId", String(filters.servingAreaId));
  if (filters.formSectionId)
    params.set("formSectionId", String(filters.formSectionId));
  if (filters.search) params.set("search", filters.search);

  const query = params.toString();
  const path = query
    ? `/api/admin/submissions?${query}`
    : "/api/admin/submissions";

  return apiRequest(path, { authenticated: true });
}

export function getAdminSubmissionDetail(submissionId) {
  return apiRequest(`/api/admin/submissions/${submissionId}`, {
    authenticated: true,
  });
}

export function updateAdminSubmission(submissionId, payload) {
  return apiRequest(`/api/admin/submissions/${submissionId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminSubmission(submissionId) {
  return apiRequest(`/api/admin/submissions/${submissionId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function createAdminSubmissionNote(submissionId, note) {
  return apiRequest(`/api/admin/submissions/${submissionId}/notes`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ note }),
  });
}

export function deleteAdminNote(noteId) {
  return apiRequest(`/api/admin/notes/${noteId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function getAdminForms() {
  return apiRequest("/api/admin/forms", { authenticated: true });
}

export function getPlanningCenterIntegration() {
  return apiRequest("/api/admin/integrations/planning-center", {
    authenticated: true,
  });
}

export function connectPlanningCenterIntegration() {
  return apiRequest("/api/admin/integrations/planning-center/connect", {
    method: "POST",
    authenticated: true,
  });
}

export function disconnectPlanningCenterIntegration() {
  return apiRequest("/api/admin/integrations/planning-center/disconnect", {
    method: "POST",
    authenticated: true,
  });
}

export function createAdminForm(payload) {
  return apiRequest("/api/admin/forms", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function patchAdminForm(formId, payload) {
  return apiRequest(`/api/admin/forms/${formId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function getAdminFormDetail(formId) {
  return apiRequest(`/api/admin/forms/${formId}`, {
    authenticated: true,
  });
}

export function deleteAdminForm(formId) {
  return apiRequest(`/api/admin/forms/${formId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function createAdminFormSection(formId, payload) {
  return apiRequest(`/api/admin/forms/${formId}/sections`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function patchAdminFormSection(sectionId, payload) {
  return apiRequest(`/api/admin/form-sections/${sectionId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminFormSection(sectionId) {
  return apiRequest(`/api/admin/form-sections/${sectionId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function createAdminServingArea(formId, payload) {
  return apiRequest(`/api/admin/forms/${formId}/serving-areas`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function patchAdminServingArea(servingAreaId, payload) {
  return apiRequest(`/api/admin/serving-areas/${servingAreaId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminServingArea(servingAreaId) {
  return apiRequest(`/api/admin/serving-areas/${servingAreaId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function createAdminRequirement(servingAreaId, payload) {
  return apiRequest(`/api/admin/serving-areas/${servingAreaId}/requirements`, {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function patchAdminRequirement(requirementId, payload) {
  return apiRequest(`/api/admin/requirements/${requirementId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminRequirement(requirementId) {
  return apiRequest(`/api/admin/requirements/${requirementId}`, {
    method: "DELETE",
    authenticated: true,
  });
}
