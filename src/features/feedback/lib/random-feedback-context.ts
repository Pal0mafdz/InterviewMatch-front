type PublicFeedbackContextInput = {
  candidateName: string
  roleLabel: string
  interviewerName: string
  interviewLoopLabel: string
}

const candidateNames = ['Avery Stone', 'Maya Torres', 'Daniel Kim', 'Lucia Vega', 'Noah Bennett']
const interviewerNames = ['Iris Chen', 'Sebastian Ponce', 'Nadia Ruiz', 'Marco Silva', 'Lena Park']
const roleLabels = ['Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Platform Engineer', 'Data Engineer']
const interviewLoops = ['Technical Interview', 'Behavioral + Technical', 'Coding Round', 'Systems Design', 'Problem Solving']
function pickOne<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)]
}

export function createRandomFeedbackContext(): PublicFeedbackContextInput {
  return {
    candidateName: pickOne(candidateNames),
    roleLabel: pickOne(roleLabels),
    interviewerName: pickOne(interviewerNames),
    interviewLoopLabel: pickOne(interviewLoops),
  }
}