import { useEffect, useState } from 'react'
import { formatSecondsAsTimestamp } from '../../interview-review-studio/lib/review-parsers'
import { defaultFeedbackContext, defaultFeedbackValues } from '../default-feedback-context'
import { getFeedback, getFeedbackEditKeyFromLocation, getFeedbackIdFromLocation } from '../api/getFeedback'
import { getFeedbackViewKeyFromLocation, getStoredFeedbackViewKey, isFeedbackDigestViewLocation } from '../lib/location'
import type { FeedbackFormValues } from '../schema'
import type { FeedbackContext, FeedbackDecision, FeedbackDetailDto, FeedbackStudioState } from '../types'

function mapDecision(decision: FeedbackDecision): FeedbackFormValues['score'] {
  if (decision === 'UNDECIDED') {
    return 'UNDETERMINED'
  }

  if (decision === 'STRONG_HIRE') {
    return 'STRONGLY_HIRE'
  }

  return decision
}

function mapFeedbackContext(dto: FeedbackDetailDto): FeedbackContext {
  return {
    candidate: dto.context.candidateName || defaultFeedbackContext.candidate,
    role: dto.context.roleLabel || defaultFeedbackContext.role,
    interviewer: dto.context.interviewerName || defaultFeedbackContext.interviewer,
    interviewLoop: dto.context.interviewLoopLabel || defaultFeedbackContext.interviewLoop,
    dateLabel: dto.context.dateLabel || defaultFeedbackContext.dateLabel,
  }
}

function mapFeedbackValues(dto: FeedbackDetailDto): FeedbackFormValues {
  return {
    problems: [...dto.references].sort((left, right) => left.order - right.order).map((reference) => ({
      id: reference.id,
      label: reference.label,
      type: reference.type,
    })),
    score: mapDecision(dto.decision),
    feedbackRaw: dto.notesRaw ?? '',
  }
}

function buildDefaultState(): FeedbackStudioState {
  return {
    context: defaultFeedbackContext,
    editKey: null,
    viewKey: null,
    feedbackId: null,
    initialTimerRunning: false,
    initialTimestamp: '00:00',
    initialValues: defaultFeedbackValues,
    loadedFeedback: null,
    errorMessage: null,
    isReadOnly: false,
    status: 'ready',
  }
}

export function useFeedbackEditor(): FeedbackStudioState {
  const [state, setState] = useState<FeedbackStudioState>(() => {
    const feedbackId = getFeedbackIdFromLocation()
    const editKey = getFeedbackEditKeyFromLocation()
    const viewKey = feedbackId ? (getFeedbackViewKeyFromLocation() ?? getStoredFeedbackViewKey(feedbackId)) : null

    if (!feedbackId) {
      return buildDefaultState()
    }

    return {
      ...buildDefaultState(),
      editKey,
      viewKey,
      feedbackId,
      isReadOnly: isFeedbackDigestViewLocation(),
      status: 'loading',
    }
  })

  useEffect(() => {
    const feedbackId = getFeedbackIdFromLocation()
    const editKey = getFeedbackEditKeyFromLocation()
    const viewKey = feedbackId ? (getFeedbackViewKeyFromLocation() ?? getStoredFeedbackViewKey(feedbackId)) : null

    if (!feedbackId) {
      setState(buildDefaultState())
      return
    }

    const resolvedFeedbackId = feedbackId

    let cancelled = false

    async function loadFeedback() {
      try {
        const dto = await getFeedback(resolvedFeedbackId, editKey)

        if (cancelled) {
          return
        }

        setState({
          context: mapFeedbackContext(dto),
          editKey,
          viewKey,
          feedbackId: dto.id,
          initialTimerRunning: dto.timer.isRunning,
          initialTimestamp: dto.timer.lastTimestampLabel || formatSecondsAsTimestamp(dto.timer.currentSeconds || 0),
          initialValues: mapFeedbackValues(dto),
          loadedFeedback: dto,
          errorMessage: null,
          isReadOnly: isFeedbackDigestViewLocation(),
          status: 'ready',
        })
      } catch (error) {
        if (cancelled) {
          return
        }

        setState({
          ...buildDefaultState(),
          editKey,
          viewKey,
          feedbackId: resolvedFeedbackId,
          isReadOnly: isFeedbackDigestViewLocation(),
          errorMessage: error instanceof Error ? error.message : 'Unable to load feedback',
          status: 'error',
        })
      }
    }

    void loadFeedback()

    return () => {
      cancelled = true
    }
  }, [])

  return state
}