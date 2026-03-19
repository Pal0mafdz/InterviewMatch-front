import type { SupportedLanguage } from './types'

export const languageOptions: Array<{ value: SupportedLanguage; label: string }> = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
]

export const starterCode: Record<SupportedLanguage, string> = {
  javascript: `function solve(input) {\n  return input.trim();\n}\n\nconsole.log(solve('hello'));\n`,
  typescript: `type Candidate = {\n  name: string;\n  score: number;\n};\n\nfunction rank(candidate: Candidate): string {\n  return candidate.score > 80 ? 'strong' : 'growing';\n}\n`,
  python: `def solve(items):\n    for item in items:\n        print(item)\n\n\nif __name__ == '__main__':\n    solve(['hello', 'world'])\n`,
  java: `class Solution {\n    public static int solve(int value) {\n        return value * 2;\n    }\n}\n`,
  cpp: `#include <iostream>\nusing namespace std;\n\nint solve(int value) {\n    return value + 1;\n}\n`,
}
