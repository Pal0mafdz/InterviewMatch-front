import { useEffect, useMemo, useRef, useState } from 'react'
import { io, type Socket } from 'socket.io-client'
import type {
  CursorPosition,
  CursorEventPayload,
  EditorDeltaPayload,
  EditorUpdatedPayload,
  LanguageChangedPayload,
  RoomState,
  SelectionRange,
  SelectionEventPayload,
  SupportedLanguage,
  TextChange,
} from '../types'
import { starterCode } from '../languages'

interface UseRoomConnectionOptions {
  roomId: string
  displayName: string
  role?: string
  userId?: string | null
  authToken?: string | null
}

const SOCKET_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace('/api', '') || window.location.origin
const REMOTE_SELECTION_TTL = 900

function getClientId(): string {
  const existing = window.sessionStorage.getItem('livecode-client-id')
  if (existing) return existing

  const nextId = window.crypto.randomUUID()
  window.sessionStorage.setItem('livecode-client-id', nextId)
  return nextId
}

function createFallbackRoom(roomId: string, overrides: Partial<RoomState> = {}): RoomState {
  return {
    roomId,
    title: overrides.title ?? `Sala ${roomId}`,
    language: overrides.language ?? 'javascript',
    code: overrides.code ?? starterCode.javascript,
    version: overrides.version ?? 0,
    participants: overrides.participants ?? [],
  }
}

export function useRoomConnection({ roomId, displayName, role, userId, authToken }: UseRoomConnectionOptions) {
  const [state, setState] = useState<RoomState | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const clientIdRef = useRef(getClientId())
  const codeEmitTimeoutRef = useRef<number | null>(null)
  const pendingCodeRef = useRef<string | null>(null)
  const cursorFrameRef = useRef<number | null>(null)
  const selectionFrameRef = useRef<number | null>(null)
  const pendingCursorRef = useRef<CursorPosition | null>(null)
  const pendingSelectionRef = useRef<SelectionRange | null>(null)
  const selectionResetTimersRef = useRef(new Map<string, number>())
  const versionRef = useRef(0)
  const deltaListenersRef = useRef<Set<(payload: EditorDeltaPayload) => void>>(new Set())

  const scheduleSelectionReset = (participantId: string) => {
    const timers = selectionResetTimersRef.current
    const prev = timers.get(participantId)
    if (prev !== undefined) window.clearTimeout(prev)

    const next = window.setTimeout(() => {
      setState((cur) => {
        if (!cur) return cur
        return {
          ...cur,
          participants: cur.participants.map((p) =>
            p.participantId === participantId ? { ...p, selectionRange: undefined } : p,
          ),
        }
      })
      timers.delete(participantId)
    }, REMOTE_SELECTION_TTL)

    timers.set(participantId, next)
  }

  useEffect(() => {
    const nextSocket = io(`${SOCKET_URL}/livecode`, {
      autoConnect: true,
      reconnection: true,
      transports: ['websocket'],
      auth: authToken ? { token: authToken } : undefined,
    })

    setSocket(nextSocket)

    nextSocket.on('connect', () => {
      nextSocket.emit('room:join', {
        roomId,
        displayName,
        clientId: clientIdRef.current,
        userId: userId || null,
        role: role || undefined,
      })
    })

    nextSocket.on('room:state', (roomState: RoomState) => {
      versionRef.current = roomState.version ?? 0
      setState(roomState)
    })

    nextSocket.on('editor:updated', ({ code, version, clientId }: EditorUpdatedPayload) => {
      if (clientId === clientIdRef.current) return
      if (typeof version === 'number') versionRef.current = version
      setState((cur) => (cur ? { ...cur, code, version: version ?? cur.version } : createFallbackRoom(roomId, { code })))
    })

    nextSocket.on('editor:delta', (payload: EditorDeltaPayload) => {
      if (payload.clientId === clientIdRef.current) return
      versionRef.current = payload.version
      // Notify editor to apply remote delta without undo stack pollution
      deltaListenersRef.current.forEach((fn) => fn(payload))
      // Use server's authoritative code for state
      setState((cur) => {
        if (!cur) return cur
        return { ...cur, code: payload.code, version: payload.version }
      })
    })

    nextSocket.on('language:changed', ({ language, clientId }: LanguageChangedPayload) => {
      if (clientId === clientIdRef.current) return
      versionRef.current = (versionRef.current || 0) + 1
      setState((cur) =>
        cur
          ? { ...cur, language, code: starterCode[language], version: versionRef.current }
          : createFallbackRoom(roomId, { language, code: starterCode[language] }),
      )
    })

    nextSocket.on('presence:cursor', ({ participantId, clientId, cursorPosition }: CursorEventPayload) => {
      if (clientId === clientIdRef.current) return
      setState((cur) => {
        if (!cur) return cur
        return {
          ...cur,
          participants: cur.participants.map((p) =>
            p.participantId === participantId ? { ...p, cursorPosition } : p,
          ),
        }
      })
    })

    nextSocket.on('presence:selection', ({ participantId, clientId, selectionRange }: SelectionEventPayload) => {
      if (clientId === clientIdRef.current) return
      setState((cur) => {
        if (!cur) return cur
        return {
          ...cur,
          participants: cur.participants.map((p) =>
            p.participantId === participantId ? { ...p, selectionRange } : p,
          ),
        }
      })
      scheduleSelectionReset(participantId)
    })

    nextSocket.on('connect_error', () => {
      setState((cur) => cur ?? createFallbackRoom(roomId))
    })

    nextSocket.on('disconnect', () => {
      setState((cur) => cur ?? createFallbackRoom(roomId))
    })

    return () => {
      if (codeEmitTimeoutRef.current !== null) window.clearTimeout(codeEmitTimeoutRef.current)
      if (cursorFrameRef.current !== null) window.cancelAnimationFrame(cursorFrameRef.current)
      if (selectionFrameRef.current !== null) window.cancelAnimationFrame(selectionFrameRef.current)
      selectionResetTimersRef.current.forEach((t) => window.clearTimeout(t))
      selectionResetTimersRef.current.clear()
      nextSocket.disconnect()
      setSocket(null)
    }
  }, [displayName, roomId, role, userId, authToken])

  const api = useMemo(
    () => ({
      state,
      clientId: clientIdRef.current,
      setCode: (code: string) => {
        pendingCodeRef.current = code
        if (codeEmitTimeoutRef.current !== null) window.clearTimeout(codeEmitTimeoutRef.current)
        codeEmitTimeoutRef.current = window.setTimeout(() => {
          if (pendingCodeRef.current !== null) {
            socket?.emit('editor:change', { roomId, code: pendingCodeRef.current })
          }
        }, 35)
      },
      applyDelta: (changes: TextChange[]) => {
        socket?.emit('editor:delta', { roomId, changes })
      },
      onRemoteDelta: (fn: (payload: EditorDeltaPayload) => void) => {
        deltaListenersRef.current.add(fn)
        return () => { deltaListenersRef.current.delete(fn) }
      },
      setLanguage: (language: SupportedLanguage) => {
        versionRef.current += 1
        setState((cur) => ({
          ...(cur ?? createFallbackRoom(roomId)),
          language,
          code: starterCode[language],
          version: versionRef.current,
        }))
        socket?.emit('editor:language', { roomId, language })
      },
      setCursor: (cursorPosition: CursorPosition) => {
        pendingCursorRef.current = cursorPosition
        if (cursorFrameRef.current !== null) return
        cursorFrameRef.current = window.requestAnimationFrame(() => {
          cursorFrameRef.current = null
          if (pendingCursorRef.current) {
            socket?.emit('editor:cursor', { roomId, cursorPosition: pendingCursorRef.current })
          }
        })
      },
      setSelection: (selectionRange: SelectionRange) => {
        pendingSelectionRef.current = selectionRange
        if (selectionFrameRef.current !== null) return
        selectionFrameRef.current = window.requestAnimationFrame(() => {
          selectionFrameRef.current = null
          if (pendingSelectionRef.current) {
            socket?.emit('editor:selection', { roomId, selectionRange: pendingSelectionRef.current })
          }
        })
      },
    }),
    [roomId, socket, state],
  )

  return api
}
