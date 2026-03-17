import type { MouseEvent } from 'react'
import { Button } from 'pixel-retroui'

export type ShareButtonProps = {
  /** Path relative to the app root, e.g. "/sessions/123" */
  path: string
  /** Human-friendly title for the shared content */
  title: string
  /** Optional description shown in WhatsApp text prefill */
  description?: string
  /** Optional label for the button */
  label?: string
}

export function ShareButton({ path, title, description, label }: ShareButtonProps) {
  const shareUrl = `${window.location.origin}/api/share?path=${encodeURIComponent(
    path.startsWith('/') ? path : `/${path}`
  )}`

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${title}${description ? ` - ${description}` : ''} \n\n${shareUrl}`
  )}`

  const handleShare = (event: MouseEvent) => {
    event.preventDefault()

    // Use native share if available
    if (navigator.share) {
      navigator
        .share({
          title,
          text: description,
          url: shareUrl,
        })
        .catch(() => {
          window.open(whatsappUrl, '_blank')
        })
    } else {
      window.open(whatsappUrl, '_blank')
    }
  }

  return (
    <Button
      bg="#FFD700"
      textColor="#1A0F08"
      shadow="#1A0F08"
      borderColor="#1A0F08"
      onClick={handleShare}
    >
      {label ?? 'Compartir'}
    </Button>
  )
}
