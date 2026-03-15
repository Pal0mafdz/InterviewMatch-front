import type { InterviewReviewFormValues } from './schema'

export const emptyReviewValues: InterviewReviewFormValues = {
  problems: [],
  score: null,
  feedbackRaw: '',
}

export const reviewNotesPlaceholder =
  '[02:10] + Framed the problem clearly before proposing a direction\n' +
  '[08:40] + Explained tradeoffs in a structured way\n' +
  '[14:10] - Missed the cleanest rollback path once failure handling came up'