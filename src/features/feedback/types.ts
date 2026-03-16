import type { FeedbackFormValues } from './schema'

export type FeedbackContext = {
  candidate: string
  role: string
  interviewer: string
  interviewLoop: string
  dateLabel: string
}

export type FeedbackDecision = 'NO_HIRE' | 'UNDECIDED' | 'HIRE' | 'STRONG_HIRE' | null

export type FeedbackReferenceDto = {
  id: string
  label: string
  type: 'link' | 'statement'
  order: number
}

export type FeedbackDetailDto = {
  id: string
  mode: 'general' | 'platform'
  status: 'draft' | 'shared' | 'archived'
  context: {
    candidateName: string
    roleLabel: string
    interviewerName: string
    interviewLoopLabel: string
    scheduledAt: string | null
    dateLabel: string
  }
  decision: FeedbackDecision
  references: FeedbackReferenceDto[]
  notesRaw: string
  notesLines: Array<{
    id: string
    timestamp: string | null
    marker: 'positive' | 'negative' | 'neutral'
    raw: string
    order: number
  }>
  timer: {
    currentSeconds: number
    lastTimestampLabel: string
    isRunning: boolean
  }
  summary: {
    overallRead: string
    referencesCount: number
    statementsCount: number
    notesCount: number
    exportText: string
  }
  permissions: {
    canView: boolean
    canEdit: boolean
    canShare: boolean
    canArchive: boolean
    canDelete: boolean
  }
}

export type PublicFeedbackContextInput = {
  candidateName: string
  roleLabel: string
  interviewerName: string
  interviewLoopLabel: string
}

export type PublicFeedbackCreateInput = {
  context: PublicFeedbackContextInput
}

export type PublicFeedbackCreateResponse = {
  editKey: string
  viewKey: string
  feedback: FeedbackDetailDto
}

export type FeedbackStudioState = {
  context: FeedbackContext
  editKey: string | null
  viewKey: string | null
  feedbackId: string | null
  initialTimerRunning: boolean
  initialTimestamp: string
  initialValues: FeedbackFormValues
  loadedFeedback: FeedbackDetailDto | null
  errorMessage: string | null
  isReadOnly: boolean
  status: 'loading' | 'ready' | 'error'
}