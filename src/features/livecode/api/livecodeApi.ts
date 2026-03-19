import { apiFetch } from '../../../api/client'
import type { RoomState, RoomSummary } from '../types'

export async function createRoom(payload?: {
  title?: string
  language?: string
  roomId?: string
}): Promise<RoomState> {
  return apiFetch<RoomState>('/livecode/rooms', {
    method: 'POST',
    body: JSON.stringify(payload ?? {}),
    auth: true,
  })
}

export async function getRoom(roomId: string): Promise<RoomState> {
  return apiFetch<RoomState>(`/livecode/rooms/${encodeURIComponent(roomId)}`, {
    auth: false,
  })
}

export async function listMyRooms(): Promise<RoomSummary[]> {
  return apiFetch<RoomSummary[]>('/livecode/my-rooms', {
    auth: true,
  })
}
