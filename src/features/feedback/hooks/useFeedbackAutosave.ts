import { useEffect, useRef } from 'react'
import { buildPatchPayload, buildTimerPatchPayload, patchFeedback, patchFeedbackTimer } from '../api/patchFeedback'
import type { FeedbackFormValues } from '../schema'

const CONTENT_SAVE_DEBOUNCE_MS = 900
const TIMER_SYNC_INTERVAL_MS = 5000

type UseFeedbackAutosaveArgs = {
  currentSeconds: number
  currentTimestamp: string
  editKey: string | null
  feedbackId: string | null
  isReadOnly?: boolean
  isTimerRunning: boolean
  values: FeedbackFormValues
}

function buildSyncSnapshot(args: UseFeedbackAutosaveArgs) {
  const payload = buildPatchPayload({
    currentSeconds: args.currentSeconds,
    currentTimestamp: args.currentTimestamp,
    isTimerRunning: args.isTimerRunning,
    values: args.values,
  })

  return {
    payload,
    contentKey: JSON.stringify({
      decision: payload.decision,
      notesRaw: payload.notesRaw,
      references: payload.references,
      timer: {
        isRunning: payload.timer.isRunning,
        currentSeconds: payload.timer.isRunning ? null : payload.timer.currentSeconds,
      },
    }),
    timerKey: `${payload.timer.currentSeconds}:${payload.timer.isRunning ? 1 : 0}`,
  }
}

export function useFeedbackAutosave(args: UseFeedbackAutosaveArgs) {
  const isSavingRef = useRef(false)
  const pendingReasonRef = useRef<'content' | 'timer' | null>(null)
  const lastSavedContentKeyRef = useRef<string | null>(null)
  const lastSavedTimerKeyRef = useRef<string | null>(null)
  const latestArgsRef = useRef(args)

  latestArgsRef.current = args

  useEffect(() => {
    if (!args.feedbackId || args.isReadOnly) {
      return
    }

    const snapshot = buildSyncSnapshot(args)
    lastSavedContentKeyRef.current = snapshot.contentKey
    lastSavedTimerKeyRef.current = snapshot.timerKey
    pendingReasonRef.current = null
  }, [args.feedbackId, args.isReadOnly])

  async function flushSave(reason: 'content' | 'timer') {
    const currentArgs = latestArgsRef.current

    if (!currentArgs.feedbackId || currentArgs.isReadOnly) {
      return
    }

    if (isSavingRef.current) {
      pendingReasonRef.current = pendingReasonRef.current === 'content' || reason === 'content'
        ? 'content'
        : 'timer'
      return
    }

    const snapshot = buildSyncSnapshot(currentArgs)
    const shouldSave = reason === 'content'
      ? snapshot.contentKey !== lastSavedContentKeyRef.current
      : snapshot.timerKey !== lastSavedTimerKeyRef.current

    if (!shouldSave) {
      return
    }

    isSavingRef.current = true

    try {
      if (reason === 'content') {
        await patchFeedback(currentArgs.feedbackId, snapshot.payload)
      } else {
        await patchFeedbackTimer(currentArgs.feedbackId, buildTimerPatchPayload({
          currentSeconds: currentArgs.currentSeconds,
          currentTimestamp: currentArgs.currentTimestamp,
          isTimerRunning: currentArgs.isTimerRunning,
        }))
      }

      lastSavedContentKeyRef.current = snapshot.contentKey
      lastSavedTimerKeyRef.current = snapshot.timerKey
    } catch (error) {
      console.warn(error)
    } finally {
      isSavingRef.current = false

      const pendingReason = pendingReasonRef.current
      pendingReasonRef.current = null

      if (pendingReason) {
        await flushSave(pendingReason)
      }
    }
  }

  useEffect(() => {
    if (!args.feedbackId || args.isReadOnly) {
      return undefined
    }

    const snapshot = buildSyncSnapshot(args)

    if (snapshot.contentKey === lastSavedContentKeyRef.current) {
      return undefined
    }

    const timeout = window.setTimeout(() => {
      void flushSave('content')
    }, CONTENT_SAVE_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [args.feedbackId, args.isReadOnly, args.currentSeconds, args.isTimerRunning, args.currentTimestamp, args.values])

  useEffect(() => {
    if (!args.feedbackId || args.isReadOnly || !args.isTimerRunning) {
      return undefined
    }

    const interval = window.setInterval(() => {
      void flushSave('timer')
    }, TIMER_SYNC_INTERVAL_MS)

    return () => {
      window.clearInterval(interval)
    }
  }, [args.feedbackId, args.isReadOnly, args.isTimerRunning])
}