export type ReviewScore = 'NO_HIRE' | 'UNDETERMINED' | 'HIRE' | 'STRONGLY_HIRE'

export type ReviewProblemType = 'link' | 'statement'

export type ReviewProblem = {
  id: string
  label: string
  type: ReviewProblemType
}

export type ReviewFeedbackLine = {
  id: string
  marker?: '+' | '-' | '/'
  timestamp?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  raw: string
}

export type ReviewScoreOption = {
  value: ReviewScore
  label: string
  tone: string
  description: string
}

export const reviewScoreOptions: ReviewScoreOption[] = [
  {
    value: 'NO_HIRE',
    label: 'No Hire',
    tone: '#ff6b6b',
    description: 'Strong concerns or repeated gaps in communication, execution or judgment.',
  },
  {
    value: 'UNDETERMINED',
    label: 'Undetermined',
    tone: '#7dc4ff',
    description: 'Insufficient signal or mixed evidence that needs another loop.',
  },
  {
    value: 'HIRE',
    label: 'Hire',
    tone: '#ffbe5c',
    description: 'Solid interview with enough evidence to move forward confidently.',
  },
  {
    value: 'STRONGLY_HIRE',
    label: 'Strongly Hire',
    tone: '#6ee7b7',
    description: 'Clear positive signal with strong communication, depth and ownership.',
  },
]