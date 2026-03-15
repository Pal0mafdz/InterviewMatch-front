function getPathSegments() {
  return window.location.pathname.split('/').filter(Boolean)
}

function buildViewKeyStorageKey(feedbackId: string) {
  return `feedback:view-key:${feedbackId}`
}

export function isFeedbackDigestViewLocation() {
  const segments = getPathSegments()
  return segments[0] === 'feedback' && segments[1] === 'view' && Boolean(segments[2])
}

export function getFeedbackIdFromLocation() {
  const segments = getPathSegments()

  if (segments[0] === 'feedback' && segments[1] === 'view' && segments[2]) {
    return segments[2]
  }

  const feedbackIndex = segments.indexOf('feedback')

  if (feedbackIndex >= 0 && segments[feedbackIndex + 1]) {
    return segments[feedbackIndex + 1]
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('feedbackId') ?? params.get('id')
}

export function getFeedbackEditKeyFromLocation() {
  if (isFeedbackDigestViewLocation()) {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('k') ?? params.get('editKey')
}

export function getFeedbackViewKeyFromLocation() {
  if (!isFeedbackDigestViewLocation()) {
    return null
  }

  const params = new URLSearchParams(window.location.search)
  return params.get('k') ?? params.get('viewKey')
}

export function buildFeedbackEditorPath(feedbackId: string, editKey?: string | null) {
  const params = new URLSearchParams()

  if (editKey) {
    params.set('k', editKey)
  }

  const query = params.toString()

  return query ? `/feedback/${feedbackId}?${query}` : `/feedback/${feedbackId}`
}

export function buildFeedbackDigestPath(feedbackId: string, viewKey?: string | null) {
  const params = new URLSearchParams()

  if (viewKey) {
    params.set('k', viewKey)
  }

  const query = params.toString()

  return query ? `/feedback/view/${feedbackId}?${query}` : `/feedback/view/${feedbackId}`
}

export function buildAbsoluteFeedbackDigestUrl(feedbackId: string, viewKey?: string | null) {
  return `${window.location.origin}${buildFeedbackDigestPath(feedbackId, viewKey)}`
}

export function storeFeedbackViewKey(feedbackId: string, viewKey: string) {
  window.localStorage.setItem(buildViewKeyStorageKey(feedbackId), viewKey)
}

export function getStoredFeedbackViewKey(feedbackId: string) {
  return window.localStorage.getItem(buildViewKeyStorageKey(feedbackId))
}

export function buildCurrentFeedbackEditorUrl() {
  return `${window.location.origin}${window.location.pathname}${window.location.search}`
}