import { Check, Copy } from 'lucide-react'
import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import type { SessionContext } from '../default-session-context'

type ReviewContextPanelProps = {
  context: SessionContext
  editLink?: {
    copied: boolean
    onCopy: () => Promise<void>
  } | null
}

export function ReviewContextPanel(props: ReviewContextPanelProps) {
  const { context, editLink } = props

  return (
    <Paper className="irs-panel" radius={32} p={{ base: 'lg', md: 'xl' }}>
      <div className="irs-context-panel">
        <div className="irs-context-lead">
          <div>
            <Text size="sm" c="dimmed">Candidate</Text>
            <Text className="irs-context-title">{context.candidate}</Text>
          </div>

          <Group gap="xs" className="irs-context-badges">
            <Badge radius="xl" variant="light" color="gray">{context.interviewLoop}</Badge>
            <Badge radius="xl" variant="light" color="gray">{context.dateLabel}</Badge>
          </Group>
        </div>

        <Stack gap="sm" className="irs-context-details">
          <div className="irs-context-row">
            <span>Interviewer</span>
            <strong>{context.interviewer}</strong>
          </div>

          {editLink ? (
            <div className="irs-context-row irs-context-row-link">
              <span>Draft link</span>
              <Text size="sm" c="dimmed">
                Keep this private link if you want to reopen the same draft later.
              </Text>
              <Button
                radius="xl"
                variant="default"
                leftSection={editLink.copied ? <Check size={16} /> : <Copy size={16} />}
                onClick={() => void editLink.onCopy()}
              >
                {editLink.copied ? 'Copied' : 'Copy link'}
              </Button>
            </div>
          ) : null}
        </Stack>
      </div>
    </Paper>
  )
}