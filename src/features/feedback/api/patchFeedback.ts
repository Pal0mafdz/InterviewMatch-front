import { buildJsonHeaders } from './getFeedback'
import { getFeedbackEditKeyFromLocation } from '../lib/location'
import type { FeedbackDetailDto, FeedbackDecision } from '../types'
import type { FeedbackFormValues } from '../schema'

function mapDecision(score: FeedbackFormValues['score']): FeedbackDecision {
  if (score === 'UNDETERMINED') {
    return 'UNDECIDED'
  }

  if (score === 'STRONGLY_HIRE') {
    return 'STRONG_HIRE'
  }

  return score
}

export function buildPatchPayload(args: {
  currentSeconds: number
  currentTimestamp: string
  isTimerRunning: boolean
  values: FeedbackFormValues
}) {
  return {
    decision: mapDecision(args.values.score),
    references: args.values.problems.map((problem, index) => ({
      id: problem.id,
      label: problem.label,
      type: problem.type,
      order: index + 1,
    })),
    notesRaw: args.values.feedbackRaw,
    timer: {
      currentSeconds: args.currentSeconds,
      lastTimestampLabel: args.currentTimestamp,
      isRunning: args.isTimerRunning,
    },
  }
}

export function buildTimerPatchPayload(args: {
  currentSeconds: number
  currentTimestamp: string
  isTimerRunning: boolean
}) {
  return {
    currentSeconds: args.currentSeconds,
    lastTimestampLabel: args.currentTimestamp,
    isRunning: args.isTimerRunning,
  }
}

export async function patchFeedback(feedbackId: string, payload: ReturnType<typeof buildPatchPayload>): Promise<FeedbackDetailDto> {
  const editKey = getFeedbackEditKeyFromLocation()
  const requestPath = editKey
    ? `/api/feedback/public/${encodeURIComponent(feedbackId)}?editKey=${encodeURIComponent(editKey)}`
    : `/api/feedback/${encodeURIComponent(feedbackId)}`

  const response = await fetch(requestPath, {
    method: 'PATCH',
    headers: {
      ...buildJsonHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Unable to save feedback ${feedbackId}`)
  }

  return response.json() as Promise<FeedbackDetailDto>
}

export async function patchFeedbackTimer(feedbackId: string, payload: ReturnType<typeof buildTimerPatchPayload>): Promise<FeedbackDetailDto> {
  const editKey = getFeedbackEditKeyFromLocation()
  const requestPath = editKey
    ? `/api/feedback/public/${encodeURIComponent(feedbackId)}/timer?editKey=${encodeURIComponent(editKey)}`
    : `/api/feedback/${encodeURIComponent(feedbackId)}/timer`

  const response = await fetch(requestPath, {
    method: 'PATCH',
    headers: {
      ...buildJsonHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Unable to sync timer for feedback ${feedbackId}`)
  }

  return response.json() as Promise<FeedbackDetailDto>
}