// ─── Shared types for livecode feature ───

export type SupportedLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp'

export type ParticipantRole = 'interviewer' | 'candidate' | 'observer'

export interface CursorPosition {
  lineNumber: number
  column: number
}

export interface SelectionRange {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

export interface ParticipantPresence {
  participantId: string
  clientId: string
  userId?: string | null
  displayName: string
  color: string
  role: ParticipantRole
  connected: boolean
  cursorPosition?: CursorPosition
  selectionRange?: SelectionRange
}

export interface RoomState {
  roomId: string
  title: string
  language: SupportedLanguage
  code: string
  participants: ParticipantPresence[]
}

export interface RoomJoinPayload {
  roomId: string
  clientId: string
  displayName: string
  role?: ParticipantRole
  userId?: string | null
}

export interface EditorUpdatedPayload {
  code: string
  clientId: string
}

export interface LanguageChangedPayload {
  language: SupportedLanguage
  clientId: string
}

export interface CursorEventPayload {
  participantId: string
  clientId: string
  cursorPosition: CursorPosition
}

export interface SelectionEventPayload {
  participantId: string
  clientId: string
  selectionRange: SelectionRange
}

export interface RoomSummary {
  roomId: string
  title: string
  language: SupportedLanguage
  createdAt: string
  lastActivityAt: string
}

export interface EditorSettings {
  tabSize: number
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  showRemoteLabels: boolean
  showRemoteCursors: boolean
}
