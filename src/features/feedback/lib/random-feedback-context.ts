type PublicFeedbackContextInput = {
  candidateName: string
  roleLabel: string
  interviewerName: string
  interviewLoopLabel: string
}

const people = [
  'Jorge Adrian Perez Dominguez',
  'Ismael Alvarez Rodriguez',
  'Ariana J.',
  'Luis Castillo',
  'Miguel Angel',
  'Paloma Fernandez',
  'Carlos Roberto',
  'Josue Guzman',
  'Brian Flores',
  'Sebastian Ponce',
]
const roleLabels = ['Backend Engineer', 'Frontend Engineer', 'Full Stack Engineer', 'Platform Engineer', 'Data Engineer']
const interviewLoops = ['Technical Interview', 'Behavioral + Technical', 'Coding Round', 'Systems Design', 'Problem Solving']

function pickOne<T>(values: T[]) {
  return values[Math.floor(Math.random() * values.length)]
}

function pickDifferent(values: string[], selected: string) {
  const filteredValues = values.filter((value) => value !== selected)

  return pickOne(filteredValues)
}

export function createRandomFeedbackContext(): PublicFeedbackContextInput {
  const candidateName = pickOne(people)

  return {
    candidateName,
    roleLabel: pickOne(roleLabels),
    interviewerName: pickDifferent(people, candidateName),
    interviewLoopLabel: pickOne(interviewLoops),
  }
}