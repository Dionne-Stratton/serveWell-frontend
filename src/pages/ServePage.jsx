import { useEffect, useState } from 'react'
import { ApiError, fetchServingAreas } from '../api/client'
import PageShell from '../components/PageShell'
import VolunteerForm from '../components/serve/VolunteerForm'
import '../styles/serve.css'

export default function ServePage() {
  const [servingAreas, setServingAreas] = useState(null)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const data = await fetchServingAreas()
        if (!cancelled) {
          setServingAreas(data.servingAreas ?? [])
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(
            error instanceof ApiError
              ? error.message
              : 'Unable to load serving areas. Is the API running on localhost:8787?'
          )
        }
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="serve-page">
      <PageShell title="Volunteer interest" showHomeLink={false}>
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
