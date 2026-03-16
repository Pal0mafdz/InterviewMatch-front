import { useState } from 'react'
import { Alert, Center, Loader, Stack, Text } from '@mantine/core'
import { AlertCircle } from 'lucide-react'
import { ReadOnlyFeedbackDigest } from './components/ReadOnlyFeedbackDigest'
import { FeedbackEditor } from './FeedbackEditor'
import { PublicFeedbackEntry } from './components/PublicFeedbackEntry'
import { useFeedbackEditor } from './hooks/useFeedbackEditor'
import { buildAbsoluteFeedbackDigestUrl, buildCurrentFeedbackEditorUrl } from './lib/location'
import { useDocumentTitle } from '../interview-review-studio/hooks/useDocumentTitle'

function buildDocumentTitle(candidateName?: string | null) {
  const normalizedCandidateName = candidateName?.trim()

  if (!normalizedCandidateName) {
    return 'Feedback Review'
  }

  return `${normalizedCandidateName} - Feedback Review`
}

export function FeedbackStudio() {
  const state = useFeedbackEditor()
  const [copied, setCopied] = useState(false)
  const [viewLinkCopied, setViewLinkCopied] = useState(false)
  const candidateName = state.feedbackId
    ? (state.loadedFeedback?.context.candidateName ?? state.context.candidate)
    : null

  useDocumentTitle(buildDocumentTitle(candidateName))

  async function copyEditorLink() {
    await window.navigator.clipboard.writeText(buildCurrentFeedbackEditorUrl())
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  async function copyViewLink() {
    if (!state.feedbackId || !state.viewKey) {
      return
    }

    await window.navigator.clipboard.writeText(buildAbsoluteFeedbackDigestUrl(state.feedbackId, state.viewKey))
    setViewLinkCopied(true)
    window.setTimeout(() => setViewLinkCopied(false), 1800)
  }

  if (state.status === 'loading') {
    return (
      <Center mih="100vh">
        <Stack align="center" gap="sm">
          <Loader color="amber" />
          <Text c="dimmed">Loading feedback...</Text>
        </Stack>
      </Center>
    )
  }

  if (!state.feedbackId) {
    return <PublicFeedbackEntry />
  }

  if (state.isReadOnly) {
    if (state.loadedFeedback) {
      return <ReadOnlyFeedbackDigest feedback={state.loadedFeedback} />
    }

    return (
      <Center mih="100vh" px="md">
        <Alert color="red" radius="xl" variant="light" icon={<AlertCircle size={16} />} maw={720}>
          This view-only feedback link could not be opened. It may be invalid, expired, or tied to an older draft that does not have a public digest link.
        </Alert>
      </Center>
    )
  }

  return (
    <Stack gap="md">
      {state.errorMessage ? (
        <Alert color="yellow" radius="xl" variant="light" icon={<AlertCircle size={16} />} mx="md" mt="md">
          {state.feedbackId
            ? `Feedback ${state.feedbackId} could not be loaded, so the studio opened with local defaults.`
            : state.errorMessage}
        </Alert>
      ) : null}

      <FeedbackEditor
        context={state.context}
        editLink={state.editKey ? {
          copied,
          onCopy: copyEditorLink,
        } : null}
        isReadOnly={state.isReadOnly}
        viewLink={state.viewKey ? {
          copied: viewLinkCopied,
          onCopy: copyViewLink,
        } : null}
        editKey={state.editKey}
        feedbackId={state.feedbackId}
        initialTimerRunning={state.initialTimerRunning}
        initialTimestamp={state.initialTimestamp}
        initialValues={state.initialValues}
      />
    </Stack>
  )
}