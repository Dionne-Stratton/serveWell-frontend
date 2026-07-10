import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import {
  ApiError,
  getVolunteerSubmissionEditPreview,
  saveVolunteerSubmissionEdit,
} from '../api/client'
import PageShell from '../components/PageShell'
import VolunteerForm from '../components/serve/VolunteerForm'
import {
  collectOpenServingAreaIds,
  filterSectionsForVolunteerIntake,
  restrictFormStateToOpenAreas,
  submissionDetailToFormState,
} from '../components/serve/volunteerFormUtils'
import '../styles/serve.css'

export default function VolunteerUpdatePage() {
  const { organizationSlug } = useParams()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const hasValidParams = Boolean(organizationSlug && token)

  const [sections, setSections] = useState(null)
  const [initialFormState, setInitialFormState] = useState(null)
  const [formMeta, setFormMeta] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [invalidToken, setInvalidToken] = useState(!hasValidParams)
  const [loading, setLoading] = useState(hasValidParams)
  const [prevParamsKey, setPrevParamsKey] = useState(
    () => `${organizationSlug ?? ''}:${token}`,
  )

  const paramsKey = `${organizationSlug ?? ''}:${token}`
  if (paramsKey !== prevParamsKey) {
    setPrevParamsKey(paramsKey)
    if (!hasValidParams) {
      setLoading(false)
      setInvalidToken(true)
      setLoadError('')
      setSections(null)
      setInitialFormState(null)
      setFormMeta(null)
    } else {
      setLoading(true)
      setInvalidToken(false)
      setLoadError('')
    }
  }

  const intakeSections = useMemo(
    () => (sections ? filterSectionsForVolunteerIntake(sections) : []),
    [sections],
  )

  const flatServingAreas = useMemo(
    () => intakeSections.flatMap((section) => section.servingAreas ?? []),
    [intakeSections],
  )

  useEffect(() => {
    if (!hasValidParams) {
      return undefined
    }

    let cancelled = false

    ;(async () => {
      try {
        const data = await getVolunteerSubmissionEditPreview(token)
        if (cancelled) {
          return
        }

        if (data.organizationSlug !== organizationSlug) {
          setInvalidToken(true)
          return
        }

        const filtered = filterSectionsForVolunteerIntake(data.sections ?? [])
        const openIds = collectOpenServingAreaIds(filtered)
        const formState = restrictFormStateToOpenAreas(
          submissionDetailToFormState(data.submission),
          openIds,
        )

        setSections(filtered)
        setFormMeta(data.form ?? null)
        setInitialFormState(formState)
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.code === 'INVALID_EDIT_TOKEN') {
            setInvalidToken(true)
          } else {
            setLoadError(
              err instanceof ApiError
                ? err.message
                : 'Unable to load your submission. Is the API running?',
            )
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [hasValidParams, organizationSlug, token])

  if (!organizationSlug) {
    return (
      <PageShell title="Update submission" showHomeLink={false}>
        <p className="serve-load-error">Missing organization.</p>
      </PageShell>
    )
  }

  if (invalidToken) {
    return (
      <PageShell title="Update link" showHomeLink={false}>
        <p className="serve-load-error">
          This update link is invalid or has expired. Go back to the volunteer form and use
          &ldquo;Already submitted?&rdquo; to request a new link.
        </p>
      </PageShell>
    )
  }

  if (loading) {
    return (
      <PageShell title="Update submission" showHomeLink={false}>
        <p className="serve-loading">Loading your submission…</p>
      </PageShell>
    )
  }

  if (loadError || !initialFormState || !flatServingAreas.length) {
    return (
      <PageShell title="Update submission" showHomeLink={false}>
        <p className="serve-load-error">
          {loadError || 'Unable to load this submission for editing.'}
        </p>
      </PageShell>
    )
  }

  const title = formMeta?.name ? `Update — ${formMeta.name}` : 'Update your submission'
  const formSlug = formMeta?.slug

  return (
    <div className="serve-page">
      <PageShell title={title}>
        <VolunteerForm
          servingAreas={flatServingAreas}
          sections={intakeSections}
          organizationSlug={organizationSlug}
          formSlug={formSlug}
          introText={formMeta?.introText}
          initialFormState={initialFormState}
          volunteerSelfEdit
          onVolunteerSelfSave={(payload) => saveVolunteerSubmissionEdit(token, payload)}
          submitButtonLabel="Save changes"
          saveSuccessContent={
            <p className="serve-success__message">
              Your submission was updated. Someone from the church may follow up after reviewing
              your changes.
            </p>
          }
        />
      </PageShell>
    </div>
  )
}
