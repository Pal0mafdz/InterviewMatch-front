import { z } from 'zod'
import { parseFeedbackLines } from './lib/review-parsers'
import { REVIEW_LIMITS } from './review-limits'

export const reviewScoreSchema = z.enum([
  'NO_HIRE',
  'UNDETERMINED',
  'HIRE',
  'STRONGLY_HIRE',
])

export const reviewProblemSchema = z.object({
  id: z.string().min(1),
  label: z
    .string()
    .trim()
    .min(1, 'Add at least one reference or statement')
    .max(REVIEW_LIMITS.maxProblemLength, `Keep each reference or statement under ${REVIEW_LIMITS.maxProblemLength} characters`),
  type: z.enum(['link', 'statement']),
})

export const interviewReviewFormSchema = z.object({
  problems: z
    .array(reviewProblemSchema)
    .max(REVIEW_LIMITS.maxProblems, `Keep it to ${REVIEW_LIMITS.maxProblems} references or statements max`),
  score: reviewScoreSchema.nullable(),
  feedbackRaw: z
    .string()
    .trim()
    .max(REVIEW_LIMITS.maxFeedbackChars, `Keep feedback under ${REVIEW_LIMITS.maxFeedbackChars} characters`)
    .refine((value) => parseFeedbackLines(value).length <= REVIEW_LIMITS.maxFeedbackLines, {
      message: `Keep it to ${REVIEW_LIMITS.maxFeedbackLines} feedback lines max`,
    }),
})

export type InterviewReviewFormValues = z.input<typeof interviewReviewFormSchema>