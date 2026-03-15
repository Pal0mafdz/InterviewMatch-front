import { apiFetch } from './client'

export interface MatchPartner {
  _id: string
  nombre: string
  email: string
  bio?: string
  cvPath?: string
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
  }>
}

export interface SessionMatch {
  usuario1: { nombre: string; email: string }
  usuario2: { nombre: string; email: string }
  slot: number
}

export function getMyMatch(sessionId: string): Promise<MyMatchResponse> {
  return apiFetch<MyMatchResponse>(`/matches/session/${sessionId}/my-match`)
}

export function getSessionMatches(sessionId: string): Promise<SessionMatch[]> {
  return apiFetch<SessionMatch[]>(`/matches/session/${sessionId}`)
}

export function publishShuffle(sessionId: string): Promise<{ mensaje: string; pares: number; pendientes: number }> {
  return apiFetch(`/matches/session/${sessionId}/shuffle`, {
    method: 'POST',
  })
}
