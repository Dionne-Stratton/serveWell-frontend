import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, getPublicVolunteerForm } from '../api/client'
import PageShell from '../components/PageShell'
import {
  organizationAdminLoginPath,
  organizationVolunteerPath,
} from '../utils/organizationPaths'
import OrganizationNotFoundPage from './OrganizationNotFoundPage'

export default function OrganizationLandingPage() {
  const { organizationSlug } = useParams()
  const [organization, setOrganization] = useState(null)
  const [notFound, setNotFound] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoadError('')
      setNotFound(false)

      try {
        const data = await getPublicVolunteerForm(organizationSlug)
        if (!cancelled) {
          setOrganization(data.organization ?? null)
        }
      } catch (error) {
        if (!cancelled) {
          if (error instanceof ApiError && error.code === 'NOT_FOUND') {
            setNotFound(true)
          } else {
            setLoadError(
              error instanceof ApiError
                ? error.message
                : 'Unable to load this organization.',
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

  if (notFound) {
    return <OrganizationNotFoundPage organizationSlug={organizationSlug} />
  }

  if (loadError) {
    return (
      <PageShell title="Organization" showHomeLink>
        <p className="serve-load-error">{loadError}</p>
      </PageShell>
    )
  }

  if (!organization) {
    return (
      <PageShell title="Organization" showHomeLink>
        <p className="serve-loading">Loading…</p>
      </PageShell>
    )
  }

  return (
    <PageShell title={organization.name} showHomeLink>
      <p className="lede">Volunteer intake for {organization.name}</p>
      <div className="action-cards">
        <section className="action-card">
          <h2>Volunteer form</h2>
          <p>Share your interest in serving with this church or ministry.</p>
          <Link
            className="button button--secondary"
            to={organizationVolunteerPath(organizationSlug)}
          >
            Open volunteer form
          </Link>
        </section>
        <section className="action-card">
          <h2>Admin</h2>
          <p>Staff sign-in to review volunteer submissions.</p>
          <Link
            className="button button--secondary"
            to={organizationAdminLoginPath(organizationSlug)}
          >
            Admin login
          </Link>
        </section>
      </div>
    </PageShell>
  )
}
