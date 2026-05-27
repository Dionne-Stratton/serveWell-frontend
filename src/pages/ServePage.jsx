import { useEffect, useState } from 'react'
import { ApiError, getPublicVolunteerForm } from '../api/client'
import { DEMO_ORGANIZATION_SLUG } from '../constants/demo'
import PageShell from '../components/PageShell'
import VolunteerForm from '../components/serve/VolunteerForm'
import '../styles/serve.css'

export default function ServePage() {
  const [servingAreas, setServingAreas] = useState(null)
  const [formMeta, setFormMeta] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await getPublicVolunteerForm(DEMO_ORGANIZATION_SLUG)
        if (!cancelled) {
          setServingAreas(data.servingAreas ?? [])
          setFormMeta(data.form ?? null)
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message
              : 'Unable to load the volunteer form. Is the API running?',
          )
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  const title = formMeta?.name ?? 'Volunteer interest'

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
          <VolunteerForm servingAreas={servingAreas} />
        )}
      </PageShell>
    </div>
  )
}
