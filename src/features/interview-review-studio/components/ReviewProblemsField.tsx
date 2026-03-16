import { useState } from 'react'
import { AlertCircle, Check, ExternalLink, FileText, Pencil, X } from 'lucide-react'
import { Badge, Button, Group, Stack, Text, Textarea, ThemeIcon } from '@mantine/core'
import { motion } from 'framer-motion'
import { useController } from 'react-hook-form'
import { detectProblemType, mergeProblems, normalizeProblemLabel, parseQuickProblems } from '../lib/review-parsers'
import { REVIEW_LIMITS } from '../review-limits'
import { problemTypeTone } from '../lib/review-summary'
import type { InterviewReviewFormValues } from '../schema'
import type { ReviewProblem } from '../types'

const MotionDiv = motion.create('div')

export function ReviewProblemsField() {
  const [problemInput, setProblemInput] = useState('')
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState('')
  const { field, fieldState } = useController<InterviewReviewFormValues, 'problems'>({
    name: 'problems',
    defaultValue: [],
  })
  const problems = field.value ?? []
  const problemLimitReached = problems.length >= REVIEW_LIMITS.maxProblems

  function commitInput() {
    if (problemLimitReached) {
      return
    }

    const tokens = parseQuickProblems(problemInput)

    if (tokens.length === 0) {
      return
    }

    field.onChange(mergeProblems(problems, tokens))
    setProblemInput('')
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
      problems.map((item: ReviewProblem) => (item.id === editingProblemId
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
    <Stack gap="xs">
      <Group justify="space-between" align="flex-end">
        <div>
          <Text fw={600}>References and custom statements</Text>
          <Text size="sm" c="dimmed">
            Add links to problems or resources, or write a short statement describing the problem, like "Missed rollback strategy" or "Codeforces two pointers problem". Multi-line paste stays together unless it is clearly a list or a set of links. Press Enter to add, then click any item to edit it.
          </Text>
        </div>
        <Badge radius="xl" variant="light" color={problemLimitReached ? 'red' : 'amber'}>
          {problems.length}/{REVIEW_LIMITS.maxProblems} items
        </Badge>
      </Group>

      <div className="irs-problem-input">
        {problems.map((problem: ReviewProblem) => (
          <MotionDiv
            key={problem.id}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`irs-problem-pill ${problem.type === 'statement' ? 'irs-problem-pill-statement' : 'irs-problem-pill-link'}`}
          >
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
                  <div className="irs-problem-pill-main">
                    <ThemeIcon radius="xl" size={20} variant="light" color={problemTypeTone(problem)}>
                      {problem.type === 'link' ? <ExternalLink size={12} /> : <FileText size={12} />}
                    </ThemeIcon>
                    <div className="irs-problem-pill-copy">
                      <span className="irs-problem-pill-kind">{problem.type === 'link' ? 'Reference' : 'Statement'}</span>
                      <span className="irs-problem-pill-text">{problem.label}</span>
                    </div>
                  </div>
                </button>
                <div className="irs-problem-pill-actions">
                  <button
                    type="button"
                    className="irs-problem-pill-icon-button"
                    aria-label={`Edit ${problem.label}`}
                    onClick={() => startEditing(problem)}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    className="irs-problem-pill-remove"
                    aria-label={`Remove ${problem.label}`}
                    onClick={() => field.onChange(problems.filter((item: ReviewProblem) => item.id !== problem.id))}
                  >
                    ×
                  </button>
                </div>
              </>
            )}
          </MotionDiv>
        ))}
        <input
          aria-label="Add references or custom statements"
          disabled={problemLimitReached}
          maxLength={REVIEW_LIMITS.maxProblemLength}
          value={problemInput}
          onChange={(event) => setProblemInput(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitInput()
            }

            if (event.key === 'Backspace' && problemInput.length === 0 && problems.length > 0) {
              field.onChange(problems.slice(0, -1))
            }
          }}
          onPaste={(event) => {
            const pastedText = event.clipboardData.getData('text')

            if (!pastedText.includes('\n')) {
              return
            }

            event.preventDefault()

            if (problemLimitReached) {
              return
            }

            const tokens = parseQuickProblems(pastedText)

            if (tokens.length === 0) {
              return
            }

            field.onChange(mergeProblems(problems, tokens))
            setProblemInput('')
          }}
          placeholder={problemLimitReached ? `Maximum ${REVIEW_LIMITS.maxProblems} items reached` : 'Paste a link or write a short custom statement'}
        />
      </div>

      <Group gap="xs">
        <Badge radius="xl" variant="light" color="blue">
          Example link: https://leetcode.com/problems/two-sum/
        </Badge>
        <Badge radius="xl" variant="light" color="grape">
          Example statement: "Count the vowels in a String"
        </Badge>
      </Group>

      {fieldState.error ? (
        <Group gap={8} c="#ff8787">
          <AlertCircle size={16} />
          <Text size="sm">{fieldState.error.message}</Text>
        </Group>
      ) : null}
    </Stack>
  )
}