import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ApiError,
  deleteAdminGeneratedOccurrenceResource,
  downloadAdminGeneratedOccurrenceResource,
  patchAdminGeneratedOccurrenceResource,
  uploadAdminGeneratedOccurrenceResource,
} from '../../api/client'
import { resolveOccurrenceItemScope } from './occurrenceScope'

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 1) {
    return '—'
  }

  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function resourceLabel(resource) {
  return resource.displayName?.trim() || resource.originalFilename
}

function groupResources(resources) {
  const general = []
  const byAreaId = new Map()

  for (const resource of resources ?? []) {
    if (!resource.scheduleServingAreaId) {
      general.push(resource)
      continue
    }

    const key = resource.scheduleServingAreaId
    const list = byAreaId.get(key) ?? []
    list.push(resource)
    byAreaId.set(key, list)
  }

  const areaGroups = [...byAreaId.entries()].map(([areaId, areaResources]) => ({
    areaId,
    label: areaResources[0]?.servingAreaDisplayName ?? `Area ${areaId}`,
    resources: areaResources,
  }))

  return { general, areaGroups }
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function ResourceMetadataFields({
  idPrefix,
  displayName,
  areaId,
  areaOptions,
  onDisplayNameChange,
  onAreaIdChange,
  showServingAreaPicker,
}) {
  return (
    <div className="admin-generated-occurrence-resources__editor-fields">
      <div className="admin-field">
        <label className="admin-label" htmlFor={`${idPrefix}-display`}>
          Display name (optional)
        </label>
        <input
          id={`${idPrefix}-display`}
          type="text"
          className="admin-input"
          value={displayName}
          placeholder="Shown in the list and download"
          onChange={(event) => onDisplayNameChange(event.target.value)}
        />
      </div>
      {showServingAreaPicker ? (
        <div className="admin-field">
          <label className="admin-label" htmlFor={`${idPrefix}-area`}>
            Serving area (optional)
          </label>
          <select
            id={`${idPrefix}-area`}
            className="admin-input admin-input--select"
            value={areaId}
            onChange={(event) => onAreaIdChange(event.target.value)}
            disabled={areaOptions.length === 0}
          >
            <option value="">General event resource</option>
            {areaOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.displayName}
              </option>
            ))}
          </select>
          <p className="admin-help">
            General resources apply to the whole event. Area-specific resources only apply to that
            team’s staffing on this event.
          </p>
        </div>
      ) : null}
    </div>
  )
}

function ResourceRow({
  resource,
  areaOptions,
  generatedScheduleId,
  occurrenceId,
  onOccurrenceUpdated,
  onError,
  highlight,
  showServingAreaPicker,
  fixedScheduleServingAreaId,
}) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState(resource.displayName ?? '')
  const [areaId, setAreaId] = useState(
    resource.scheduleServingAreaId ? String(resource.scheduleServingAreaId) : '',
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  function resolveScheduleServingAreaIdForSave() {
    if (fixedScheduleServingAreaId !== undefined) {
      return fixedScheduleServingAreaId
    }

    return areaId ? Number(areaId) : null
  }

  async function handleDownload() {
    setDownloading(true)
    onError('')

    try {
      const { blob, filename } = await downloadAdminGeneratedOccurrenceResource(
        generatedScheduleId,
        occurrenceId,
        resource.id,
        resourceLabel(resource),
      )
      triggerBrowserDownload(blob, filename)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to download resource.')
    } finally {
      setDownloading(false)
    }
  }

  async function saveEdit() {
    setSaving(true)
    onError('')

    try {
      const data = await patchAdminGeneratedOccurrenceResource(
        generatedScheduleId,
        occurrenceId,
        resource.id,
        {
          displayName: displayName.trim() ? displayName.trim() : null,
          scheduleServingAreaId: resolveScheduleServingAreaIdForSave(),
        },
      )
      onOccurrenceUpdated(data.occurrence ?? null)
      setEditing(false)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to update resource.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    onError('')

    try {
      const data = await deleteAdminGeneratedOccurrenceResource(
        generatedScheduleId,
        occurrenceId,
        resource.id,
      )
      onOccurrenceUpdated(data.occurrence ?? null)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to delete resource.')
    } finally {
      setDeleting(false)
    }
  }

  function cancelEdit() {
    setDisplayName(resource.displayName ?? '')
    setAreaId(resource.scheduleServingAreaId ? String(resource.scheduleServingAreaId) : '')
    setEditing(false)
    onError('')
  }

  if (editing) {
    return (
      <li
        className="admin-generated-occurrence-resources__item admin-generated-occurrence-resources__item--editing"
        data-resource-id={resource.id}
      >
        <p className="admin-muted admin-generated-occurrence-resources__file-meta">
          File: {resource.originalFilename} ({formatFileSize(resource.fileSize)})
        </p>
        <ResourceMetadataFields
          idPrefix={`resource-edit-${resource.id}`}
          displayName={displayName}
          areaId={areaId}
          areaOptions={areaOptions}
          onDisplayNameChange={setDisplayName}
          onAreaIdChange={setAreaId}
          showServingAreaPicker={showServingAreaPicker}
        />
        <div className="admin-generated-occurrence-resources__item-actions">
          <button
            type="button"
            className="admin-secondary-button"
            disabled={saving}
            onClick={() => void saveEdit()}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
          <button
            type="button"
            className="admin-secondary-button"
            disabled={saving}
            onClick={cancelEdit}
          >
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li
      className={`admin-generated-occurrence-resources__item${highlight ? ' admin-generated-occurrence-resources__item--highlight' : ''}`}
      data-resource-id={resource.id}
    >
      <div className="admin-generated-occurrence-resources__item-main">
        <button
          type="button"
          className="admin-generated-occurrence-resources__download-link"
          disabled={downloading}
          onClick={() => void handleDownload()}
        >
          {resourceLabel(resource)}
        </button>
        <p className="admin-muted admin-generated-occurrence-resources__file-meta">
          {resource.originalFilename !== resourceLabel(resource) ? `${resource.originalFilename} · ` : ''}
          {formatFileSize(resource.fileSize)}
        </p>
      </div>
      <div className="admin-generated-occurrence-resources__item-actions">
        <button
          type="button"
          className="admin-secondary-button"
          disabled={downloading}
          onClick={() => void handleDownload()}
        >
          {downloading ? 'Downloading…' : 'Download'}
        </button>
        <button
          type="button"
          className="admin-secondary-button"
          disabled={deleting}
          onClick={() => setEditing(true)}
        >
          Edit
        </button>
        <button
          type="button"
          className="admin-danger-button admin-danger-button--compact"
          disabled={deleting}
          onClick={() => void remove()}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </li>
  )
}

/**
 * @param {'all' | 'general' | { areaId: number }} [props.scope]
 */
export default function GeneratedOccurrenceResourcesSection({
  resources: allResources,
  servingAreaOptions,
  generatedScheduleId,
  occurrenceId,
  onOccurrenceUpdated,
  onError,
  scope = 'all',
  embedded = false,
  idPrefix = 'occ-resources',
}) {
  const fileInputRef = useRef(null)
  const uploadSectionRef = useRef(null)
  const listSectionRef = useRef(null)
  const [showUpload, setShowUpload] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [areaId, setAreaId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [highlightResourceId, setHighlightResourceId] = useState(null)

  const scopeConfig = useMemo(() => resolveOccurrenceItemScope(scope), [scope])
  const areaOptions = servingAreaOptions ?? []
  const resources = useMemo(
    () => (allResources ?? []).filter(scopeConfig.filterResource),
    [allResources, scopeConfig],
  )
  const { general, areaGroups } = useMemo(
    () =>
      scope === 'all' ? groupResources(resources) : { general: resources, areaGroups: [] },
    [resources, scope],
  )
  const hasResources = general.length > 0 || areaGroups.length > 0
  const showServingAreaPicker = scopeConfig.showServingAreaPicker
  const fixedScheduleServingAreaId = scopeConfig.fixedScheduleServingAreaId
  const fileInputId = `${idPrefix}-file`

  const rowProps = {
    areaOptions,
    generatedScheduleId,
    occurrenceId,
    onOccurrenceUpdated,
    onError,
    showServingAreaPicker,
    fixedScheduleServingAreaId,
  }

  useEffect(() => {
    if (!showUpload) {
      return
    }

    const frame = requestAnimationFrame(() => {
      uploadSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    return () => cancelAnimationFrame(frame)
  }, [showUpload])

  useEffect(() => {
    if (!highlightResourceId) {
      return
    }

    const frame = requestAnimationFrame(() => {
      const row = listSectionRef.current?.querySelector(
        `[data-resource-id="${highlightResourceId}"]`,
      )
      row?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })

    const clearHighlight = window.setTimeout(() => setHighlightResourceId(null), 2800)

    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(clearHighlight)
    }
  }, [highlightResourceId, resources])

  function resetUploadForm() {
    setSelectedFile(null)
    setDisplayName('')
    setAreaId('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function submitUpload() {
    if (!selectedFile) {
      onError('Choose a file to upload.')
      return
    }

    setUploading(true)
    onError('')

    try {
      const priorIds = new Set((allResources ?? []).map((resource) => resource.id))

      const formData = new FormData()
      formData.append('file', selectedFile)
      if (displayName.trim()) {
        formData.append('displayName', displayName.trim())
      }

      const scheduleServingAreaId =
        fixedScheduleServingAreaId !== undefined
          ? fixedScheduleServingAreaId
          : areaId
            ? areaId
            : null

      if (scheduleServingAreaId) {
        formData.append('scheduleServingAreaId', String(scheduleServingAreaId))
      }

      const data = await uploadAdminGeneratedOccurrenceResource(
        generatedScheduleId,
        occurrenceId,
        formData,
      )
      const nextResources = data.occurrence?.resources ?? []
      const added = nextResources.filter((resource) => !priorIds.has(resource.id))
      const newest = added.length ? [...added].sort((a, b) => b.id - a.id)[0] : null

      onOccurrenceUpdated(data.occurrence ?? null)
      setShowUpload(false)
      resetUploadForm()
      if (newest?.id) {
        setHighlightResourceId(newest.id)
      } else {
        listSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to upload resource.')
    } finally {
      setUploading(false)
    }
  }

  const headingId = `${idPrefix}-heading`
  const TitleTag = embedded ? 'h4' : 'h3'

  const content = (
    <>
      <div
        className={
          embedded
            ? 'admin-generated-occurrence-dialog__subsection-head'
            : 'admin-generated-occurrence-dialog__section-head'
        }
      >
        <TitleTag
          id={headingId}
          className={
            embedded
              ? 'admin-generated-occurrence-dialog__subsection-title'
              : 'admin-generated-occurrence-dialog__section-title'
          }
        >
          Resources
        </TitleTag>
        {!showUpload ? (
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => {
              onError('')
              setShowUpload(true)
            }}
          >
            Upload resource
          </button>
        ) : null}
      </div>

      {!hasResources && !showUpload ? <p className="admin-muted">No files yet.</p> : null}

      {hasResources ? (
        <div ref={listSectionRef} className="admin-generated-occurrence-notes__groups">
          {scope === 'all' && general.length > 0 ? (
            <div className="admin-generated-occurrence-notes__group">
              <h4 className="admin-generated-occurrence-notes__group-title">General resources</h4>
              <ul className="admin-generated-occurrence-resources__list">
                {general.map((resource) => (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    {...rowProps}
                    highlight={highlightResourceId === resource.id}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {scope === 'all'
            ? areaGroups.map((group) => (
                <div key={group.areaId} className="admin-generated-occurrence-notes__group">
                  <h4 className="admin-generated-occurrence-notes__group-title">
                    {group.label} resources
                  </h4>
                  <ul className="admin-generated-occurrence-resources__list">
                    {group.resources.map((resource) => (
                      <ResourceRow
                        key={resource.id}
                        resource={resource}
                        {...rowProps}
                        highlight={highlightResourceId === resource.id}
                      />
                    ))}
                  </ul>
                </div>
              ))
            : (
              <ul className="admin-generated-occurrence-resources__list">
                {general.map((resource) => (
                  <ResourceRow
                    key={resource.id}
                    resource={resource}
                    {...rowProps}
                    highlight={highlightResourceId === resource.id}
                  />
                ))}
              </ul>
            )}
        </div>
      ) : null}

      {showUpload ? (
        <div ref={uploadSectionRef} className="admin-generated-occurrence-resources__upload">
          <div className="admin-field">
            <span className="admin-label" id={`${fileInputId}-label`}>
              File
            </span>
            <div
              className="admin-file-picker"
              role="group"
              aria-labelledby={`${fileInputId}-label`}
            >
              <input
                ref={fileInputRef}
                id={fileInputId}
                type="file"
                className="admin-file-picker__input"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
              <label
                htmlFor={fileInputId}
                className="admin-secondary-button admin-file-picker__browse"
              >
                Browse
              </label>
              <span className="admin-muted admin-file-picker__filename">
                {selectedFile?.name ?? 'No file chosen'}
              </span>
            </div>
            <p className="admin-help">Maximum size 10 MB.</p>
          </div>
          <ResourceMetadataFields
            idPrefix={`${idPrefix}-new`}
            displayName={displayName}
            areaId={areaId}
            areaOptions={areaOptions}
            onDisplayNameChange={setDisplayName}
            onAreaIdChange={setAreaId}
            showServingAreaPicker={showServingAreaPicker}
          />
          <div className="admin-generated-occurrence-resources__item-actions">
            <button
              type="button"
              className="admin-secondary-button"
              disabled={uploading}
              onClick={() => void submitUpload()}
            >
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              disabled={uploading}
              onClick={() => {
                setShowUpload(false)
                resetUploadForm()
                onError('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </>
  )

  if (embedded) {
    return (
      <div className="admin-generated-occurrence-dialog__subsection" aria-labelledby={headingId}>
        {content}
      </div>
    )
  }

  return (
    <section className="admin-generated-occurrence-dialog__section" aria-labelledby={headingId}>
      {content}
    </section>
  )
}
