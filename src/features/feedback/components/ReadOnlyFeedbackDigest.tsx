import { ExternalLink, FileText, Copy } from 'lucide-react'
import { Badge, Box, Button, Container, Paper, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core'
import { useMemo, useState } from 'react'
import { buildOverallRead, scoreLabel } from '../../interview-review-studio/lib/review-summary'
import type { FeedbackDetailDto } from '../types'

function buildDigestTitle(candidateName?: string | null) {
  const normalizedCandidateName = candidateName?.trim()

  if (!normalizedCandidateName) {
    return 'Feedback Review'
  }

  return `${normalizedCandidateName} - Feedback Review`
}

function mapDecisionLabel(decision: FeedbackDetailDto['decision']) {
  if (decision === 'UNDECIDED') {
    return 'UNDETERMINED'
  }

  if (decision === 'STRONG_HIRE') {
    return 'STRONGLY_HIRE'
  }

  return decision
}

type ReadOnlyFeedbackDigestProps = {
  feedback: FeedbackDetailDto
}

export function ReadOnlyFeedbackDigest(props: ReadOnlyFeedbackDigestProps) {
  const { feedback } = props
  const normalizedDecision = mapDecisionLabel(feedback.decision)
  const digestTitle = buildDigestTitle(feedback.context.candidateName)
  const sortedReferences = [...feedback.references].sort((left, right) => {
    if (left.type === right.type) {
      return left.order - right.order
    }

    return left.type === 'link' ? -1 : 1
  })

  const [copied, setCopied] = useState(false)

  const copyAllText = useMemo(() => {
    const lines: string[] = []

    lines.push(digestTitle)
    lines.push('')
    lines.push('Candidate: ' + (feedback.context.candidateName ?? 'N/A'))
    lines.push('Role: ' + (feedback.context.roleLabel ?? 'N/A'))
    lines.push('Loop: ' + (feedback.context.interviewLoopLabel ?? 'N/A'))
    lines.push('Date: ' + (feedback.context.dateLabel ?? 'N/A'))

    lines.push('')
    lines.push('Overall: ' + (feedback.summary.overallRead || buildOverallRead(normalizedDecision)))
    lines.push('Decision: ' + normalizedDecision)

    if (feedback.notesLines.length > 0) {
      lines.push('')
      lines.push('Notes:')
      feedback.notesLines.forEach((line) => {
        lines.push(`${line.timestamp ?? '--:--'}: ${line.raw}`)
      })
    }

    if (feedback.references.length > 0) {
      lines.push('')
      lines.push('References / Statements:')
      sortedReferences.forEach((reference) => {
        const prefix = reference.type === 'link' ? 'Link' : 'Statement'
        lines.push(`${prefix}: ${reference.label}`)
      })
    }

    return lines.join('\n')
  }, [feedback, digestTitle, normalizedDecision, sortedReferences])

  async function handleCopyAll() {
    await window.navigator.clipboard.writeText(copyAllText)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="irs-shell">
      <Container size="lg" className="irs-container">
        <Stack gap="xl">
          <Paper className="irs-panel" radius={32} p={{ base: 'lg', md: 'xl' }}>
            <Stack gap="md">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <Text size="sm" c="dimmed">Feedback digest</Text>
                  <Title order={2}>{digestTitle}</Title>
                </div>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={handleCopyAll}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Copy size={14} />
                    {copied ? 'Copied' : 'Copy feedback'}
                  </span>
                </Button>
              </div>

              <Stack gap="xs">
                <Text size="sm" c="dimmed">Candidate</Text>
                <Text fw={700} fz="xl">{feedback.context.candidateName || 'Candidate'}</Text>
                <Text c="dimmed">{feedback.context.roleLabel || 'Role not provided'}</Text>
                <SimpleGrid cols={2} spacing="sm" mt="sm">
                  <Badge radius="xl" variant="light" color="gray">{feedback.context.interviewLoopLabel || 'General feedback'}</Badge>
                  <Badge radius="xl" variant="light" color="gray">{feedback.context.dateLabel || 'Open draft'}</Badge>
                </SimpleGrid>
              </Stack>
            </Stack>
          </Paper>

          <Paper className="irs-panel irs-preview" radius={32} p={{ base: 'lg', md: 'xl' }}>
            <Stack gap="lg">
              <SimpleGrid cols={2} spacing="md">
                <Box className="irs-mini-stat">
                  <Text size="xs" tt="uppercase" c="dimmed">References</Text>
                  <Text fw={700}>{feedback.summary.referencesCount}</Text>
                </Box>
                <Box className="irs-mini-stat">
                  <Text size="xs" tt="uppercase" c="dimmed">Statements</Text>
                  <Text fw={700}>{feedback.summary.statementsCount}</Text>
                </Box>
              </SimpleGrid>

              <Paper className="irs-digest-card" radius={24} p="lg">
                <Stack gap={8}>
                  <Text size="sm" c="dimmed">Overall read</Text>
                  <Text fw={700} fz="lg">{scoreLabel(normalizedDecision)}</Text>
                  <Text c="dimmed" size="sm">{feedback.summary.overallRead || buildOverallRead(normalizedDecision)}</Text>
                </Stack>
              </Paper>

              <ScrollArea h={310} offsetScrollbars>
                <Stack gap="sm">
                  {feedback.notesLines.map((line) => (
                    <div key={line.id} className="irs-digest-line">
                      <div className="irs-digest-meta">
                        <span className={`irs-time-pill irs-time-pill-${line.marker}`}>
                          {line.timestamp ?? '--:--'}
                        </span>
                      </div>
                      <Text size="sm" className="irs-text-wrap">{line.raw}</Text>
                    </div>
                  ))}
                  {feedback.notesLines.length === 0 ? <Text c="dimmed" size="sm">No notes yet.</Text> : null}
                </Stack>
              </ScrollArea>

              <Stack gap="xs">
                <Text fw={600}>References and statements</Text>
                {sortedReferences.map((reference) => (
                  <div key={reference.id} className={`irs-reference-row ${reference.type === 'statement' ? 'irs-reference-row-statement' : ''}`}>
                    <ThemeIcon radius="xl" size={28} variant="light" color={reference.type === 'link' ? 'blue' : 'grape'}>
                      {reference.type === 'link' ? <ExternalLink size={14} /> : <FileText size={14} />}
                    </ThemeIcon>
                    <div className="irs-reference-copy">
                      <Text size="xs" c="dimmed">{reference.type === 'link' ? 'Reference link' : 'Custom statement'}</Text>
                      <div className={`irs-reference-body ${reference.type === 'statement' ? 'irs-reference-body-statement' : 'irs-text-wrap'}`}>
                        {reference.label}
                      </div>
                    </div>
                  </div>
                ))}
                {feedback.references.length === 0 ? <Text c="dimmed" size="sm">No references or statements yet.</Text> : null}
              </Stack>
            </Stack>
          </Paper>
        </Stack>
      </Container>
    </div>
  )
}