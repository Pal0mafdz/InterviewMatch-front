import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useFormState } from 'react-hook-form'
import { ReviewNotesField } from './ReviewNotesField'
import { ReviewProblemsField } from './ReviewProblemsField'
import { ReviewScoreField } from './ReviewScoreField'

type ReviewFormPanelProps = {
  currentTimestamp: string
  isTimerRunning: boolean
  isFeedbackFloating: boolean
  onResetTimer: () => void
  onToggleFeedbackFloating: () => void
  onToggleTimer: () => void
}

export function ReviewFormPanel(props: ReviewFormPanelProps) {
  const { isValid } = useFormState()

  return (
    <Paper className="irs-panel" radius={32} p={{ base: 'lg', md: 'xl' }}>
      <Stack gap="xl">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Feedback form
            </Text>
            <Title order={2}>Capture the signal while it is fresh</Title>
          </div>
          <Badge radius="xl" variant="light" color={isValid ? 'teal' : 'red'}>
            {isValid ? 'Ready to save' : 'Missing optional details'}
          </Badge>
        </Group>

        <ReviewProblemsField />
        <ReviewScoreField />
        <ReviewNotesField
          currentTimestamp={props.currentTimestamp}
          isTimerRunning={props.isTimerRunning}
          isFloatingEnabled={props.isFeedbackFloating}
          onResetTimer={props.onResetTimer}
          onToggleFloating={props.onToggleFeedbackFloating}
          onToggleTimer={props.onToggleTimer}
        />
      </Stack>
    </Paper>
  )
}