import { useMemo, useState } from 'react'
import {
  ApiError,
  createAdminGeneratedOccurrenceNote,
  deleteAdminGeneratedOccurrenceNote,
  patchAdminGeneratedOccurrenceNote,
} from '../../api/client'

function groupNotes(notes) {
  const general = []
  const byAreaId = new Map()

  for (const note of notes ?? []) {
    if (!note.scheduleServingAreaId) {
      general.push(note)
      continue
    }

    const key = note.scheduleServingAreaId
    const list = byAreaId.get(key) ?? []
    list.push(note)
    byAreaId.set(key, list)
  }

  const areaGroups = [...byAreaId.entries()].map(([areaId, areaNotes]) => ({
    areaId,
    label: areaNotes[0]?.servingAreaDisplayName ?? `Area ${areaId}`,
    notes: areaNotes,
  }))

  return { general, areaGroups }
}

function NoteEditor({ noteText, areaId, areaOptions, onNoteTextChange, onAreaIdChange, idPrefix }) {
  return (
    <div className="admin-generated-occurrence-notes__editor-fields">
      <div className="admin-field">
        <label className="admin-label" htmlFor={`${idPrefix}-text`}>
          Note
        </label>
        <textarea
          id={`${idPrefix}-text`}
          className="admin-textarea admin-generated-occurrence-notes__textarea"
          rows={3}
          value={noteText}
          onChange={(event) => onNoteTextChange(event.target.value)}
        />
      </div>
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
          <option value="">General event note</option>
          {areaOptions.map((area) => (
            <option key={area.id} value={area.id}>
              {area.displayName}
            </option>
          ))}
        </select>
        <p className="admin-help">
          Leave as general for notes that apply to everyone at this event. Area-specific notes
          require staffing needs on this event.
        </p>
      </div>
    </div>
  )
}

function NoteRow({
  note,
  areaOptions,
  generatedScheduleId,
  occurrenceId,
  onOccurrenceUpdated,
  onError,
}) {
  const [editing, setEditing] = useState(false)
  const [noteText, setNoteText] = useState(note.note)
  const [areaId, setAreaId] = useState(
    note.scheduleServingAreaId ? String(note.scheduleServingAreaId) : '',
  )
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function saveEdit() {
    const trimmed = noteText.trim()
    if (!trimmed) {
      onError('Note text is required.')
      return
    }

    setSaving(true)
    onError('')

    try {
      const data = await patchAdminGeneratedOccurrenceNote(
        generatedScheduleId,
        occurrenceId,
        note.id,
        {
          note: trimmed,
          scheduleServingAreaId: areaId ? Number(areaId) : null,
        },
      )
      onOccurrenceUpdated(data.occurrence ?? null)
      setEditing(false)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to save note.')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    setDeleting(true)
    onError('')

    try {
      const data = await deleteAdminGeneratedOccurrenceNote(
        generatedScheduleId,
        occurrenceId,
        note.id,
      )
      onOccurrenceUpdated(data.occurrence ?? null)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to delete note.')
    } finally {
      setDeleting(false)
    }
  }

  function cancelEdit() {
    setNoteText(note.note)
    setAreaId(note.scheduleServingAreaId ? String(note.scheduleServingAreaId) : '')
    setEditing(false)
    onError('')
  }

  if (editing) {
    return (
      <li className="admin-generated-occurrence-notes__item admin-generated-occurrence-notes__item--editing">
        <NoteEditor
          idPrefix={`note-edit-${note.id}`}
          noteText={noteText}
          areaId={areaId}
          areaOptions={areaOptions}
          onNoteTextChange={setNoteText}
          onAreaIdChange={setAreaId}
        />
        <div className="admin-generated-occurrence-notes__item-actions">
          <button
            type="button"
            className="admin-secondary-button"
            disabled={saving}
            onClick={() => void saveEdit()}
          >
            {saving ? 'Saving…' : 'Save note'}
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
    <li className="admin-generated-occurrence-notes__item">
      <p className="admin-generated-occurrence-notes__text">{note.note}</p>
      <div className="admin-generated-occurrence-notes__item-actions">
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
          {deleting ? 'Removing…' : 'Delete'}
        </button>
      </div>
    </li>
  )
}

export function servingAreaOptionsFromRequirements(requirements) {
  const seen = new Set()
  const options = []

  for (const req of requirements ?? []) {
    const id = req.scheduleServingAreaId
    if (!id || seen.has(id)) {
      continue
    }
    seen.add(id)
    options.push({
      id,
      displayName: req.displayName?.trim() || `Area ${id}`,
    })
  }

  return options.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }))
}

export default function GeneratedOccurrenceNotesSection({
  notes,
  servingAreaOptions,
  generatedScheduleId,
  occurrenceId,
  onOccurrenceUpdated,
  onError,
}) {
  const [showAdd, setShowAdd] = useState(false)
  const [newNoteText, setNewNoteText] = useState('')
  const [newAreaId, setNewAreaId] = useState('')
  const [adding, setAdding] = useState(false)

  const areaOptions = servingAreaOptions ?? []
  const { general, areaGroups } = useMemo(() => groupNotes(notes), [notes])
  const hasNotes = general.length > 0 || areaGroups.length > 0

  async function addNote() {
    const trimmed = newNoteText.trim()
    if (!trimmed) {
      onError('Note text is required.')
      return
    }

    setAdding(true)
    onError('')

    try {
      const data = await createAdminGeneratedOccurrenceNote(
        generatedScheduleId,
        occurrenceId,
        {
          note: trimmed,
          scheduleServingAreaId: newAreaId ? Number(newAreaId) : null,
        },
      )
      onOccurrenceUpdated(data.occurrence ?? null)
      setNewNoteText('')
      setNewAreaId('')
      setShowAdd(false)
    } catch (err) {
      onError(err instanceof ApiError ? err.message : 'Unable to add note.')
    } finally {
      setAdding(false)
    }
  }

  return (
    <section className="admin-generated-occurrence-dialog__section" aria-labelledby="occ-notes-heading">
      <div className="admin-generated-occurrence-dialog__section-head">
        <h3 id="occ-notes-heading" className="admin-generated-occurrence-dialog__section-title">
          Notes
        </h3>
        {!showAdd ? (
          <button
            type="button"
            className="admin-secondary-button"
            onClick={() => {
              onError('')
              setShowAdd(true)
            }}
          >
            Add note
          </button>
        ) : null}
      </div>

      {!hasNotes && !showAdd ? (
        <p className="admin-muted">No notes for this event yet.</p>
      ) : null}

      {areaOptions.length === 0 && showAdd ? (
        <p className="admin-help">
          Add staffing needs for this event to attach area-specific notes. You can still add general
          notes.
        </p>
      ) : null}

      {hasNotes ? (
        <div className="admin-generated-occurrence-notes__groups">
          {general.length > 0 ? (
            <div className="admin-generated-occurrence-notes__group">
              <h4 className="admin-generated-occurrence-notes__group-title">General</h4>
              <ul className="admin-generated-occurrence-notes__list">
                {general.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    areaOptions={areaOptions}
                    generatedScheduleId={generatedScheduleId}
                    occurrenceId={occurrenceId}
                    onOccurrenceUpdated={onOccurrenceUpdated}
                    onError={onError}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          {areaGroups.map((group) => (
            <div key={group.areaId} className="admin-generated-occurrence-notes__group">
              <h4 className="admin-generated-occurrence-notes__group-title">{group.label}</h4>
              <ul className="admin-generated-occurrence-notes__list">
                {group.notes.map((note) => (
                  <NoteRow
                    key={note.id}
                    note={note}
                    areaOptions={areaOptions}
                    generatedScheduleId={generatedScheduleId}
                    occurrenceId={occurrenceId}
                    onOccurrenceUpdated={onOccurrenceUpdated}
                    onError={onError}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : null}

      {showAdd ? (
        <div className="admin-generated-occurrence-notes__add">
          <NoteEditor
            idPrefix="note-new"
            noteText={newNoteText}
            areaId={newAreaId}
            areaOptions={areaOptions}
            onNoteTextChange={setNewNoteText}
            onAreaIdChange={setNewAreaId}
          />
          <div className="admin-generated-occurrence-notes__item-actions">
            <button
              type="button"
              className="admin-secondary-button"
              disabled={adding}
              onClick={() => void addNote()}
            >
              {adding ? 'Saving…' : 'Save note'}
            </button>
            <button
              type="button"
              className="admin-secondary-button"
              disabled={adding}
              onClick={() => {
                setShowAdd(false)
                setNewNoteText('')
                setNewAreaId('')
                onError('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  )
}
