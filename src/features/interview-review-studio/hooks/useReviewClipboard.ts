import { useEffect, useState } from 'react'

function fallbackCopyText(value: string) {
  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '0'
  textarea.style.left = '0'
  textarea.style.width = '1px'
  textarea.style.height = '1px'
  textarea.style.padding = '0'
  textarea.style.border = '0'
  textarea.style.opacity = '0'

  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  textarea.setSelectionRange(0, textarea.value.length)

  try {
    return document.execCommand('copy')
  } finally {
    document.body.removeChild(textarea)
  }
}

export function useReviewClipboard(resetDelayMs = 1800) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return undefined
    }

    const timeout = window.setTimeout(() => setCopied(false), resetDelayMs)
    return () => window.clearTimeout(timeout)
  }, [copied, resetDelayMs])

  async function copyText(value: string) {
    try {
      if (window.isSecureContext && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const copiedWithFallback = fallbackCopyText(value)

        if (!copiedWithFallback) {
          throw new Error('Clipboard fallback failed')
        }
      }
    } catch {
      const copiedWithFallback = fallbackCopyText(value)

      if (!copiedWithFallback) {
        throw new Error('Unable to copy review text')
      }
    }

    setCopied(true)
  }

  return {
    copied,
    copyText,
  }
}