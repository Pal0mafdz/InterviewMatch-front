import { useState } from 'react'
import { Alert, Button, Card, Group, Stack, Text, TextInput, Title } from '@mantine/core'
import { AlertCircle, Link as LinkIcon, Sparkles } from 'lucide-react'
import { createPublicFeedback } from '../api/createPublicFeedback'
import { buildFeedbackEditorPath, storeFeedbackViewKey } from '../lib/location'
import { createRandomFeedbackContext } from '../lib/random-feedback-context'
import type { PublicFeedbackContextInput } from '../types'

const emptyContext: PublicFeedbackContextInput = {
  candidateName: '',
  roleLabel: '',
  interviewerName: '',
  interviewLoopLabel: '',
}

export function PublicFeedbackEntry() {
  const [context, setContext] = useState<PublicFeedbackContextInput>(emptyContext)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  function updateField<Key extends keyof PublicFeedbackContextInput>(key: Key, value: PublicFeedbackContextInput[Key]) {
    setContext((current) => ({
      ...current,
      [key]: value,
    }))
  }

  async function submit(nextContext: PublicFeedbackContextInput) {
    setIsSubmitting(true)
    setErrorMessage(null)

    try {
      const response = await createPublicFeedback({ context: nextContext })
      storeFeedbackViewKey(response.feedback.id, response.viewKey)
      const nextUrl = buildFeedbackEditorPath(response.feedback.id, response.editKey)
      window.location.assign(nextUrl)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to create public feedback')
      setIsSubmitting(false)
    }
  }

  async function handleCreate() {
    await submit({
      candidateName: context.candidateName.trim(),
      roleLabel: context.roleLabel.trim(),
      interviewerName: context.interviewerName.trim(),
      interviewLoopLabel: context.interviewLoopLabel.trim(),
    })
  }

  async function handleSkip() {
    const randomContext = createRandomFeedbackContext()
    setContext(randomContext)
    await submit(randomContext)
  }

  return (
    <Stack justify="center" align="center" mih="100vh" px="md" py="xl">
      <Card shadow="xl" radius="2rem" p="xl" maw={720} w="100%" withBorder>
        <Stack gap="xl">
          <Stack gap="xs">
            <Group gap="sm">
              <Sparkles size={18} />
              <Text fw={700} size="sm" tt="uppercase" c="amber.4">
                Public Feedback
              </Text>
            </Group>

            <Title order={1}>Open a fresh feedback workspace</Title>
            <Text c="dimmed">
              Fill the basic interview context and the tool will create an editable link for you. If you do not want to type anything yet, use Skip and the studio will start with sample data.
            </Text>
          </Stack>

          {errorMessage ? (
            <Alert color="red" variant="light" radius="xl" icon={<AlertCircle size={16} />}>
              {errorMessage}
            </Alert>
          ) : null}

          <Stack gap="md">
            <TextInput
              label="Candidate"
              placeholder="Ana Perez"
              value={context.candidateName}
              onChange={(event) => updateField('candidateName', event.currentTarget.value)}
            />
            <TextInput
              label="Role"
              placeholder="Backend Engineer"
              value={context.roleLabel}
              onChange={(event) => updateField('roleLabel', event.currentTarget.value)}
            />
            <TextInput
              label="Interviewer"
              placeholder="Luis Gomez"
              value={context.interviewerName}
              onChange={(event) => updateField('interviewerName', event.currentTarget.value)}
            />
            <TextInput
              label="Interview loop"
              placeholder="Technical Interview"
              value={context.interviewLoopLabel}
              onChange={(event) => updateField('interviewLoopLabel', event.currentTarget.value)}
            />
          </Stack>

          <Group justify="space-between" align="center">
            <Text c="dimmed" size="sm">
              The generated link will reopen this exact editable draft later.
            </Text>

            <Group>
              <Button variant="default" leftSection={<Sparkles size={16} />} loading={isSubmitting} onClick={() => void handleSkip()}>
                Skip and use sample data
              </Button>
              <Button leftSection={<LinkIcon size={16} />} loading={isSubmitting} onClick={() => void handleCreate()}>
                Create link
              </Button>
            </Group>
          </Group>
        </Stack>
      </Card>
    </Stack>
  )
}