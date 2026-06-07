import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAdminAuth } from '../auth/useAdminAuth'
import {
  ApiError,
  getAdminFormDetail,
  getAdminSubmissionDetail,
  putAdminSubmission,
} from '../api/client'
import AdminVolunteerSubmissionEditForm, {
  ADMIN_VOLUNTEER_EDIT_FORM_ID,
} from '../components/admin/AdminVolunteerSubmissionEditForm'
import {
  collectOpenServingAreaIds,
  filterSectionsForVolunteerIntake,
  restrictFormStateToOpenAreas,
  submissionDetailToFormState,
} from '../components/serve/volunteerFormUtils'
import AdminLayout from '../components/admin/AdminLayout'
import {
  adminVolunteerDetailPath,
  resolveAdminOrganizationSlug,
} from '../utils/organizationPaths'
import softBtn from '../styles/adminSoftButtons.module.css'

export default function AdminSubmissionEditPage() {
  const { id, organizationSlug: organizationSlugParam } = useParams()
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { organization } = useAdminAuth()
  const organizationSlug = resolveAdminOrganizationSlug(
    pathname,
    organizationSlugParam,
    organization?.slug,
  )
  const detailPath = adminVolunteerDetailPath(organizationSlug, id)

  const [sections, setSections] = useState(null)
  const [initialFormState, setInitialFormState] = useState(null)
  const [volunteerName, setVolunteerName] = useState('')
  const [volunteerEmail, setVolunteerEmail] = useState('')
  const [loadError, setLoadError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hadLinkedPlanningCenter, setHadLinkedPlanningCenter] = useState(false)

  const intakeSections = useMemo(
    () => (sections ? filterSectionsForVolunteerIntake(sections) : []),
    [sections],
  )

  const flatServingAreas = useMemo(
    () => intakeSections.flatMap((section) => section.servingAreas ?? []),
    [intakeSections],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError('')

    try {
      const detail = await getAdminSubmissionDetail(id)
      const formData = await getAdminFormDetail(detail.submission.formId)
      const filtered = filterSectionsForVolunteerIntake(formData.sections ?? [])
      const openIds = collectOpenServingAreaIds(filtered)
      const formState = restrictFormStateToOpenAreas(
        submissionDetailToFormState(detail),
        openIds,
      )

      setSections(filtered)
      setInitialFormState(formState)
      setVolunteerName(`${detail.submission.firstName} ${detail.submission.lastName}`.trim())
      setVolunteerEmail(detail.submission.email?.trim() ?? '')
      setHadLinkedPlanningCenter(Boolean(detail.submission.planningCenterPersonId?.trim()))
    } catch (err) {
      setSections(null)
      setInitialFormState(null)
      setLoadError(
        err instanceof ApiError ? err.message : 'Unable to load this submission for editing.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  async function handleSave(payload) {
    await putAdminSubmission(id, payload)
    navigate(detailPath, {
      replace: true,
      state: {
        submissionSaved: true,
        planningCenterStale: hadLinkedPlanningCenter,
      },
    })
  }

  const actionButtons = (
    <>
      <button
        type="submit"
        form={ADMIN_VOLUNTEER_EDIT_FORM_ID}
        className={`${softBtn.saveBtn} admin-edit-actions__save${saving ? ` ${softBtn.saveBtnBusy}` : ''}`}
        disabled={saving || loading || !initialFormState}
      >
        {saving ? 'Saving…' : 'Save changes'}
      </button>
      <Link
        to={detailPath}
        className={`${softBtn.softBtn} admin-edit-actions__cancel`}
      >
        Back to detail
      </Link>
    </>
  )

  return (
    <AdminLayout title={volunteerName ? `Edit — ${volunteerName}` : 'Edit submission'}>
      {loading ? <p className="admin-loading">Loading submission…</p> : null}
      {loadError ? <p className="admin-error">{loadError}</p> : null}

      {initialFormState && sections ? (
        <>
          <section className="admin-detail-section admin-edit-summary">
            <p className="admin-edit-summary__eyebrow">Editing submission</p>
            <p className="admin-edit-summary__name">{volunteerName || 'Volunteer'}</p>
            {volunteerEmail ? (
              <p className="admin-edit-summary__email">{volunteerEmail}</p>
            ) : (
              <p className="admin-muted admin-edit-summary__email">No email on file</p>
            )}
            <p className="admin-muted admin-edit-summary__note">
              Changes update ServeWell only. Use <strong>Sync to Planning Center</strong> from the
              volunteer detail page afterward.
            </p>
            <div className="admin-edit-summary__actions">{actionButtons}</div>
          </section>

          <AdminVolunteerSubmissionEditForm
            sections={intakeSections}
            servingAreas={flatServingAreas}
            initialFormState={initialFormState}
            onSave={handleSave}
            onBusyChange={setSaving}
          />

          <div className="admin-edit-sticky-bar" aria-label="Edit actions">
            {actionButtons}
          </div>
        </>
      ) : null}
    </AdminLayout>
  )
}
