import { InterviewReviewStudio } from '../interview-review-studio/InterviewReviewStudio'
import type { SessionContext } from '../interview-review-studio/default-session-context'
import type { FeedbackFormValues } from './schema'

type FeedbackEditorProps = {
  context?: Partial<SessionContext>
  editLink?: {
    copied: boolean
    onCopy: () => Promise<void>
  } | null
  isReadOnly?: boolean
  viewLink?: {
    copied: boolean
    onCopy: () => Promise<void>
  } | null
  editKey?: string | null
  feedbackId?: string | null
  initialTimerRunning?: boolean
  initialTimestamp?: string
  initialValues?: FeedbackFormValues
}

export function FeedbackEditor(props: FeedbackEditorProps) {
  return (
    <InterviewReviewStudio
      context={props.context}
      editLink={props.editLink}
      isReadOnly={props.isReadOnly}
      viewLink={props.viewLink}
      editKey={props.editKey}
      feedbackId={props.feedbackId}
      initialTimerRunning={props.initialTimerRunning}
      initialTimestamp={props.initialTimestamp}
      initialValues={props.initialValues}
    />
  )
}