import type { FeedbackFormValues } from './schema'
import type { FeedbackContext } from './types'

export const defaultFeedbackContext: FeedbackContext = {
  candidate: 'Alfredo Palacios',
  role: 'Software Engineer',
  interviewer: 'Sebastian Ponce',
  interviewLoop: 'Behavioral + Technical',
  dateLabel: 'Mar 14, 2026',
}

export const defaultFeedbackValues: FeedbackFormValues = {
  problems: [],
  score: null,
  feedbackRaw: '',
}