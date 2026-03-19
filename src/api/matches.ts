import { apiFetch } from './client'

import type { PublicProfiles } from './users'

export interface MatchPartner {
  _id: string
  nombre: string
  bio?: string
  cvPath?: string
  publicProfiles?: PublicProfiles
}

export interface MatchFeedbackLink {
  feedbackId: string
  path: string
  canEdit: boolean
}

export interface MatchLivecodeLink {
  roomId: string
  path: string
}

export interface MyMatchResponse {
  totalMocks: number
  matchId?: string
  enlaceReunion?: string
  partner?: MatchPartner
  matches: Array<{
    matchId: string
    enlaceReunion?: string
    partner: MatchPartner
    feedbackAsInterviewer?: MatchFeedbackLink | null
    feedbackAsInterviewee?: MatchFeedbackLink | null
    livecodeOwn?: MatchLivecodeLink | null
    livecodePartner?: MatchLivecodeLink | null
  }>
}

export interface SessionMatch {
  matchId: string
  source: 'manual' | 'shuffle'
  estado: string
  algoritmoShuffle: string
  enlaceReunion?: string
  registration1?: string
  registration2?: string
  user1: { _id: string; nombre: string; email: string }
  user2: { _id: string; nombre: string; email: string }
  feedbackAssignments?: Array<{
    reviewerUserId: string
    subjectUserId: string
    feedbackId: string
    path: string
  }>
}

export interface SessionMatchOverviewResponse {
  sessionId: string
  titulo: string
  fechaProgramada: string
  estado: string
  view: 'all' | 'matched' | 'unmatched'
  source: 'all' | 'manual' | 'shuffle'
  totalRegistrosActivos: number
  totalPersonasRegistradas: number
  totalMatchesActivos: number
  totalMocksEmparejadas: number
  totalMocksPendientes: number
  matches?: SessionMatch[]
  unmatched?: Array<{
    registrationId: string
    slotNumber: number
    estado: string
    user: {
      _id: string
      nombre: string
      email: string
      bio?: string
      cvPath?: string
      rol?: 'user' | 'admin'
    }
  }>
}

export interface PublishShuffleResponse {
  mensaje: string
  totalPares: number
  nuevosPares: number
  totalPendientes: number
  totalFeedbackLinksGenerados: number
}

export function getMyMatch(sessionId: string): Promise<MyMatchResponse> {
  return apiFetch<MyMatchResponse>(`/matches/session/${sessionId}/my-match`)
}

export function getSessionMatches(sessionId: string): Promise<SessionMatchOverviewResponse> {
  return apiFetch<SessionMatchOverviewResponse>(`/matches/session/${sessionId}`)
}

export function createManualMatch(sessionId: string, registrationId1: string, registrationId2: string): Promise<{ mensaje: string }> {
  return apiFetch<{ mensaje: string }>(`/matches/session/${sessionId}/manual`, {
    method: 'POST',
    body: JSON.stringify({ registrationId1, registrationId2 }),
  })
}

export function removeManualMatch(sessionId: string, matchId: string): Promise<{ mensaje: string }> {
  return apiFetch<{ mensaje: string }>(`/matches/session/${sessionId}/manual/${matchId}`, {
    method: 'DELETE',
  })
}

export function publishShuffle(sessionId: string): Promise<PublishShuffleResponse> {
  return apiFetch<PublishShuffleResponse>(`/matches/session/${sessionId}/shuffle`, {
    method: 'POST',
  })
}
