import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, getAdminFormDetail, getAdminForms } from '../api/client'
import AdminLayout from '../components/admin/AdminLayout'
import { volunteerNeedStatusOptions } from '../constants/enums'
import { normalizeVolunteerNeedStatus } from '../constants/recruitmentStatus'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import { adminFormsPath, demoVolunteerPath } from '../utils/organizationPaths'
import { publicVolunteerFormUrl } from '../utils/publicSiteUrl'
import softBtn from '../styles/adminSoftButtons.module.css'
import '../styles/admin.css'

const REQUIREMENT_TYPE_LABELS = {
  background_check: 'Background check',
  training: 'Training',
  availability: 'Availability',
  rehearsal: 'Rehearsal',
  audition_or_interview: 'Audition / interview',
  custom: 'Custom',
}

function volunteerNeedLabel(area) {
  const value = normalizeVolunteerNeedStatus(area)
  return (
    volunteerNeedStatusOptions.find((option) => option.value === value)?.label ??
    value
  )
}

export default function AdminFormViewPage({
  organizationSlug: organizationSlugProp,
}) {
  const { organizationSlug: organizationSlugParam, formSlug } = useParams()
  const organizationSlug = organizationSlugProp ?? organizationSlugParam
  const navigate = useNavigate()
  const formsListPath = adminFormsPath(organizationSlug)

  const [formMeta, setFormMeta] = useState(null)
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!formSlug) {
      return undefined
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')

      try {
        const listData = await getAdminForms()
        const summary = (listData.forms ?? []).find((form) => form.slug === formSlug)

        if (!summary) {
          if (!cancelled) {
            setError('Form not found.')
            setFormMeta(null)
            setSections([])
          }
          return
        }

        const data = await getAdminFormDetail(summary.id)
        if (!cancelled) {
          setFormMeta(data.form)
          setSections(data.sections ?? [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Unable to load this form.',
          )
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [formSlug])

  const isDemo =
    organizationSlug === DEMO_ORGANIZATION_SLUG || organizationSlug == null
  const publicUrl = formMeta
    ? publicVolunteerFormUrl(organizationSlug ?? DEMO_ORGANIZATION_SLUG, formMeta.slug)
    : ''
  const openFormPath = isDemo ? demoVolunteerPath() : publicUrl

  return (
    <AdminLayout>
      <p className="admin-back">
        <button
          type="button"
          className="admin-back-link"
          onClick={() => navigate(formsListPath)}
        >
          ← All forms
        </button>
      </p>

      {isDemo ? (
        <p className="admin-muted admin-form-view__demo-note">
          Demo mode: this is a read-only preview of how the form is set up. To try changes,
          sign up for your own church workspace.
        </p>
      ) : null}

      {loading ? <p className="admin-loading">Loading form…</p> : null}
      {error ? <p className="admin-error">{error}</p> : null}

      {!loading && formMeta ? (
        <div className="admin-form-view">
          <div className="admin-form-view__actions">
            <a
              className={softBtn.softBtn}
              href={openFormPath}
              target="_blank"
              rel="noreferrer"
            >
              Open volunteer form
            </a>
          </div>

          <fieldset className="admin-fieldset" disabled>
            <legend className="admin-fieldset__legend">Volunteer form page</legend>
            <dl className="admin-dl">
              <div>
                <dt>Title</dt>
                <dd>{formMeta.name}</dd>
              </div>
              <div>
                <dt>Intro text</dt>
                <dd className="admin-form-view__multiline">
                  {formMeta.introText?.trim() || '—'}
                </dd>
              </div>
              <div>
                <dt>Success message</dt>
                <dd className="admin-form-view__multiline">
                  {formMeta.successMessage?.trim() || '—'}
                </dd>
              </div>
              <div>
                <dt>Accepting submissions</dt>
                <dd>{formMeta.isActive !== false ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </fieldset>

          <fieldset className="admin-fieldset">
            <legend className="admin-fieldset__legend">Sections and serving areas</legend>
            {sections.length === 0 ? (
              <p className="admin-muted">No sections configured.</p>
            ) : (
              sections.map((section) => (
                <div key={section.id} className="admin-form-view__section">
                  <h3 className="admin-form-view__section-title">{section.title}</h3>
                  {section.servingAreas?.length ? (
                    section.servingAreas.map((area) => (
                      <article key={area.id} className="admin-form-view__area">
                        <h4 className="admin-form-view__area-name">{area.name}</h4>
                        <dl className="admin-dl admin-dl--compact">
                          <div>
                            <dt>Volunteer need</dt>
                            <dd>{volunteerNeedLabel(area)}</dd>
                          </div>
                          {area.description ? (
                            <div>
                              <dt>Description</dt>
                              <dd>{area.description}</dd>
                            </div>
                          ) : null}
                          {area.publicNote ? (
                            <div>
                              <dt>Note for volunteers</dt>
                              <dd>{area.publicNote}</dd>
                            </div>
                          ) : null}
                        </dl>
                        {(area.requirements ?? []).length > 0 ? (
                          <div className="admin-form-view__requirements">
                            <p className="admin-label">Volunteer acknowledgements</p>
                            <ul className="admin-form-view__req-list">
                              {area.requirements.map((req) => (
                                <li key={req.id}>
                                  {req.label}
                                  {req.type ? (
                                    <span className="admin-muted">
                                      {' '}
                                      (
                                      {REQUIREMENT_TYPE_LABELS[req.type] ?? req.type}
                                      {req.requiresConfirmation !== false
                                        ? '; must confirm'
                                        : ''}
                                      )
                                    </span>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                      </article>
                    ))
                  ) : (
                    <p className="admin-muted">No serving areas in this section.</p>
                  )}
                </div>
              ))
            )}
          </fieldset>
        </div>
      ) : null}
    </AdminLayout>
  )
}
