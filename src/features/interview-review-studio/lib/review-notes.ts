import { formatSecondsAsTimestamp } from './review-parsers'
import { REVIEW_LIMITS } from '../review-limits'

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function sanitizeFeedbackInput(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n')
  const lines = normalized.split('\n').slice(0, REVIEW_LIMITS.maxFeedbackLines)
  let remainingChars = REVIEW_LIMITS.maxFeedbackChars
  const keptLines: string[] = []

  for (let index = 0; index < lines.length; index += 1) {
    if (remainingChars <= 0) {
      break
    }

    const line = lines[index]
    const nextLine = line.slice(0, remainingChars)
    keptLines.push(nextLine)
    remainingChars -= nextLine.length

    if (index < lines.length - 1 && remainingChars > 0) {
      remainingChars -= 1
    }
  }

  return keptLines.join('\n')
}

export function normalizeTimestampInput(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return '00:00'
  }

  if (trimmed.includes(':')) {
    const [minutesRaw, secondsRaw] = trimmed.split(':', 2)
    const minutes = clamp(Number.parseInt(minutesRaw || '0', 10) || 0, 0, 99)
    const seconds = clamp(Number.parseInt(secondsRaw || '0', 10) || 0, 0, 59)

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  const digits = trimmed.replace(/\D/g, '').slice(-4)
  const minutes = clamp(Number.parseInt(digits.slice(0, -2) || '0', 10) || 0, 0, 99)
  const seconds = clamp(Number.parseInt(digits.slice(-2) || '0', 10) || 0, 0, 59)

  return formatSecondsAsTimestamp(minutes * 60 + seconds)
}

export function insertTimestampAtPosition(args: {
  value: string
  selectionStart: number
  selectionEnd: number
  timestamp: string
}) {
  const normalizedTimestamp = normalizeTimestampInput(args.timestamp)
  const before = args.value.slice(0, args.selectionStart)
  const after = args.value.slice(args.selectionEnd)
  const needsLeadingBreak = before.length > 0 && !before.endsWith('\n')
  const insertion = `${needsLeadingBreak ? '\n' : ''}[${normalizedTimestamp}] `
  const nextValue = sanitizeFeedbackInput(`${before}${insertion}${after}`)
  const caret = Math.min(before.length + insertion.length, nextValue.length)

  return {
    caret,
    nextValue,
  }
}