import { useState } from 'react'
import { Check, ExternalLink, FileText, Pencil, X } from 'lucide-react'
import { Box, Button, Divider, Group, Paper, ScrollArea, SimpleGrid, Stack, Text, Textarea, ThemeIcon, Title } from '@mantine/core'
import { useController } from 'react-hook-form'
import { useReviewDerivedState } from '../hooks/useReviewDerivedState'
import { detectProblemType, normalizeProblemLabel } from '../lib/review-parsers'
import { buildOverallRead, problemTypeTone, scoreLabel } from '../lib/review-summary'
import { REVIEW_LIMITS } from '../review-limits'
import type { InterviewReviewFormValues } from '../schema'
import type { ReviewProblem } from '../types'

type ReviewDigestPanelProps = {
  viewLink?: {
    copied: boolean
    onCopy: () => Promise<void>
  } | null
}

export function ReviewDigestPanel(props: ReviewDigestPanelProps) {
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const { field } = useController<InterviewReviewFormValues, 'problems'>({
    name: 'problems',
    defaultValue: [],
  })
  const fieldProblems = field.value ?? []
  const { feedbackLines, problems, referenceCount, score, statementCount } = useReviewDerivedState()
  const sortedProblems = [...problems].sort((left, right) => {
    if (left.type === right.type) {
      return 0
    }

    return left.type === 'link' ? -1 : 1
  })

  function sentimentTone(sentiment: typeof feedbackLines[number]['sentiment']) {
    if (sentiment === 'positive') {
      return 'positive'
    }

    if (sentiment === 'negative') {
      return 'negative'
    }

    return 'neutral'
  }

  function startEditing(problem: ReviewProblem) {
    setEditingProblemId(problem.id)
    setEditingValue(problem.label)
  }

  function cancelEditing() {
    setEditingProblemId(null)
    setEditingValue('')
  }

  function saveEditing() {
    if (!editingProblemId) {
      return
    }

    const normalized = normalizeProblemLabel(editingValue)

    if (!normalized) {
      cancelEditing()
      return
    }

    field.onChange(
      fieldProblems.map((item: ReviewProblem) => (item.id === editingProblemId
        ? {
            ...item,
            label: normalized,
            type: detectProblemType(normalized),
          }
        : item)),
    )
    cancelEditing()
  }

  return (
    <Paper className="irs-panel irs-preview" radius={32} p={{ base: 'lg', md: 'xl' }}>
      <Stack gap="lg">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Feedback digest
            </Text>
            <Title order={3}>What this feedback is saying</Title>
          </div>
          <Group gap="xs">
            {props.viewLink ? (
              <Button
                radius="xl"
                size="compact-md"
                variant="default"
                color={props.viewLink.copied ? 'teal' : 'gray'}
                leftSection={props.viewLink.copied ? <Check size={14} /> : <ExternalLink size={14} />}
                onClick={props.viewLink.onCopy}
              >
                {props.viewLink.copied ? 'Feedback link copied' : 'Copy feedback link'}
              </Button>
            ) : null}
            {null}
          </Group>
        </Group>

        <SimpleGrid cols={2} spacing="md">
          <Box className="irs-mini-stat">
            <Text size="xs" tt="uppercase" c="dimmed">
              References
            </Text>
            <Text fw={700}>{referenceCount}</Text>
          </Box>
          <Box className="irs-mini-stat">
            <Text size="xs" tt="uppercase" c="dimmed">
              Statements
            </Text>
            <Text fw={700}>{statementCount}</Text>
          </Box>
        </SimpleGrid>

        <Paper className="irs-digest-card" radius={24} p="lg">
          <Stack gap={8}>
            <Text size="sm" c="dimmed">Overall read</Text>
            <Text fw={700} fz="lg">{scoreLabel(score)}</Text>
            <Text c="dimmed" size="sm">
              {buildOverallRead(score)}
            </Text>
          </Stack>
        </Paper>

        <ScrollArea h={310} offsetScrollbars>
          <Stack gap="sm">
            {feedbackLines.map((line) => (
              <div key={line.id} className="irs-digest-line">
                <div className="irs-digest-meta">
                  <span className={`irs-time-pill irs-time-pill-${sentimentTone(line.sentiment)}`}>
                    {line.timestamp ?? '--:--'}
                  </span>
                </div>
                <Text size="sm" className="irs-text-wrap">{line.raw}</Text>
              </div>
            ))}
          </Stack>
        </ScrollArea>

        <Divider color="rgba(255,255,255,0.08)" />

        <Stack gap="xs">
          <Text fw={600}>References and statements</Text>
          {sortedProblems.map((problem) => (
            <div key={problem.id} className={`irs-reference-row ${problem.type === 'statement' ? 'irs-reference-row-statement' : ''}`}>
              <ThemeIcon radius="xl" size={28} variant="light" color={problemTypeTone(problem)}>
                {problem.type === 'link' ? <ExternalLink size={14} /> : <FileText size={14} />}
              </ThemeIcon>
              <div className="irs-reference-copy">
                {editingProblemId === problem.id ? (
                  <div className="irs-problem-pill-editor">
                    <Textarea
                      aria-label={`Edit ${problem.type === 'link' ? 'reference' : 'statement'}`}
                      autosize
                      minRows={problem.type === 'statement' ? 4 : 2}
                      maxRows={12}
                      maxLength={REVIEW_LIMITS.maxProblemLength}
                      value={editingValue}
                      onChange={(event) => setEditingValue(event.currentTarget.value)}
                      onKeyDown={(event) => {
                        if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                          event.preventDefault()
                          saveEditing()
                        }

                        if (event.key === 'Escape') {
                          event.preventDefault()
                          cancelEditing()
                        }
                      }}
                    />
                    <Group justify="space-between" gap="xs" className="irs-problem-pill-editor-actions">
                      <Text size="xs" c="dimmed">Ctrl/Cmd + Enter to save</Text>
                      <Group gap="xs">
                        <Button
                          type="button"
                          radius="xl"
                          size="compact-sm"
                          variant="subtle"
                          color="gray"
                          leftSection={<X size={14} />}
                          onClick={cancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          radius="xl"
                          size="compact-sm"
                          variant="light"
                          color="amber"
                          leftSection={<Check size={14} />}
                          onClick={saveEditing}
                        >
                          Save
                        </Button>
                      </Group>
                    </Group>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="irs-problem-pill-trigger"
                      aria-label={`Edit ${problem.type === 'link' ? 'reference' : 'statement'} ${problem.label}`}
                      onClick={() => startEditing(problem)}
                    >
                      <Text size="xs" c="dimmed">{problem.type === 'link' ? 'Reference link' : 'Custom statement'}</Text>
                      <div className={`irs-reference-body ${problem.type === 'statement' ? 'irs-reference-body-statement' : 'irs-text-wrap'}`}>
                        {problem.label}
                      </div>
                    </button>
                    <Group gap="xs" mt={6}>
                      <Button
                        type="button"
                        radius="xl"
                        size="compact-xs"
                        variant="subtle"
                        color="gray"
                        leftSection={<Pencil size={12} />}
                        onClick={() => startEditing(problem)}
                      >
                        Edit
                      </Button>
                    </Group>
                  </>
                )}
              </div>
            </div>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}