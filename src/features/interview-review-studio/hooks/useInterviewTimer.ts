import { useEffect, useMemo, useState } from 'react'
import { formatSecondsAsTimestamp } from '../lib/review-parsers'
import { normalizeTimestampInput } from '../lib/review-notes'

function timestampToSeconds(value: string) {
  const normalized = normalizeTimestampInput(value)
  const [minutesRaw, secondsRaw] = normalized.split(':', 2)
  const minutes = Number.parseInt(minutesRaw || '0', 10) || 0
  const seconds = Number.parseInt(secondsRaw || '0', 10) || 0

  return minutes * 60 + seconds
}

export function useInterviewTimer(initialTimestamp = '00:00', initialIsRunning = false) {
  const [seconds, setSeconds] = useState(() => timestampToSeconds(initialTimestamp))
  const [isRunning, setIsRunning] = useState(initialIsRunning)

  useEffect(() => {
    setSeconds(timestampToSeconds(initialTimestamp))
  }, [initialTimestamp])

  useEffect(() => {
    setIsRunning(initialIsRunning)
  }, [initialIsRunning])

  useEffect(() => {
    if (!isRunning) {
      return undefined
    }

    const interval = window.setInterval(() => {
      setSeconds((current) => current + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [isRunning])

  const currentTimestamp = useMemo(() => formatSecondsAsTimestamp(seconds), [seconds])

  function toggleRunning() {
    setIsRunning((current) => !current)
  }

  function reset() {
    setSeconds(0)
    setIsRunning(false)
  }

  return {
    currentSeconds: seconds,
    currentTimestamp,
    isRunning,
    reset,
    toggleRunning,
  }
}