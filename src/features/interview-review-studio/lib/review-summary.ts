import type { MantineColor } from '@mantine/core'
import { parseFeedbackLines } from './review-parsers'
import { reviewScoreOptions, type ReviewProblem, type ReviewScore } from '../types'

export function scoreLabel(score: ReviewScore | null) {
  return reviewScoreOptions.find((option) => option.value === score)?.label ?? 'No decision yet'
}

export function buildOverallRead(score: ReviewScore | null) {
  if (score === 'STRONGLY_HIRE') {
    return 'Clear, confident signal with strong ownership and clarity.'
  }

  if (score === 'HIRE') {
    return 'Solid signal with enough evidence to recommend moving forward.'
  }

  if (score === 'UNDETERMINED') {
    return 'Mixed signal. The notes suggest another pass would help.'
  }

  if (score === 'NO_HIRE') {
    return 'Concerns outweigh the positive evidence captured so far.'
  }

  return 'Choose a decision when the feedback has enough signal.'
}

export function problemTypeTone(problem: ReviewProblem): MantineColor {
  return problem.type === 'link' ? 'blue' : 'grape'
}

function formatStatementBlock(label: string) {
  const lines = label.split('\n')

  return lines
    .map((line, index) => {
      if (!line.trim()) {
        return ''
      }

      return index === 0 ? `- ${line}` : `  ${line}`
    })
    .join('\n')
}

function formatFeedbackLine(line: ReturnType<typeof parseFeedbackLines>[number]) {
  return line.timestamp ? `[${line.timestamp}] ${line.raw}` : line.raw
}

export function buildReviewSummary(args: {
  candidate: string
  role: string
  interviewer: string
  score: ReviewScore | null
  problems: ReviewProblem[]
  feedback: string
}) {
  const references = args.problems
    .filter((problem) => problem.type === 'link')
    .map((problem) => `- ${problem.label}`)
  const statements = args.problems
    .filter((problem) => problem.type === 'statement')
    .map((problem) => formatStatementBlock(problem.label))
  const feedbackLines = parseFeedbackLines(args.feedback)
    .map((line) => formatFeedbackLine(line))
  const sections: string[] = [
    `Interviewee: ${args.candidate}`,
    `Role: ${args.role}`,
    `Interviewer: ${args.interviewer}`,
  ]

  if (args.score) {
    sections.push(`Score: ${scoreLabel(args.score)}`)
  }

  if (references.length > 0) {
    sections.push('', 'References', ...references)
  }

  if (statements.length > 0) {
    sections.push('', 'Custom statements', ...statements)
  }

  if (feedbackLines.length > 0) {
    sections.push('', 'Feedback', ...feedbackLines)
  }

  return sections.join('\n')
}

export function getCompletionMetrics(args: {
  feedbackRaw: string
  problems: ReviewProblem[]
  score: ReviewScore | null
}) {
  const feedbackLines = parseFeedbackLines(args.feedbackRaw)
  const checkpoints = [
    args.problems.length > 0,
    Boolean(args.score),
    feedbackLines.length > 0,
  ]
  const completed = checkpoints.filter(Boolean).length

  return {
    completed,
    feedbackLines,
    percent: (completed / checkpoints.length) * 100,
    total: checkpoints.length,
  }
}