import { useState } from 'react'
import { SUPPORT_EMAIL } from '../constants/support'
import './SupportEmailContact.css'

const COPY_FEEDBACK_MS = 2500

function CopyEmailIcon() {
  return (
    <svg
      className="support-email__copy-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function CopiedEmailIcon() {
  return (
    <svg
      className="support-email__copy-icon support-email__copy-icon--check"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

export default function SupportEmailContact({ linkClassName = 'support-email__link' }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, COPY_FEEDBACK_MS)
    } catch {
      window.alert('Could not copy to clipboard.')
    }
  }

  return (
    <span className="support-email">
      <a className={linkClassName} href={`mailto:${SUPPORT_EMAIL}`}>
        {SUPPORT_EMAIL}
      </a>
      <button
        type="button"
        className="support-email__copy"
        aria-label={copied ? 'Copied support email' : 'Copy support email address'}
        onClick={handleCopy}
      >
        {copied ? <CopiedEmailIcon /> : <CopyEmailIcon />}
      </button>
    </span>
  )
}
