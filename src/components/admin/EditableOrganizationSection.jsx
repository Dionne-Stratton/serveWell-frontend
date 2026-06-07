import { useEffect, useState } from 'react'
import { ApiError } from '../../api/client'
import softBtn from '../../styles/adminSoftButtons.module.css'

const ORGANIZATION_TYPES = [
  { value: 'church', label: 'Church' },
  { value: 'ministry', label: 'Ministry' },
  { value: 'other', label: 'Other' },
]

const CHURCH_SLUG_LABEL = 'Church URL slug'

function labelOrgType(value) {
  const match = ORGANIZATION_TYPES.find((option) => option.value === value)
  return match?.label ?? value ?? '—'
}

function IconPencil() {
  return (
    <svg
      className="admin-profile-editable__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path
        d="M4 20h4l10.5-10.5a2.12 2.12 0 0 0-3-3L5 17v3z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ProfileRow({ label, value }) {
  return (
    <div className="admin-detail-row">
      <dt>{label}</dt>
      <dd>{value ?? '—'}</dd>
    </div>
  )
}

function ChurchSlugRow({ slug }) {
  return (
    <div className="admin-detail-row">
      <dt>{CHURCH_SLUG_LABEL}</dt>
      <dd className="admin-profile-org-slug__value">{slug ?? '—'}</dd>
    </div>
  )
}

function ReadOnlyChurchSlugInput({ slug }) {
  return (
    <div className="admin-field">
      <label className="admin-label" htmlFor="org-readonly-slug">
        {CHURCH_SLUG_LABEL}
      </label>
      <input
        id="org-readonly-slug"
        className="admin-input admin-input--readonly"
        type="text"
        readOnly
        disabled
        value={slug ?? ''}
      />
      <p className="admin-muted admin-help admin-help--nested">
        This cannot be changed.
      </p>
    </div>
  )
}

function emptyToNull(value) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

export default function EditableOrganizationSection({
  organization,
  canEdit,
  onSave,
}) {
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState({
    name: '',
    organizationType: 'church',
    contactEmail: '',
    websiteUrl: '',
  })

  useEffect(() => {
    if (!organization || editing) {
      return
    }

    setDraft({
      name: organization.name ?? '',
      organizationType: organization.organizationType ?? 'church',
      contactEmail: organization.contactEmail ?? '',
      websiteUrl: organization.websiteUrl ?? '',
    })
  }, [organization, editing])

  function startEditing() {
    if (!canEdit || !organization) {
      return
    }

    setError('')
    setDraft({
      name: organization.name ?? '',
      organizationType: organization.organizationType ?? 'church',
      contactEmail: organization.contactEmail ?? '',
      websiteUrl: organization.websiteUrl ?? '',
    })
    setEditing(true)
  }

  function cancelEditing() {
    setError('')
    setEditing(false)
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!organization) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const payload = {
        name: draft.name.trim(),
        organizationType: draft.organizationType,
        contactEmail: emptyToNull(draft.contactEmail),
        websiteUrl: emptyToNull(draft.websiteUrl),
      }

      await onSave(payload)
      setEditing(false)
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Unable to save organization details.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (!organization) {
    return null
  }

  return (
    <section className="admin-detail-section admin-profile-org-card">
      <div className="admin-profile-org-card__header">
        <h2 className="admin-detail-section__title admin-profile-org-card__title">
          Organization
        </h2>
        {canEdit && !editing ? (
          <button
            type="button"
            className="admin-profile-editable__pencil admin-profile-org-card__edit"
            aria-label="Edit organization"
            onClick={startEditing}
          >
            <IconPencil />
          </button>
        ) : null}
      </div>

      {editing ? (
        <form className="admin-profile-org-card__form" onSubmit={handleSubmit}>
          <div className="admin-field">
            <label className="admin-label" htmlFor="org-edit-name">
              Name
            </label>
            <input
              id="org-edit-name"
              className="admin-input"
              type="text"
              value={draft.name}
              disabled={saving}
              onChange={(event) =>
                setDraft((current) => ({ ...current, name: event.target.value }))
              }
              required
            />
          </div>
          <ReadOnlyChurchSlugInput slug={organization.slug} />
          <div className="admin-field">
            <label className="admin-label" htmlFor="org-edit-type">
              Type
            </label>
            <select
              id="org-edit-type"
              className="admin-input admin-input--select"
              value={draft.organizationType}
              disabled={saving}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  organizationType: event.target.value,
                }))
              }
            >
              {ORGANIZATION_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="org-edit-contact">
              Contact email
            </label>
            <input
              id="org-edit-contact"
              className="admin-input"
              type="email"
              autoComplete="email"
              value={draft.contactEmail}
              disabled={saving}
              onChange={(event) =>
                setDraft((current) => ({ ...current, contactEmail: event.target.value }))
              }
            />
          </div>
          <div className="admin-field">
            <label className="admin-label" htmlFor="org-edit-website">
              Website
            </label>
            <input
              id="org-edit-website"
              className="admin-input"
              type="url"
              value={draft.websiteUrl}
              disabled={saving}
              placeholder="https://"
              onChange={(event) =>
                setDraft((current) => ({ ...current, websiteUrl: event.target.value }))
              }
            />
          </div>
          {error ? <p className="admin-error">{error}</p> : null}
          <div className="admin-profile-org-card__actions">
            <button
              type="submit"
              className={`${softBtn.softBtn} ${softBtn.matchFieldInput}${saving ? ` ${softBtn.saveBtnBusy}` : ''}`}
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className={`${softBtn.softBtn} ${softBtn.matchFieldInput}`}
              disabled={saving}
              onClick={cancelEditing}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <dl className="admin-dl">
          <ProfileRow label="Name" value={organization.name} />
          <ChurchSlugRow slug={organization.slug} />
          <ProfileRow label="Type" value={labelOrgType(organization.organizationType)} />
          <ProfileRow label="Contact email" value={organization.contactEmail} />
          <ProfileRow label="Website" value={organization.websiteUrl} />
        </dl>
      )}
    </section>
  )
}
