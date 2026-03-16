export type SessionContext = {
  candidate: string
  role: string
  interviewer: string
  interviewLoop: string
  dateLabel: string
}

const defaultDateLabel = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}).format(new Date())

export const defaultSessionContext: SessionContext = {
  candidate: 'Alfredo Palacios',
  role: 'Software Engineer',
  interviewer: 'Sebastian Ponce',
  interviewLoop: 'Behavioral + Technical',
  dateLabel: defaultDateLabel,
}

export function resolveSessionContext(sessionContext?: Partial<SessionContext>): SessionContext {
  return {
    ...defaultSessionContext,
    ...sessionContext,
  }
}

export const sessionContext = resolveSessionContext()