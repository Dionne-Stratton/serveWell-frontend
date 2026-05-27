import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError, getPublicVolunteerForm } from '../api/client'
import { DEMO_FORM_SLUG } from '../constants/demo'
import PageShell from '../components/PageShell'
import VolunteerForm from '../components/serve/VolunteerForm'
import OrganizationNotFoundPage from './OrganizationNotFoundPage'
import '../styles/serve.css'

export default function ServePage({ organizationSlug: organizationSlugProp }) {
  const { organizationSlug: organizationSlugParam } = useParams()
  const organizationSlug = organizationSlugProp ?? organizationSlugParam

  const [servingAreas, setServingAreas] = useState(null)
  const [formMeta, setFormMeta] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (!organizationSlug) {
      return undefined
    }

    let cancelled = false

    async function load() {
      setLoadError('')
      setNotFound(false)
      setServingAreas(null)

      try {
        const data = await getPublicVolunteerForm(organizationSlug)
        if (!cancelled) {
          setServingAreas(data.servingAreas ?? [])
          setFormMeta(data.form ?? null)
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.code === 'NOT_FOUND') {
            setNotFound(true)
          } else {
            setLoadError(
              error instanceof ApiError
                ? error.message
                : 'Unable to load the volunteer form. Is the API running?',
            )
          }
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [organizationSlug])

  if (!organizationSlug) {
    return (
      <PageShell title="Volunteer interest" showHomeLink={false}>
        <p className="serve-load-error">Missing organization.</p>
      </PageShell>
    )
  }

  if (notFound) {
    return <OrganizationNotFoundPage organizationSlug={organizationSlug} />
  }

  const title = formMeta?.name ?? 'Volunteer interest'
  const formSlug = formMeta?.slug ?? DEMO_FORM_SLUG

  return (
    <div className="serve-page">
      <PageShell title={title} showHomeLink={false}>
        {loadError ? (
          <p className="serve-load-error">{loadError}</p>
        ) : servingAreas === null ? (
          <p className="serve-loading">Loading form…</p>
        ) : servingAreas.length === 0 ? (
          <p className="serve-load-error">No serving areas are available right now.</p>
        ) : (
          <VolunteerForm
            servingAreas={servingAreas}
            organizationSlug={organizationSlug}
            formSlug={formSlug}
          />
        )}
      </PageShell>
    </div>
  )
}
