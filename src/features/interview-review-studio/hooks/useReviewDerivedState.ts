import { useDeferredValue, useMemo } from 'react'
import { useWatch } from 'react-hook-form'
import { parseFeedbackLines } from '../lib/review-parsers'
import { getCompletionMetrics } from '../lib/review-summary'
import type { InterviewReviewFormValues } from '../schema'

export function useReviewDerivedState() {
  const problems = useWatch<InterviewReviewFormValues, 'problems'>({ name: 'problems' }) ?? []
  const score = useWatch<InterviewReviewFormValues, 'score'>({ name: 'score' }) ?? null
  const feedbackRaw = useWatch<InterviewReviewFormValues, 'feedbackRaw'>({ name: 'feedbackRaw' }) ?? ''
  const deferredFeedbackRaw = useDeferredValue(feedbackRaw)

  const feedbackLines = useMemo(
    () => parseFeedbackLines(deferredFeedbackRaw),
    [deferredFeedbackRaw],
  )

  const completion = useMemo(
    () => getCompletionMetrics({ feedbackRaw: deferredFeedbackRaw, problems, score }),
    [deferredFeedbackRaw, problems, score],
  )

  const referenceCount = useMemo(
    () => problems.filter((problem) => problem.type === 'link').length,
    [problems],
  )

  const statementCount = useMemo(
    () => problems.filter((problem) => problem.type === 'statement').length,
    [problems],
  )

  return {
    completion,
    feedbackLines,
    feedbackRaw,
    problems,
    referenceCount,
    score,
    statementCount,
  }
}