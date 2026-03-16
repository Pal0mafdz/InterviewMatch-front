import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Container, Stack } from '@mantine/core'
import { FormProvider, useForm } from 'react-hook-form'
import { ReviewContextPanel } from './components/ReviewContextPanel'
import { ReviewDigestPanel } from './components/ReviewDigestPanel'
import { ReviewFormPanel } from './components/ReviewFormPanel'
import { emptyReviewValues } from './constants'
import { resolveSessionContext, type SessionContext } from './default-session-context'
import { useDocumentTitle } from './hooks/useDocumentTitle'
import { useInterviewTimer } from './hooks/useInterviewTimer'
import { interviewReviewFormSchema, type InterviewReviewFormValues } from './schema'
import { useFeedbackAutosave } from '../feedback/hooks/useFeedbackAutosave'
import './interview-review-studio.css'

type InterviewReviewStudioProps = {
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
  initialValues?: InterviewReviewFormValues
}

export function InterviewReviewStudio(props: InterviewReviewStudioProps) {
  const [isFeedbackFloating, setIsFeedbackFloating] = useState(false)
  const currentContext = resolveSessionContext(props.context)
  const timer = useInterviewTimer(props.initialTimestamp ?? '00:00', props.initialTimerRunning ?? false)

  const form = useForm<InterviewReviewFormValues>({
    resolver: zodResolver(interviewReviewFormSchema),
    mode: 'onChange',
    defaultValues: props.initialValues ?? emptyReviewValues,
  })

  useEffect(() => {
    form.reset(props.initialValues ?? emptyReviewValues)
  }, [form, props.initialValues])

  const watchedValues = form.watch()

  useFeedbackAutosave({
    currentSeconds: timer.currentSeconds,
    currentTimestamp: timer.currentTimestamp,
    editKey: props.editKey ?? null,
    feedbackId: props.feedbackId ?? null,
    isReadOnly: props.isReadOnly ?? false,
    isTimerRunning: timer.isRunning,
    values: watchedValues,
  })

  useDocumentTitle(`${currentContext.candidate} - Feedback`)

  function handleToggleFeedbackFloating() {
    setIsFeedbackFloating((current) => !current)
  }

  return (
    <FormProvider {...form}>
      <Box className="irs-shell">
        <Container size="xl" className="irs-container">
          <Stack gap="xl">
            <div className="irs-workspace-grid">
              <Stack gap="xl" className="irs-main-column">
                <ReviewContextPanel context={currentContext} editLink={props.editLink} />

                <ReviewFormPanel
                  currentTimestamp={timer.currentTimestamp}
                  isTimerRunning={timer.isRunning}
                  isFeedbackFloating={isFeedbackFloating}
                  onResetTimer={timer.reset}
                  onToggleFeedbackFloating={handleToggleFeedbackFloating}
                  onToggleTimer={timer.toggleRunning}
                />
              </Stack>

              <div className="irs-digest-rail">
                <ReviewDigestPanel viewLink={props.viewLink} />
              </div>
            </div>
          </Stack>
        </Container>
      </Box>
    </FormProvider>
  )
}