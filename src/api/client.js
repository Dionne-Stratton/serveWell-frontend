import { getActiveAdminToken } from "../auth/apiAuthScope";
import { notifyAdminSessionExpired } from "../auth/adminSessionExpiry";

const defaultBaseUrl = "https://servewell-server.dionnestratton.workers.dev";

export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL ?? defaultBaseUrl;
  return url.replace(/\/$/, "");
}

export class ApiError extends Error {
  constructor(message, code, fields = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    Object.assign(this, fields);
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

    if (
      options.authenticated &&
      (response.status === 401 || code === "UNAUTHORIZED")
    ) {
      notifyAdminSessionExpired();
      throw new ApiError("Session expired.", "SESSION_EXPIRED");
    }

    const { message: _m, code: _c, ...errorFields } = body.error ?? {};
    throw new ApiError(message, code, errorFields);
  }

  return body.data;
}

export async function apiFormRequest(path, formData, options = {}) {
  const headers = { ...(options.headers ?? {}) };

  if (options.authenticated) {
    const token = getActiveAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? "POST",
    body: formData,
    headers,
  });

  const body = await parseJsonResponse(response);

  if (!body.success) {
    const message = body.error?.message ?? "Something went wrong.";
    const code = body.error?.code;

    if (
      options.authenticated &&
      (response.status === 401 || code === "UNAUTHORIZED")
    ) {
      notifyAdminSessionExpired();
      throw new ApiError("Session expired.", "SESSION_EXPIRED");
    }

    const { message: _m, code: _c, ...errorFields } = body.error ?? {};
    throw new ApiError(message, code, errorFields);
  }

  return body.data;
}

function filenameFromContentDisposition(header) {
  if (!header) {
    return null;
  }

  const star = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (star?.[1]) {
    try {
      return decodeURIComponent(star[1].trim());
    } catch {
      return star[1].trim();
    }
  }

  const plain = header.match(/filename="([^"]+)"/i);
  return plain?.[1]?.trim() ?? null;
}

export async function downloadAdminGeneratedOccurrenceResource(
  generatedScheduleId,
  occurrenceId,
  resourceId,
  fallbackFilename,
) {
  const headers = {};
  const token = getActiveAdminToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(
    `${getApiBaseUrl()}/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/resources/${resourceId}/download`,
    { headers },
  );

  if (!response.ok) {
    try {
      const body = await response.json();
      const message = body.error?.message ?? "Unable to download file.";
      throw new ApiError(message, body.error?.code);
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      throw new ApiError("Unable to download file.", "DOWNLOAD_FAILED");
    }
  }

  const blob = await response.blob();
  const filename =
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    fallbackFilename ??
    "download";

  return { blob, filename };
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

export function requestVolunteerSubmissionUpdateLink(organizationSlug, formSlug, email) {
  const path = formSlug
    ? `/api/organizations/${encodeURIComponent(organizationSlug)}/forms/${encodeURIComponent(formSlug)}/submission-update-request`
    : `/api/organizations/${encodeURIComponent(organizationSlug)}/volunteer-submission-update-request`;

  return apiRequest(path, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function getVolunteerSubmissionEditPreview(token) {
  const params = new URLSearchParams({ token });
  return apiRequest(`/api/public/volunteer-submission-edit?${params.toString()}`);
}

export function saveVolunteerSubmissionEdit(token, payload) {
  return apiRequest("/api/public/volunteer-submission-edit", {
    method: "PUT",
    body: JSON.stringify({ token, ...payload }),
  });
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

export function patchAdminMe(payload) {
  return apiRequest("/api/admin/me", {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function patchAdminNotificationPreferences(notificationPreferences) {
  return patchAdminMe({ notificationPreferences });
}

export function patchAdminOrganization(payload) {
  return apiRequest("/api/admin/organization", {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminOrganization(confirmSlug) {
  return apiRequest("/api/admin/organization", {
    method: "DELETE",
    authenticated: true,
    body: JSON.stringify({ confirmSlug }),
  });
}

export function requestPasswordReset(organizationSlug, email) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ organizationSlug, email }),
  });
}

export function requestChurchSlugHint(email) {
  return apiRequest("/api/auth/church-slug-hint", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function previewAdminInvite(token) {
  const params = new URLSearchParams({ token });
  return apiRequest(`/api/auth/accept-invite?${params.toString()}`);
}

export function acceptAdminInvite(token, newPassword, confirmPassword) {
  return apiRequest("/api/auth/accept-invite", {
    method: "POST",
    body: JSON.stringify({ token, newPassword, confirmPassword }),
  });
}

export function getAdminTeam() {
  return apiRequest("/api/admin/team", { authenticated: true });
}

export function inviteAdminTeamMember(email) {
  return apiRequest("/api/admin/team/invites", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify({ email }),
  });
}

export function revokeAdminTeamInvite(inviteId) {
  return apiRequest(`/api/admin/team/invites/${inviteId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function removeAdminTeamMember(adminUserId) {
  return apiRequest(`/api/admin/team/members/${adminUserId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function resetPasswordWithToken(token, newPassword) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function requestPasswordResetFromProfile() {
  return apiRequest("/api/admin/request-password-reset", {
    method: "POST",
    authenticated: true,
  });
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
  if (filters.planningCenterImportTabName)
    params.set("planningCenterImportTabName", filters.planningCenterImportTabName);
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

export function putAdminSubmission(submissionId, payload) {
  return apiRequest(`/api/admin/submissions/${submissionId}`, {
    method: "PUT",
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

export function markVolunteerUpdateReviewed(submissionId) {
  return apiRequest(
    `/api/admin/submissions/${submissionId}/mark-volunteer-update-reviewed`,
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({}),
    },
  );
}

export function pushAdminSubmissionToPlanningCenter(submissionId) {
  return apiRequest(
    `/api/admin/submissions/${submissionId}/planning-center`,
    {
      method: "POST",
      authenticated: true,
    },
  );
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

export function searchPlanningCenterPeople(search) {
  const params = new URLSearchParams();
  if (search?.trim()) {
    params.set("search", search.trim());
  }
  const query = params.toString();
  const path = query
    ? `/api/admin/integrations/planning-center/people?${query}`
    : "/api/admin/integrations/planning-center/people";
  return apiRequest(path, { authenticated: true });
}

export function getPlanningCenterPeopleTabs() {
  return apiRequest("/api/admin/integrations/planning-center/tabs", {
    authenticated: true,
  });
}

export function getPlanningCenterImportSources() {
  return apiRequest("/api/admin/integrations/planning-center/import-sources", {
    authenticated: true,
  });
}

export function previewPlanningCenterImport(payload) {
  return apiRequest("/api/admin/integrations/planning-center/import/preview", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function importPlanningCenterPerson(payload) {
  return apiRequest("/api/admin/integrations/planning-center/import", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
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

export function getAdminSchedules() {
  return apiRequest("/api/admin/schedules", { authenticated: true });
}

export function getAdminScheduleServingAreaOptions() {
  return apiRequest("/api/admin/schedules/serving-area-options", {
    authenticated: true,
  });
}

export function createAdminSchedule(payload) {
  return apiRequest("/api/admin/schedules", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function getAdminSchedule(scheduleId) {
  return apiRequest(`/api/admin/schedules/${scheduleId}`, {
    authenticated: true,
  });
}

export function patchAdminSchedule(scheduleId, payload) {
  return apiRequest(`/api/admin/schedules/${scheduleId}`, {
    method: "PATCH",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function putAdminScheduleServingAreas(scheduleId, payload) {
  return apiRequest(`/api/admin/schedules/${scheduleId}/serving-areas`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function putAdminScheduleRhythms(scheduleId, payload) {
  return apiRequest(`/api/admin/schedules/${scheduleId}/rhythms`, {
    method: "PUT",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function deleteAdminSchedule(scheduleId) {
  return apiRequest(`/api/admin/schedules/${scheduleId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function getAdminGeneratedSchedules() {
  return apiRequest("/api/admin/generated-schedules", { authenticated: true });
}

export function getAdminGeneratedSchedule(generatedScheduleId) {
  return apiRequest(`/api/admin/generated-schedules/${generatedScheduleId}`, {
    authenticated: true,
  });
}

export function deleteAdminGeneratedSchedule(generatedScheduleId) {
  return apiRequest(`/api/admin/generated-schedules/${generatedScheduleId}`, {
    method: "DELETE",
    authenticated: true,
  });
}

export function publishAdminGeneratedSchedule(generatedScheduleId) {
  return apiRequest(`/api/admin/generated-schedules/${generatedScheduleId}/publish`, {
    method: "POST",
    authenticated: true,
  });
}

export function createAdminGeneratedSchedule(payload) {
  return apiRequest("/api/admin/generated-schedules", {
    method: "POST",
    authenticated: true,
    body: JSON.stringify(payload),
  });
}

export function getAdminGeneratedScheduleOccurrence(generatedScheduleId, occurrenceId) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}`,
    { authenticated: true },
  );
}

export function patchAdminGeneratedScheduleOccurrenceStaffing(
  generatedScheduleId,
  occurrenceId,
  payload,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function createAdminGeneratedOccurrenceNote(generatedScheduleId, occurrenceId, payload) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/notes`,
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function patchAdminGeneratedOccurrenceNote(
  generatedScheduleId,
  occurrenceId,
  noteId,
  payload,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/notes/${noteId}`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminGeneratedOccurrenceNote(generatedScheduleId, occurrenceId, noteId) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/notes/${noteId}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}

export function uploadAdminGeneratedOccurrenceResource(
  generatedScheduleId,
  occurrenceId,
  formData,
) {
  return apiFormRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/resources`,
    formData,
    { authenticated: true, method: "POST" },
  );
}

export function patchAdminGeneratedOccurrenceResource(
  generatedScheduleId,
  occurrenceId,
  resourceId,
  payload,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/resources/${resourceId}`,
    {
      method: "PATCH",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminGeneratedOccurrenceResource(
  generatedScheduleId,
  occurrenceId,
  resourceId,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/resources/${resourceId}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}

export function getAdminGeneratedOccurrenceEligibleVolunteers(
  generatedScheduleId,
  occurrenceId,
  requirementId,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/requirements/${requirementId}/eligible-volunteers`,
    { authenticated: true },
  );
}

export function createAdminGeneratedOccurrenceAssignment(
  generatedScheduleId,
  occurrenceId,
  payload,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/assignments`,
    {
      method: "POST",
      authenticated: true,
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminGeneratedOccurrenceAssignment(
  generatedScheduleId,
  occurrenceId,
  assignmentId,
) {
  return apiRequest(
    `/api/admin/generated-schedules/${generatedScheduleId}/occurrences/${occurrenceId}/assignments/${assignmentId}`,
    {
      method: "DELETE",
      authenticated: true,
    },
  );
}
