import type {
  ReviewFeedbackLine,
  ReviewProblem,
  ReviewProblemType,
} from '../types'
import { REVIEW_LIMITS } from '../review-limits'

const timestampPattern = /^\[(\d{1,2}:\d{2})\]\s*/
const bareDomainPattern = /^(?:(?:https?:\/\/)?(?:www\.)?)?[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+(?:[/:?#][^\s]*)?$/i
const sentimentMarkerPattern = /^([+\-/])\s*/
const listItemPattern = /^(?:[-*•]\s+|\d+[.)]\s+)/
const summaryMetadataPattern = /^(Interviewee|Role|Interviewer|Score):/i
const referencesHeadingPattern = /^References$/i
const statementsHeadingPattern = /^Custom statements$/i
const feedbackHeadingPattern = /^Feedback$/i

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }

  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function extractProblemsFromReviewSummary(input: string) {
  const lines = input.replace(/\r\n?/g, '\n').split('\n')
  const looksLikeSummary = lines.some((line) => {
    const trimmed = line.trim()
    return (
      summaryMetadataPattern.test(trimmed)
      || referencesHeadingPattern.test(trimmed)
      || statementsHeadingPattern.test(trimmed)
      || feedbackHeadingPattern.test(trimmed)
    )
  })

  if (!looksLikeSummary) {
    return null
  }

  const problems: string[] = []
  let currentSection: 'references' | 'statements' | 'feedback' | null = null
  let statementBuffer: string[] = []

  function flushStatementBuffer() {
    const statement = normalizeProblemLabel(statementBuffer.join('\n'))

    if (statement) {
      problems.push(statement)
    }

    statementBuffer = []
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (summaryMetadataPattern.test(trimmed)) {
      continue
    }

    if (referencesHeadingPattern.test(trimmed)) {
      flushStatementBuffer()
      currentSection = 'references'
      continue
    }

    if (statementsHeadingPattern.test(trimmed)) {
      flushStatementBuffer()
      currentSection = 'statements'
      continue
    }

    if (feedbackHeadingPattern.test(trimmed)) {
      flushStatementBuffer()
      currentSection = 'feedback'
      continue
    }

    if (currentSection === 'feedback') {
      continue
    }

    if (currentSection === 'references') {
      if (!trimmed) {
        continue
      }

      const reference = normalizeProblemLabel(trimmed.replace(/^[-*•]\s+/, ''))

      if (reference) {
        problems.push(reference)
      }

      continue
    }

    if (currentSection === 'statements') {
      if (!trimmed) {
        if (statementBuffer.length > 0 && statementBuffer[statementBuffer.length - 1] !== '') {
          statementBuffer.push('')
        }

        continue
      }

      if (/^[-*•]\s+/.test(trimmed)) {
        flushStatementBuffer()
        statementBuffer.push(trimmed.replace(/^[-*•]\s+/, ''))
        continue
      }

      statementBuffer.push(trimmed)
    }
  }

  flushStatementBuffer()
  return problems
}

export function detectProblemType(label: string): ReviewProblemType {
  if (bareDomainPattern.test(label.trim())) {
    return 'link'
  }

  return 'statement'
}

export function normalizeProblemLabel(label: string) {
  const normalized = label
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => {
      if (!line.trim()) {
        return ''
      }

      return line.replace(/^[\s>*•-]+/, '').replace(/[^\S\n]+/g, ' ').trim()
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return normalized.slice(0, REVIEW_LIMITS.maxProblemLength)
}

export function parseQuickProblems(input: string) {
  const normalizedInput = input.replace(/\r\n?/g, '\n').trim()

  if (!normalizedInput) {
    return []
  }

  const extractedProblems = extractProblemsFromReviewSummary(normalizedInput)

  if (extractedProblems) {
    return extractedProblems.filter(Boolean)
  }

  const lines = normalizedInput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    return []
  }

  const everyLineIsListItem = lines.every((line) => listItemPattern.test(line))
  const everyLineIsLink = lines.every((line) => bareDomainPattern.test(line))

  if (everyLineIsListItem) {
    return lines
      .map((line) => line.replace(listItemPattern, ''))
      .map(normalizeProblemLabel)
      .filter(Boolean)
  }

  if (everyLineIsLink) {
    return lines
      .map(normalizeProblemLabel)
      .filter(Boolean)
  }

  const paragraphs = normalizedInput
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join(' '))
    .filter(Boolean)

  return [paragraphs.join('\n\n')]
    .map(normalizeProblemLabel)
    .filter(Boolean)
}

export function mergeProblems(existing: ReviewProblem[], incomingLabels: string[]) {
  const seen = new Set(existing.map((problem) => problem.label.toLowerCase()))
  const nextProblems = [...existing]

  for (const label of incomingLabels) {
    if (nextProblems.length >= REVIEW_LIMITS.maxProblems) {
      break
    }

    const normalized = normalizeProblemLabel(label)
    const key = normalized.toLowerCase()

    if (!normalized || seen.has(key)) {
      continue
    }

    nextProblems.push({
      id: createId('problem'),
      label: normalized,
      type: detectProblemType(normalized),
    })
    seen.add(key)
  }

  return nextProblems
}

export function parseFeedbackLines(feedbackRaw: string): ReviewFeedbackLine[] {
  return feedbackRaw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const timestampMatch = line.match(timestampPattern)
      const withoutTimestamp = timestampMatch
        ? line.replace(timestampPattern, '').trim()
        : line

      let sentiment: ReviewFeedbackLine['sentiment'] = 'neutral'
      let marker: ReviewFeedbackLine['marker']
      let normalizedRaw = withoutTimestamp

      const markerMatch = timestampMatch ? withoutTimestamp.match(sentimentMarkerPattern) : null

      if (markerMatch) {
        marker = markerMatch[1] as ReviewFeedbackLine['marker']
        normalizedRaw = withoutTimestamp.replace(sentimentMarkerPattern, '').trim()

        if (marker === '+') {
          sentiment = 'positive'
        } else if (marker === '-') {
          sentiment = 'negative'
        }
      }

      return {
        id: `line_${index + 1}`,
        marker,
        timestamp: timestampMatch?.[1],
        sentiment,
        raw: normalizedRaw,
      }
    })
    .filter((line) => line.raw.length > 0)
}

export function formatSecondsAsTimestamp(seconds: number) {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60

  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}