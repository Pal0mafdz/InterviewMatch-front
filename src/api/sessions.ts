import { apiFetch } from './client'

export interface Session {
  _id: string
  titulo: string
  fechaProgramada: string
  estado: 'abierta' | 'publicada' | 'finalizada' | 'cancelada'
  descripcion?: string
  inscripciones?: Array<{
    usuario: string | { _id: string; nombre?: string; email?: string; cvPath?: string; bio?: string; linkReunion?: string }
    mockCount: number
  }>
}

export function getSessions(): Promise<Session[]> {
  return apiFetch<Session[]>('/sessions')
}

export function getSession(id: string): Promise<Session> {
  return apiFetch<Session>(`/sessions/${id}`)
}

export function registerForSession(id: string, mockCount: 1 | 2 | 3): Promise<{ mensaje: string }> {
  return apiFetch(`/sessions/${id}/register`, {
    method: 'POST',
    body: JSON.stringify({ mockCount }),
  })
}

export function cancelRegistration(id: string): Promise<{ mensaje: string }> {
  return apiFetch(`/sessions/${id}/register?all=true`, {
    method: 'DELETE',
  })
}

export function createSession(data: { titulo: string; fechaProgramada: string; descripcion?: string }): Promise<Session> {
  return apiFetch<Session>('/sessions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
