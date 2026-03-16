import type { FeedbackDetailDto } from '../types'
import { getFeedbackEditKeyFromLocation, getFeedbackIdFromLocation, getFeedbackViewKeyFromLocation, isFeedbackDigestViewLocation } from '../lib/location'

function getStoredToken() {
  return window.localStorage.getItem('token') || window.localStorage.getItem('authToken') || ''
}

function buildJsonHeaders() {
  const token = getStoredToken()

  return {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export async function getFeedback(feedbackId: string, editKey?: string | null): Promise<FeedbackDetailDto> {
  const viewKey = getFeedbackViewKeyFromLocation()
  const requestPath = isFeedbackDigestViewLocation() && viewKey
    ? `/api/feedback/public/${encodeURIComponent(feedbackId)}/view?k=${encodeURIComponent(viewKey)}`
    : isFeedbackDigestViewLocation()
      ? `/api/feedback/${encodeURIComponent(feedbackId)}`
    : editKey
      ? `/api/feedback/public/${encodeURIComponent(feedbackId)}?editKey=${encodeURIComponent(editKey)}`
      : `/api/feedback/${encodeURIComponent(feedbackId)}`

  const response = await fetch(requestPath, {
    headers: buildJsonHeaders(),
  })

  if (!response.ok) {
    throw new Error(`Unable to load feedback ${feedbackId}`)
  }

  return response.json() as Promise<FeedbackDetailDto>
}

export { buildJsonHeaders, getFeedbackEditKeyFromLocation, getFeedbackIdFromLocation }