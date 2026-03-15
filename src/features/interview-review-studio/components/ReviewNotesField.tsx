import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Clock3, Pause, Play, RotateCcw, WandSparkles } from 'lucide-react'
import { ActionIcon, Badge, Button, Group, Paper, Stack, Text, Textarea } from '@mantine/core'
import { useController } from 'react-hook-form'
import { reviewNotesPlaceholder } from '../constants'
import { sanitizeFeedbackInput, insertTimestampAtPosition } from '../lib/review-notes'
import { parseFeedbackLines } from '../lib/review-parsers'
import { REVIEW_LIMITS } from '../review-limits'
import type { InterviewReviewFormValues } from '../schema'

type DocumentPictureInPictureApi = {
  requestWindow: (options?: { height?: number; width?: number }) => Promise<Window>
}

declare global {
  interface Window {
    documentPictureInPicture?: DocumentPictureInPictureApi
  }
}

type ReviewNotesFieldProps = {
  currentTimestamp: string
  isTimerRunning: boolean
  isFloatingEnabled: boolean
  onResetTimer: () => void
  onToggleFloating: () => void
  onToggleTimer: () => void
}

function cloneDocumentStyles(targetDocument: Document) {
  const headNodes = document.querySelectorAll('link[rel="stylesheet"], style')

  headNodes.forEach((node) => {
    targetDocument.head.append(node.cloneNode(true))
  })
}

export function ReviewNotesField(props: ReviewNotesFieldProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const pictureInPictureWindowRef = useRef<Window | null>(null)
  const suppressWindowCloseRef = useRef(false)
  const { field, fieldState } = useController<InterviewReviewFormValues, 'feedbackRaw'>({
    name: 'feedbackRaw',
    defaultValue: '',
  })
  const feedbackValue = field.value ?? ''
  const [pictureInPictureContainer, setPictureInPictureContainer] = useState<HTMLElement | null>(null)
  const [isDocumentHidden, setIsDocumentHidden] = useState(() => document.visibilityState === 'hidden')
  const feedbackCount = useMemo(() => parseFeedbackLines(feedbackValue).length, [feedbackValue])
  const lineBadgeColor = feedbackCount >= REVIEW_LIMITS.maxFeedbackLines ? 'red' : 'blue'
  const charBadgeColor = feedbackValue.length >= REVIEW_LIMITS.maxFeedbackChars ? 'red' : 'gray'
  const supportsPictureInPicture = typeof window !== 'undefined' && typeof window.documentPictureInPicture !== 'undefined'

  useEffect(() => {
    function handleVisibilityChange() {
      setIsDocumentHidden(document.visibilityState === 'hidden')
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    if (props.isFloatingEnabled) {
      return
    }

    const currentWindow = pictureInPictureWindowRef.current

    if (!currentWindow) {
      setPictureInPictureContainer(null)
      return
    }

    suppressWindowCloseRef.current = true
    currentWindow.close()
    pictureInPictureWindowRef.current = null
    setPictureInPictureContainer(null)

    requestAnimationFrame(() => {
      suppressWindowCloseRef.current = false
    })
  }, [props.isFloatingEnabled])

  useEffect(() => {
    return () => {
      if (!pictureInPictureWindowRef.current) {
        return
      }

      suppressWindowCloseRef.current = true
      pictureInPictureWindowRef.current.close()
      pictureInPictureWindowRef.current = null
    }
  }, [])

  function insertTimestamp() {
    const textarea = textareaRef.current

    if (!textarea) {
      return
    }

    const nextState = insertTimestampAtPosition({
      value: feedbackValue,
      selectionEnd: textarea.selectionEnd ?? feedbackValue.length,
      selectionStart: textarea.selectionStart ?? feedbackValue.length,
      timestamp: props.currentTimestamp,
    })

    field.onChange(nextState.nextValue)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(nextState.caret, nextState.caret)
    })
  }

  async function enableFloatingCompanion() {
    if (!supportsPictureInPicture || pictureInPictureWindowRef.current) {
      return
    }

    const nextWindow = await window.documentPictureInPicture?.requestWindow({
      width: 460,
      height: 760,
    })

    if (!nextWindow) {
      return
    }

    cloneDocumentStyles(nextWindow.document)
    nextWindow.document.documentElement.classList.add('irs-pip-document')
    nextWindow.document.body.classList.add('irs-pip-body')
    nextWindow.document.title = 'Interview feedback'

    const mountNode = nextWindow.document.createElement('div')
    mountNode.className = 'irs-pip-root'
    nextWindow.document.body.innerHTML = ''
    nextWindow.document.body.append(mountNode)

    pictureInPictureWindowRef.current = nextWindow
    setPictureInPictureContainer(mountNode)

    nextWindow.addEventListener('pagehide', () => {
      pictureInPictureWindowRef.current = null
      setPictureInPictureContainer(null)

      if (!suppressWindowCloseRef.current) {
        props.onToggleFloating()
      }
    }, { once: true })

    props.onToggleFloating()
  }

  function disableFloatingCompanion() {
    props.onToggleFloating()
  }

  const statusBadges = (
    <>
      <Badge radius="xl" variant="light" color={lineBadgeColor}>
        {feedbackCount}/{REVIEW_LIMITS.maxFeedbackLines} lines
      </Badge>
      <Badge radius="xl" variant="light" color={charBadgeColor}>
        {feedbackValue.length}/{REVIEW_LIMITS.maxFeedbackChars} chars
      </Badge>
    </>
  )

  const editorContent = (
    <>
      <Paper className="irs-timestamp-card" radius={24} p="md">
        <Group justify="space-between" align="end" gap="md">
          <Group gap="sm" align="center">
            <div className="irs-timestamp-icon">
              <Clock3 size={16} />
            </div>
            <div>
              <Text size="sm" c="dimmed">
                Feedback timer
              </Text>
              <Text fw={700} className="irs-timestamp-readout">{props.currentTimestamp}</Text>
              <Text size="sm" c="dimmed">Press Enter or use Insert now to drop the current time.</Text>
            </div>
          </Group>

          <Group gap="sm" align="end">
            <ActionIcon
              size={42}
              radius="xl"
              variant={props.isTimerRunning ? 'filled' : 'light'}
              color="amber"
              onClick={props.onToggleTimer}
              aria-label={props.isTimerRunning ? 'Pause timer' : 'Start timer'}
            >
              {props.isTimerRunning ? <Pause size={18} /> : <Play size={18} />}
            </ActionIcon>
            <ActionIcon
              size={42}
              radius="xl"
              variant="subtle"
              color="gray"
              onClick={props.onResetTimer}
              aria-label="Reset timer"
            >
              <RotateCcw size={18} />
            </ActionIcon>
            <Button radius="xl" variant="light" color="amber" leftSection={<WandSparkles size={16} />} onClick={insertTimestamp}>
              Insert now
            </Button>
          </Group>
        </Group>
      </Paper>

      <Textarea
        ref={textareaRef}
        value={feedbackValue}
        maxLength={REVIEW_LIMITS.maxFeedbackChars}
        onChange={(event) => field.onChange(sanitizeFeedbackInput(event.currentTarget.value))}
        onFocus={() => {
          if (!feedbackValue.trim()) {
            insertTimestamp()
          }
        }}
        onBlur={field.onBlur}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            insertTimestamp()
          }
        }}
        className="irs-feedback"
        autosize
        minRows={12}
        maxRows={18}
        radius="xl"
        placeholder={reviewNotesPlaceholder}
        styles={{
          input: {
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6,
            paddingTop: '18px',
            paddingBottom: '26px',
            paddingLeft: '18px',
            paddingRight: '18px',
            scrollPaddingTop: '18px',
            scrollPaddingBottom: '26px',
          },
        }}
        description={`Use [mm:ss] with + for positive, - for negative, and nothing for neutral. Up to ${REVIEW_LIMITS.maxFeedbackLines} lines and ${REVIEW_LIMITS.maxFeedbackChars} characters.`}
        error={fieldState.error?.message}
      />
    </>
  )

  const companionWindowContent = pictureInPictureContainer
    ? createPortal(
      isDocumentHidden ? (
        <Paper className="irs-panel irs-pip-panel" radius={28} p="lg">
          <Stack gap="md">
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={600}>Floating feedback</Text>
                <Text size="sm" c="dimmed">
                  This stays with you while the interview tab is in the background.
                </Text>
              </div>
              <Button radius="xl" variant="subtle" color="gray" onClick={disableFloatingCompanion}>
                Dock back
              </Button>
            </Group>
            <Stack gap="sm">
              <Group gap="xs" className="irs-feedback-controls">
                {statusBadges}
              </Group>
              {editorContent}
            </Stack>
          </Stack>
        </Paper>
      ) : (
        <Paper className="irs-panel irs-pip-standby" radius={28} p="lg">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={600}>Floating feedback ready</Text>
                <Text size="sm" c="dimmed">
                  Switch tabs and this window will become your live notes pad.
                </Text>
              </div>
              <Button radius="xl" variant="subtle" color="gray" onClick={disableFloatingCompanion}>
                Dock back
              </Button>
            </Group>
            <Group gap="xs" className="irs-feedback-controls">
              {statusBadges}
            </Group>
            <div className="irs-pip-standby-surface">
              <ArrowUpRight size={18} />
              <span>Keep working in the main tab. The pop-out takes over only after you leave it.</span>
            </div>
          </Stack>
        </Paper>
      ),
      pictureInPictureContainer,
    )
    : null

  return (
    <>
      {!props.isFloatingEnabled ? (
        <Stack gap="sm">
          <Group justify="space-between" align="flex-end">
            <div>
              <Text fw={700}>Feedback notes</Text>
              <Text size="sm" c="dimmed">
                Press Enter to insert the current timestamp automatically. Keep each line specific enough that someone else could understand the signal without replaying the interview.
              </Text>
            </div>
            <Group gap="xs">
              {statusBadges}
              <Button
                radius="xl"
                variant="light"
                color="blue"
                onClick={enableFloatingCompanion}
                disabled={!supportsPictureInPicture}
              >
                Follow across tabs
              </Button>
            </Group>
          </Group>

          {!supportsPictureInPicture ? (
            <Text size="sm" c="dimmed">
              This browser does not support a Meet-style floating companion window. Chromium-based browsers are required.
            </Text>
          ) : null}

          {editorContent}
        </Stack>
      ) : (
        <Stack gap="sm">
          <Paper className="irs-feedback-docked" radius={24} p="lg">
            <Group justify="space-between" align="flex-start" gap="md">
              <div>
                <Text fw={600}>Feedback notes</Text>
                <Text size="sm" c="dimmed">
                  The companion window is armed. It takes over only when you leave this tab and returns here when you come back.
                </Text>
              </div>
              <Group gap="xs" className="irs-feedback-controls">
                {statusBadges}
                <Button radius="xl" variant="subtle" color="gray" onClick={disableFloatingCompanion}>
                  Dock back
                </Button>
              </Group>
            </Group>
          </Paper>

          {!isDocumentHidden ? editorContent : null}
        </Stack>
      )}

      {companionWindowContent}
    </>
  )
}