import { Check } from 'lucide-react'
import { Card, Group, SimpleGrid, Stack, Text } from '@mantine/core'
import { motion } from 'framer-motion'
import { useController } from 'react-hook-form'
import { reviewScoreOptions } from '../types'
import type { InterviewReviewFormValues } from '../schema'

const MotionDiv = motion.create('div')

function compactScoreTitle(value: InterviewReviewFormValues['score']) {
  if (value === 'STRONGLY_HIRE') {
    return 'Strong Hire'
  }

  return reviewScoreOptions.find((option) => option.value === value)?.label ?? ''
}

export function ReviewScoreField() {
  const { field, fieldState } = useController<InterviewReviewFormValues, 'score'>({
    name: 'score',
    defaultValue: null,
  })

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <div>
          <Text fw={600}>Final decision</Text>
          <Text size="sm" c="dimmed">
            Pick a decision when you have enough signal. Leave it empty if the feedback is still in progress.
          </Text>
        </div>
        {fieldState.error ? (
          <Text size="sm" c="#ff8787">
            {fieldState.error.message}
          </Text>
        ) : null}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, xl: 4 }} spacing="md" className="irs-score-grid">
        {reviewScoreOptions.map((option, index) => {
          const active = field.value === option.value

          return (
            <MotionDiv
              key={option.value}
              className="irs-score-grid-item"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              onClick={() => field.onChange(option.value)}
            >
              <Card
                className={`irs-panel irs-score-card ${active ? 'irs-score-card-active' : ''}`}
                radius={24}
                p="md"
                style={{
                  cursor: 'pointer',
                  borderColor: active ? option.tone : 'rgba(255, 255, 255, 0.08)',
                  background: active
                    ? `linear-gradient(180deg, ${option.tone}22, rgba(21, 26, 35, 0.92))`
                    : undefined,
                }}
              >
                <Stack className="irs-score-card-layout" gap="md" h="100%">
                  <Group justify="space-between" align="center" className="irs-score-card-toprow">
                    <span className="irs-score-dot" style={{ backgroundColor: option.tone }} aria-hidden="true" />
                    {active ? <Check size={18} color={option.tone} /> : null}
                  </Group>
                  <div className="irs-score-card-copy">
                    <Text fw={700} className="irs-score-card-title">
                      {compactScoreTitle(option.value)}
                    </Text>
                    <Text size="sm" c="dimmed" className="irs-score-card-description">
                      {option.description}
                    </Text>
                  </div>
                </Stack>
              </Card>
            </MotionDiv>
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}