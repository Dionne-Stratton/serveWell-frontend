import { useEffect, useMemo, useState } from 'react'

import { ApiError, createAdminGeneratedSchedule } from '../../api/client'

import {

  applyBlackoutEndChange,

  applyBlackoutStartChange,

  latestIsoDate,

  monthEndIsoDateLocal,

  todayIsoDateLocal,

  validateSingleDateRange,

} from '../serve/blackoutDateUtils'

import { suggestGeneratedScheduleName, formatBlackoutDateRange } from '../../constants/labels'

import { labelScheduleType } from '../../constants/schedule'

import softBtn from '../../styles/adminSoftButtons.module.css'



const MONTH_OPTIONS = [

  { value: 1, label: 'January' },

  { value: 2, label: 'February' },

  { value: 3, label: 'March' },

  { value: 4, label: 'April' },

  { value: 5, label: 'May' },

  { value: 6, label: 'June' },

  { value: 7, label: 'July' },

  { value: 8, label: 'August' },

  { value: 9, label: 'September' },

  { value: 10, label: 'October' },

  { value: 11, label: 'November' },

  { value: 12, label: 'December' },

]



function initialDateState() {

  const now = new Date()

  return {

    month: now.getMonth() + 1,

    year: now.getFullYear(),

    startDate: '',

    endDate: '',

  }

}



function datesReadyForSuggestion(scheduleType, dates) {

  if (scheduleType === 'monthly') {

    return Boolean(dates.month && dates.year)

  }



  return Boolean(dates.startDate && dates.endDate)

}



export default function CreateGeneratedScheduleDialog({

  open,

  templates,

  initialTemplateId = null,

  onClose,

  onCreated,

}) {

  const [templateId, setTemplateId] = useState('')

  const [dates, setDates] = useState(initialDateState)

  const [scheduleName, setScheduleName] = useState('')

  const [nameTouched, setNameTouched] = useState(false)

  const [fieldError, setFieldError] = useState('')

  const [submitError, setSubmitError] = useState('')

  const [saving, setSaving] = useState(false)



  useEffect(() => {

    if (!open) {

      return

    }



    setTemplateId(initialTemplateId ? String(initialTemplateId) : '')

    setDates(initialDateState())

    setScheduleName('')

    setNameTouched(false)

    setFieldError('')

    setSubmitError('')

  }, [open, initialTemplateId])



  const selectedTemplate = useMemo(

    () => templates.find((row) => String(row.id) === String(templateId)),

    [templates, templateId],

  )



  const scheduleType = selectedTemplate?.scheduleType ?? 'monthly'



  const today = todayIsoDateLocal()

  const currentYear = Number(today.slice(0, 4))

  const currentMonth = Number(today.slice(5, 7))

  const endMinForRange = latestIsoDate(dates.startDate, today)



  const suggestedName = useMemo(() => {

    if (!selectedTemplate || !datesReadyForSuggestion(scheduleType, dates)) {

      return ''

    }



    if (scheduleType === 'monthly') {

      return suggestGeneratedScheduleName(selectedTemplate.name, scheduleType, {

        month: dates.month,

        year: dates.year,

      })

    }



    return suggestGeneratedScheduleName(selectedTemplate.name, scheduleType, {

      startDate: dates.startDate,

      endDate: dates.endDate,

    })

  }, [selectedTemplate, scheduleType, dates])



  useEffect(() => {

    if (!open || nameTouched || !suggestedName) {

      return

    }



    setScheduleName(suggestedName)

  }, [open, nameTouched, suggestedName])



  function validateDates() {

    if (!templateId) {

      return 'Select a schedule template.'

    }



    if (scheduleType === 'monthly') {

      if (!dates.month || !dates.year) {

        return 'Select a month and year.'

      }



      if (dates.year < currentYear) {

        return 'Year cannot be in the past.'

      }



      if (dates.year === currentYear && dates.month < currentMonth) {

        return 'That month is entirely in the past.'

      }



      const monthEnd = monthEndIsoDateLocal(dates.year, dates.month)

      if (monthEnd < today) {

        return 'That month is entirely in the past.'

      }



      return ''

    }



    return validateSingleDateRange(dates.startDate, dates.endDate, { disallowPastDates: true })

  }



  function validate() {

    const dateMessage = validateDates()

    if (dateMessage) {

      return dateMessage

    }



    if (!scheduleName.trim()) {

      return 'Schedule name is required.'

    }



    return ''

  }



  async function handleSubmit(event) {

    event.preventDefault()

    const message = validate()



    if (message) {

      setFieldError(message)

      return

    }



    setFieldError('')

    setSubmitError('')

    setSaving(true)



    try {

      const trimmedName = scheduleName.trim()

      const payload =

        scheduleType === 'monthly'

          ? {

              scheduleTemplateId: Number(templateId),

              name: trimmedName,

              month: dates.month,

              year: dates.year,

            }

          : {

              scheduleTemplateId: Number(templateId),

              name: trimmedName,

              startDate: dates.startDate,

              endDate: dates.endDate,

            }



      const data = await createAdminGeneratedSchedule(payload)

      onCreated?.(data.generatedSchedule)

    } catch (err) {

      setSubmitError(

        err instanceof ApiError ? err.message : 'Unable to create schedule.',

      )

    } finally {

      setSaving(false)

    }

  }



  if (!open) {

    return null

  }



  return (

    <div className="admin-dialog-backdrop" role="presentation">

      <div

        className="admin-dialog admin-dialog--narrow"

        role="dialog"

        aria-modal="true"

        aria-labelledby="create-generated-schedule-title"

      >

        <h2 id="create-generated-schedule-title" className="admin-dialog__title">

          Create schedule

        </h2>

        <form className="admin-dialog__body" onSubmit={(event) => void handleSubmit(event)}>

          <p className="admin-help">

            Choose a template and date range. We&apos;ll create a draft schedule with events from

            the template.

          </p>



          <label className="admin-label" htmlFor="generated-schedule-template">

            Schedule template

          </label>

          <select

            id="generated-schedule-template"

            className="admin-input admin-input--select"

            value={templateId}

            onChange={(event) => setTemplateId(event.target.value)}

          >

            <option value="">Select a template…</option>

            {templates.map((template) => (

              <option key={template.id} value={template.id}>

                {template.name} ({labelScheduleType(template.scheduleType)})

              </option>

            ))}

          </select>



          {selectedTemplate ? (

            <p className="admin-help admin-help--nested">

              Template type: {labelScheduleType(scheduleType)}

            </p>

          ) : null}



          {scheduleType === 'monthly' ? (

            <div className="admin-generated-schedule-date-fields">

              <div>

                <label className="admin-label" htmlFor="generated-schedule-month">

                  Month

                </label>

                <select

                  id="generated-schedule-month"

                  className="admin-input admin-input--select"

                  value={dates.month}

                  onChange={(event) =>

                    setDates((current) => ({

                      ...current,

                      month: Number(event.target.value),

                    }))

                  }

                >

                  {MONTH_OPTIONS.map((option) => {

                    const isPastMonth =

                      dates.year === currentYear && option.value < currentMonth

                    return (

                      <option key={option.value} value={option.value} disabled={isPastMonth}>

                        {option.label}

                      </option>

                    )

                  })}

                </select>

              </div>

              <div>

                <label className="admin-label" htmlFor="generated-schedule-year">

                  Year

                </label>

                <input

                  id="generated-schedule-year"

                  className="admin-input"

                  type="number"

                  min={currentYear}

                  max={2100}

                  value={dates.year}

                  onChange={(event) => {

                    const year = Number(event.target.value)

                    setDates((current) => {

                      let month = current.month

                      if (year === currentYear && month < currentMonth) {

                        month = currentMonth

                      }

                      return { ...current, year, month }

                    })

                  }}

                />

              </div>

            </div>

          ) : (

            <div className="admin-generated-schedule-date-fields">

              <div>

                <label className="admin-label" htmlFor="generated-schedule-start">

                  Start date

                </label>

                <input

                  id="generated-schedule-start"

                  className="admin-input"

                  type="date"

                  value={dates.startDate}

                  min={today}

                  max={dates.endDate || undefined}

                  onChange={(event) =>

                    setDates((current) => {

                      const row = {

                        startDate: current.startDate,

                        endDate: current.endDate,

                      }

                      const next = applyBlackoutStartChange(row, event.target.value, {

                        disallowPastDates: true,

                      })

                      return {

                        ...current,

                        startDate: next.startDate,

                        endDate: next.endDate,

                      }

                    })

                  }

                />

              </div>

              <div>

                <label className="admin-label" htmlFor="generated-schedule-end">

                  End date

                </label>

                <input

                  id="generated-schedule-end"

                  className="admin-input"

                  type="date"

                  value={dates.endDate}

                  min={endMinForRange || today}

                  onChange={(event) =>

                    setDates((current) => {

                      const row = {

                        startDate: current.startDate,

                        endDate: current.endDate,

                      }

                      const next = applyBlackoutEndChange(row, event.target.value, {

                        disallowPastDates: true,

                      })

                      return { ...current, endDate: next.endDate }

                    })

                  }

                />

              </div>

            </div>

          )}



          {selectedTemplate && scheduleType === 'special_event' && dates.startDate && dates.endDate ? (

            <p className="admin-muted admin-generated-schedule-range-preview">

              Range: {formatBlackoutDateRange(dates.startDate, dates.endDate)}

            </p>

          ) : null}



          <div className="admin-generated-schedule-name-field">

            <label className="admin-label" htmlFor="generated-schedule-name">

              Schedule name

            </label>

            <input

              id="generated-schedule-name"

              className="admin-input"

              type="text"

              value={scheduleName}

              onChange={(event) => {

                setNameTouched(true)

                setScheduleName(event.target.value)

              }}

            />

          </div>



          {fieldError ? <p className="admin-error">{fieldError}</p> : null}

          {submitError ? <p className="admin-error">{submitError}</p> : null}



          <div className="admin-dialog__actions admin-dialog__actions--spaced-top">

            <button

              type="button"

              className={softBtn.softBtnDanger}

              disabled={saving}

              onClick={onClose}

            >

              Cancel

            </button>

            <button type="submit" className="admin-button" disabled={saving}>

              {saving ? 'Creating…' : 'Create draft schedule'}

            </button>

          </div>

        </form>

      </div>

    </div>

  )

}


