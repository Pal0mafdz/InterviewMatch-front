import type { PublicProfiles } from './users'
import { apiFetch } from './client'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export interface ChatUserSummary {
  _id: string
  nombre: string
  cvPath?: string
  bio?: string
  publicProfiles?: PublicProfiles
}

export interface ChatThreadPreview {
  threadId: string
  participant: ChatUserSummary
  lastMessageAt: string | null
  lastMessage: {
    messageId: string
    type: 'text' | 'proposal' | 'proposal-accepted'
    texto?: string
    createdAt: string
  } | null
}

export interface ChatProposal {
  proposedDateTime: string
  meetingLink?: string
  durationMinutes: number
  status: 'pending' | 'accepted'
  acceptedAt: string | null
  acceptedBy?: ChatUserSummary | string | null
}

export interface ChatProposalAccepted {
  proposalMessageId: string
  meetingLink?: string
  proposedDateTime: string
  durationMinutes: number
  acceptedBy?: ChatUserSummary | string | null
}

export interface ChatMessage {
  messageId: string
  threadId: string
  sender: ChatUserSummary | string
  type: 'text' | 'proposal' | 'proposal-accepted'
  texto?: string
  proposal?: ChatProposal
  proposalAccepted?: ChatProposalAccepted
  createdAt: string
}

export interface ThreadMessagesResponse {
  thread: ChatThreadPreview
  count: number
  messages: ChatMessage[]
}

export interface ProposalAcceptResponse {
  proposal: ChatMessage
  acceptanceMessage: ChatMessage
}

export interface ChatThreadContext {
  threadId: string
  meetingLink: string | null
  feedbackPath: string | null
  feedbackUrl: string | null
  sessionId: string | null
  sessionTitle: string | null
  sessionDate: string | null
  detailsPath: string | null
  detailsUrl: string | null
}

export interface TypingStatusResponse {
  threadId: string
  isTyping: boolean
}

export function listMyThreads(): Promise<{ count: number; threads: ChatThreadPreview[] }> {
  return apiFetch('/chats/threads')
}

export function getThreadByPartner(userId: string): Promise<ChatThreadPreview> {
  return apiFetch(`/chats/threads/with/${encodeURIComponent(userId)}`)
}

export function getThreadMessages(threadId: string, params?: { limit?: number; before?: string }): Promise<ThreadMessagesResponse> {
  const query = new URLSearchParams()

  if (params?.limit) {
    query.set('limit', String(params.limit))
  }

  if (params?.before) {
    query.set('before', params.before)
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/messages${suffix}`)
}

export function getThreadContext(threadId: string): Promise<ChatThreadContext> {
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/context`)
}

export function setThreadMeetingLink(threadId: string, meetingLink: string): Promise<{ threadId: string; meetingLink: string }> {
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/meeting-link`, {
    method: 'PUT',
    body: JSON.stringify({ meetingLink })
  })
}

export function sendThreadTextMessage(threadId: string, texto: string): Promise<ChatMessage> {
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/messages`, {
    method: 'POST',
    body: JSON.stringify({ texto })
  })
}

export function setThreadTypingStatus(threadId: string, isTyping: boolean): Promise<TypingStatusResponse> {
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/typing`, {
    method: 'POST',
    body: JSON.stringify({ isTyping })
  })
}

export function sendThreadProposal(threadId: string, fechaHora: string, duracionMinutos: number): Promise<ChatMessage> {
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/proposals`, {
    method: 'POST',
    body: JSON.stringify({ fechaHora, duracionMinutos })
  })
}

export function acceptThreadProposal(threadId: string, proposalId: string): Promise<ProposalAcceptResponse> {
  return apiFetch(`/chats/threads/${encodeURIComponent(threadId)}/proposals/${encodeURIComponent(proposalId)}/accept`, {
    method: 'POST'
  })
}

export async function downloadProposalCalendar(threadId: string, proposalId: string): Promise<{ blob: Blob; fileName: string }> {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {}

  if (token) {
    (headers as Record<string, string>).Authorization = `Bearer ${token}`
  }

  const response = await fetch(
    `${API_BASE_URL}/chats/threads/${encodeURIComponent(threadId)}/proposals/${encodeURIComponent(proposalId)}/calendar.ics`,
    { headers }
  )

  if (!response.ok) {
    const fallback = await response.text().catch(() => 'No se pudo descargar el calendario')
    throw new Error(fallback || 'No se pudo descargar el calendario')
  }

  const blob = await response.blob()
  const contentDisposition = response.headers.get('content-disposition') || ''
  const fileNameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  const fileName = fileNameMatch?.[1] || 'evento.ics'

  return { blob, fileName }
}

export function createThreadEventSource(threadId: string, options?: { since?: string }): EventSource {
  const token = localStorage.getItem('token')
  const query = new URLSearchParams()

  if (token) {
    query.set('token', token)
  }

  if (options?.since) {
    query.set('since', options.since)
  }

  const suffix = query.toString() ? `?${query.toString()}` : ''
  return new EventSource(`${API_BASE_URL}/chats/threads/${encodeURIComponent(threadId)}/stream${suffix}`)
}
