import type { FeedbackFormValues } from './schema'
import type { FeedbackContext } from './types'

const defaultDateLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date())

export const defaultFeedbackContext: FeedbackContext = {
  candidate: 'Alfredo Palacios',
  role: 'Software Engineer',
  interviewer: 'Sebastian Ponce',
  interviewLoop: 'Behavioral + Technical',
  dateLabel: defaultDateLabel,
}

export const defaultFeedbackValues: FeedbackFormValues = {
  problems: [],
  score: null,
  feedbackRaw: '',
}