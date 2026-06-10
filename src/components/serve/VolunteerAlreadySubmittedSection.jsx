import { useState } from 'react'
import { ApiError, requestVolunteerSubmissionUpdateLink } from '../../api/client'

export default function VolunteerAlreadySubmittedSection({
  organizationSlug,
  formSlug,
  previewOnly = false,
  sectionId = 'already-submitted',
}) {
  const [email, setEmail] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [ack, setAck] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [sendCount, setSendCount] = useState(0)
  const [statusKey, setStatusKey] = useState(0)

  const defaultAck =
    'If we found a matching submission, we sent an update link to that email.'
  const resendAck = 'Update link sent again. Check your inbox (and spam folder).'

  async function sendUpdateLink() {
    setError('')

    const trimmed = email.trim()
    if (!trimmed) {
      setError('Enter the email you used when you submitted.')
      return
    }

    if (previewOnly) {
      return
    }

    const isResend = linkSent
    setPending(true)
    if (isResend) {
      setAck('Sending another link…')
      setStatusKey((current) => current + 1)
    }

    try {
      const data = await requestVolunteerSubmissionUpdateLink(
        organizationSlug,
        formSlug,
        trimmed,
      )
      setAck(isResend ? resendAck : (data.message ?? defaultAck))
      setStatusKey((current) => current + 1)
      setSendCount((previous) => previous + 1)
      setLinkSent(true)
    } catch (err) {
      setAck('')
      setLinkSent(false)
      setSendCount(0)
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to send an update link right now. Please try again.',
      )
    } finally {
      setPending(false)
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value)
    if (linkSent || ack) {
      setLinkSent(false)
      setAck('')
      setSendCount(0)
    }
    setError('')
  }

  const ackIsPending = pending && ack === 'Sending another link…'

  return (
    <section className="serve-already-submitted" id={sectionId} aria-labelledby={`${sectionId}-heading`}>
      <h2 className="serve-already-submitted__title" id={`${sectionId}-heading`}>
        Already submitted?
      </h2>
      <p className="serve-already-submitted__lead">
        Enter the same email you used before and we&apos;ll send a secure link to update your
        responses.
      </p>
      <div className="serve-already-submitted__form">
        <label className="serve-already-submitted__email-label" htmlFor={`${sectionId}-email`}>
          Email:
        </label>
        <input
          id={`${sectionId}-email`}
          className="serve-input serve-already-submitted__email-input"
          type="email"
          autoComplete="email"
          value={email}
          disabled={previewOnly || pending}
          onChange={handleEmailChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void sendUpdateLink()
            }
          }}
        />
        <button
          type="button"
          className="serve-button serve-button--secondary"
          disabled={previewOnly || pending || !email.trim()}
          onClick={() => void sendUpdateLink()}
        >
          {pending ? 'Sending…' : linkSent ? 'Resend Email' : 'Send update link'}
        </button>
      </div>
      {error ? <p className="serve-field-error">{error}</p> : null}
      {ack ? (
        <p
          key={statusKey}
          className={[
            'serve-already-submitted__ack',
            ackIsPending ? 'serve-already-submitted__ack--pending' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="status"
          aria-live="polite"
        >
          {ack}
        </p>
      ) : null}
    </section>
  )
}
