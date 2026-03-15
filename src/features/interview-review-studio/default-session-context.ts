export type SessionContext = {
  candidate: string
  role: string
  interviewer: string
  interviewLoop: string
  dateLabel: string
}

export const defaultSessionContext: SessionContext = {
  candidate: 'Alfredo Palacios',
  role: 'Software Engineer',
  interviewer: 'Sebastian Ponce',
  interviewLoop: 'Behavioral + Technical',
  dateLabel: 'Mar 14, 2026',
}

export function resolveSessionContext(sessionContext?: Partial<SessionContext>): SessionContext {
  return {
    ...defaultSessionContext,
    ...sessionContext,
  }
}

export const sessionContext = resolveSessionContext()