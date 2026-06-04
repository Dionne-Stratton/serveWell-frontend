import { useEffect } from 'react'

export default function AdminToast({ message, onDismiss, durationMs = 3000 }) {
  useEffect(() => {
    if (!message) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      onDismiss?.()
    }, durationMs)

    return () => window.clearTimeout(timer)
  }, [message, onDismiss, durationMs])

  if (!message) {
    return null
  }

  return (
    <div className="admin-toast" role="status" aria-live="polite">
      {message}
    </div>
  )
}
