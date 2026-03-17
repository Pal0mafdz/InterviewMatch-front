import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { useAuth } from '../../context/useAuth'
import { STATIC_BASE_URL } from '../../api/constants'
import type { PublicProfiles } from '../../api/users'
import {
  acceptThreadProposal,
  createThreadEventSource,
  downloadProposalCalendar,
  getThreadByPartner,
  getThreadContext,
  getThreadMessages,
  listMyThreads,
  sendThreadProposal,
  setThreadTypingStatus,
  sendThreadTextMessage,
  type ChatMessage,
  type ChatThreadPreview,
  type ChatUserSummary
} from '../../api/chats'
import { formatDate, getLocalTimeZoneLabel, localDateTimeInputToIso } from '../../utils/date'

function asUser(value: ChatUserSummary | string | undefined | null): ChatUserSummary | null {
  if (!value || typeof value === 'string') {
    return null
  }

  return value
}

function getUserId(value: ChatUserSummary | string | undefined | null): string {
  if (!value) {
    return ''
  }

  return typeof value === 'string' ? value : value._id
}

function mergeMessage(current: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  const exists = current.some((message) => message.messageId === incoming.messageId)

  if (exists) {
    return current.map((message) => (message.messageId === incoming.messageId ? incoming : message))
  }

  return [...current, incoming].sort(
    (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
  )
}

function updateThreadPreview(
  threads: ChatThreadPreview[],
  threadId: string,
  message: ChatMessage
): ChatThreadPreview[] {
  return threads
    .map((thread) => {
      if (thread.threadId !== threadId) {
        return thread
      }

      return {
        ...thread,
        lastMessageAt: message.createdAt,
        lastMessage: {
          messageId: message.messageId,
          type: message.type,
          texto: message.texto,
          createdAt: message.createdAt
        }
      }
    })
    .sort((left, right) => {
      const leftAt = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0
      const rightAt = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0
      return rightAt - leftAt
    })
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

const TYPING_IDLE_MS = 1800

function platformLabel(platform: keyof PublicProfiles) {
  return {
    leetcode: 'LeetCode',
    codeforces: 'Codeforces',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  }[platform]
}

function buildCvDownloadName(nombre: string | undefined) {
  return `${nombre || 'Usuario'} - CV.pdf`
}

export function ChatHub() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [threads, setThreads] = useState<ChatThreadPreview[]>([])
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [threadContext, setThreadContext] = useState<{
    meetingLink: string | null
    feedbackUrl: string | null
    sessionId: string | null
    sessionTitle: string | null
    sessionDate: string | null
    detailsPath: string | null
  } | null>(null)

  const [loadingThreads, setLoadingThreads] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [typingLabel, setTypingLabel] = useState<string | null>(null)
  const [isPartnerProfileOpen, setIsPartnerProfileOpen] = useState(false)

  const [texto, setTexto] = useState('')
  const [proposalDateTime, setProposalDateTime] = useState('')
  const [proposalDuration, setProposalDuration] = useState(60)
  const timezoneLabel = getLocalTimeZoneLabel()

  const [isPageVisible, setIsPageVisible] = useState(document.visibilityState === 'visible')
  const lastMessageAtRef = useRef<string | undefined>(undefined)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const typingStopTimerRef = useRef<number | null>(null)
  const typingVisibleTimerRef = useRef<number | null>(null)
  const isTypingRef = useRef(false)

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.threadId === selectedThreadId) || null,
    [threads, selectedThreadId]
  )
  const selectedParticipant = selectedThread?.participant || null
  const selectedParticipantLinks = useMemo(
    () => Object.entries(selectedParticipant?.publicProfiles || {}).filter(
      (entry): entry is [keyof PublicProfiles, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0
    ),
    [selectedParticipant]
  )

  useEffect(() => {
    lastMessageAtRef.current = messages.length > 0 ? messages[messages.length - 1].createdAt : undefined
  }, [messages])

  useEffect(() => {
    if (!selectedThreadId || !messagesContainerRef.current) {
      return
    }

    const container = messagesContainerRef.current
    window.requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight
    })
  }, [messages, selectedThreadId, loadingMessages])

  useEffect(() => {
    const onVisibility = () => setIsPageVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    listMyThreads()
      .then((response) => {
        setThreads(response.threads)
        if (response.threads.length > 0) {
          setSelectedThreadId((current) => current || response.threads[0].threadId)
        }
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'No se pudieron cargar las conversaciones')
      })
      .finally(() => setLoadingThreads(false))
  }, [])

  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId || !user?._id) {
      return
    }

    getThreadByPartner(userId)
      .then((thread) => {
        setThreads((current) => {
          const exists = current.some((item) => item.threadId === thread.threadId)
          if (exists) {
            return current
          }

          return [thread, ...current]
        })

        setSelectedThreadId(thread.threadId)
        const nextParams = new URLSearchParams(searchParams)
        nextParams.delete('userId')
        setSearchParams(nextParams, { replace: true })
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'No se pudo abrir la conversacion')
      })
  }, [searchParams, setSearchParams, user?._id])

  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      setTypingLabel(null)
      setIsPartnerProfileOpen(false)
      isTypingRef.current = false
      return
    }

    setLoadingMessages(true)
    getThreadMessages(selectedThreadId)
      .then((response) => setMessages(response.messages))
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'No se pudo cargar el chat')
      })
      .finally(() => setLoadingMessages(false))

    getThreadContext(selectedThreadId)
      .then((context) => {
        setThreadContext({
          meetingLink: context.meetingLink,
          feedbackUrl: context.feedbackUrl,
          sessionId: context.sessionId,
          sessionTitle: context.sessionTitle,
          sessionDate: context.sessionDate,
          detailsPath: context.detailsPath,
        })
      })
      .catch(() => {
        setThreadContext(null)
      })
  }, [selectedThreadId])

  useEffect(() => {
    return () => {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current)
      }
      if (typingVisibleTimerRef.current) {
        window.clearTimeout(typingVisibleTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!selectedThreadId || !isPageVisible) {
      return
    }

    const lastCreatedAt = lastMessageAtRef.current
    const source = createThreadEventSource(selectedThreadId, { since: lastCreatedAt })

    source.addEventListener('message.created', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as ChatMessage

      setMessages((current) => mergeMessage(current, payload))
      setThreads((current) => updateThreadPreview(current, selectedThreadId, payload))
    })

    source.addEventListener('proposal.accepted', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        proposal: ChatMessage
        acceptanceMessage: ChatMessage
      }

      setMessages((current) => mergeMessage(mergeMessage(current, payload.proposal), payload.acceptanceMessage))
      setThreads((current) => updateThreadPreview(current, selectedThreadId, payload.acceptanceMessage))
    })

    source.addEventListener('typing.updated', (event) => {
      const payload = JSON.parse((event as MessageEvent<string>).data) as {
        userId: string
        isTyping: boolean
        sender?: { nombre?: string }
      }

      if (payload.userId === user?._id) {
        return
      }

      if (typingVisibleTimerRef.current) {
        window.clearTimeout(typingVisibleTimerRef.current)
      }

      if (!payload.isTyping) {
        setTypingLabel(null)
        return
      }

      setTypingLabel(`${payload.sender?.nombre || selectedThread?.participant.nombre || 'Tu pareja'} está escribiendo...`)
      typingVisibleTimerRef.current = window.setTimeout(() => setTypingLabel(null), TYPING_IDLE_MS + 700)
    })

    return () => {
      source.close()
    }
  }, [isPageVisible, selectedThread, selectedThreadId, user?._id])

  async function handleSendText() {
    if (!selectedThreadId || !texto.trim()) {
      return
    }

    setSending(true)
    setError(null)

    try {
      const created = await sendThreadTextMessage(selectedThreadId, texto)
      setMessages((current) => mergeMessage(current, created))
      setThreads((current) => updateThreadPreview(current, selectedThreadId, created))
      setTexto('')
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current)
      }
      void publishTypingState(false)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No se pudo enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  async function handleSendProposal() {
    if (!selectedThreadId || !proposalDateTime) {
      setError('Selecciona fecha y hora para la propuesta')
      return
    }

    const isoProposalDateTime = localDateTimeInputToIso(proposalDateTime)
    if (!isoProposalDateTime) {
      setError('Fecha y hora inválidas para la propuesta')
      return
    }

    setSending(true)
    setError(null)

    try {
      const created = await sendThreadProposal(selectedThreadId, isoProposalDateTime, proposalDuration)
      setMessages((current) => mergeMessage(current, created))
      setThreads((current) => updateThreadPreview(current, selectedThreadId, created))
      setProposalDateTime('')
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No se pudo enviar la propuesta')
    } finally {
      setSending(false)
    }
  }

  async function handleAcceptProposal(proposalId: string) {
    if (!selectedThreadId) {
      return
    }

    setSending(true)
    setError(null)

    try {
      const response = await acceptThreadProposal(selectedThreadId, proposalId)
      setMessages((current) => mergeMessage(mergeMessage(current, response.proposal), response.acceptanceMessage))
      setThreads((current) => updateThreadPreview(current, selectedThreadId, response.acceptanceMessage))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No se pudo aceptar la propuesta')
    } finally {
      setSending(false)
    }
  }

  async function handleDownloadCalendar(proposalId: string) {
    if (!selectedThreadId) {
      return
    }

    try {
      const { blob, fileName } = await downloadProposalCalendar(selectedThreadId, proposalId)
      triggerDownload(blob, fileName)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'No se pudo descargar el calendario')
    }
  }

  async function publishTypingState(isTyping: boolean) {
    if (!selectedThreadId) {
      return
    }

    if (isTypingRef.current === isTyping) {
      return
    }

    isTypingRef.current = isTyping

    try {
      await setThreadTypingStatus(selectedThreadId, isTyping)
    } catch {
      // Ignore ephemeral typing failures.
    }
  }

  function scheduleTypingStop() {
    if (typingStopTimerRef.current) {
      window.clearTimeout(typingStopTimerRef.current)
    }

    typingStopTimerRef.current = window.setTimeout(() => {
      void publishTypingState(false)
    }, TYPING_IDLE_MS)
  }

  function handleTextInputChange(value: string) {
    setTexto(value)

    if (!selectedThreadId) {
      return
    }

    if (!value.trim()) {
      if (typingStopTimerRef.current) {
        window.clearTimeout(typingStopTimerRef.current)
      }

      void publishTypingState(false)
      return
    }

    void publishTypingState(true)
    scheduleTypingStop()
  }

  function handleTextInputKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }

    event.preventDefault()
    if (!sending && texto.trim()) {
      void handleSendText()
    }
  }

  return (
    <div>
      {error ? <div className="retro-alert retro-alert-error">{error}</div> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, alignItems: 'stretch' }}>
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header"><h2>CONVERSACIONES</h2></div>
          <div style={{ maxHeight: '68vh', overflowY: 'auto' }}>
            {loadingThreads ? (
              <div style={{ padding: 16, fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
            ) : threads.length === 0 ? (
              <div style={{ padding: 16, fontFamily: "'Space Mono', monospace", fontSize: '0.76rem', color: '#7A4F2D' }}>
                Aun no tienes conversaciones. Abre Mi Pareja desde una sesion publicada para iniciar chat.
              </div>
            ) : (
              threads.map((thread) => {
                const active = thread.threadId === selectedThreadId
                return (
                  <button
                    key={thread.threadId}
                    onClick={() => setSelectedThreadId(thread.threadId)}
                    style={{
                      width: '100%',
                      border: 'none',
                      textAlign: 'left',
                      background: active ? '#F0E4CC' : '#FBF3E3',
                      borderBottom: '1px solid #DFC99A',
                      padding: '12px 14px',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.56rem', color: '#1A0F08', marginBottom: 4 }}>
                      {thread.participant.nombre}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D' }}>
                      {thread.lastMessage?.type === 'text' ? thread.lastMessage.texto : 'Actividad en propuesta'}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <h2 style={{ marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedThread ? 'CHAT CON' : 'SELECCIONA UN CHAT'}
              </h2>
              {selectedParticipant ? (
                <button
                  onClick={() => setIsPartnerProfileOpen(true)}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'
                    event.currentTarget.style.boxShadow = '4px 4px 0 #1A0F08'
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.transform = 'translateY(0) scale(1)'
                    event.currentTarget.style.boxShadow = '2px 2px 0 #1A0F08'
                  }}
                  style={{
                    marginTop: 8,
                    border: '2px solid #1A0F08',
                    background: '#FFF8D6',
                    color: '#1A0F08',
                    cursor: 'pointer',
                    padding: '6px 10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.75rem',
                    whiteSpace: 'nowrap',
                    transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease',
                    boxShadow: '2px 2px 0 #1A0F08'
                  }}
                >
                  <span className="retro-avatar retro-avatar-sm">{selectedParticipant.nombre?.charAt(0).toUpperCase() || '?'}</span>
                  {selectedParticipant.nombre?.toUpperCase()}
                </button>
              ) : null}
            </div>
            <div>
              {threadContext?.detailsPath ? (
                <Button
                  bg="#FBF3E3"
                  textColor="#1A0F08"
                  shadow="#1A0F08"
                  borderColor="#1A0F08"
                  onClick={() => navigate(threadContext.detailsPath || '/sessions')}
                >
                  VER ULTIMA MOCK
                </Button>
              ) : null}
            </div>
          </div>

          <div ref={messagesContainerRef} style={{ padding: 16, minHeight: '52vh', maxHeight: '52vh', overflowY: 'auto', background: '#F5EDD8' }}>
            {selectedThread && threadContext?.meetingLink ? (
              <div style={{ marginBottom: 12, border: '2px solid #DFC99A', background: '#FFF8D6', padding: 10 }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', marginBottom: 8 }}>
                  LINK DE REUNION COMPARTIDO
                </div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem' }}>
                  <a href={threadContext.meetingLink} target="_blank" rel="noreferrer">{threadContext.meetingLink}</a>
                </div>
              </div>
            ) : null}

            {!selectedThread ? (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
                Selecciona una conversacion para comenzar.
              </div>
            ) : loadingMessages ? (
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO MENSAJES...</div>
            ) : messages.length === 0 ? (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
                Este chat esta vacio. Inicia con un mensaje o una propuesta de fecha-hora.
              </div>
            ) : (
              messages.map((message) => {
                const mine = getUserId(message.sender) === user?._id
                const senderUser = asUser(message.sender)
                const senderName = senderUser?.nombre || (mine ? 'Tu' : 'Usuario')

                return (
                  <div
                    key={message.messageId}
                    style={{
                      marginBottom: 12,
                      marginLeft: mine ? 48 : 0,
                      marginRight: mine ? 0 : 48,
                      background: mine ? '#FFF8D6' : '#FBF3E3',
                      border: '2px solid #1A0F08',
                      padding: 10
                    }}
                  >
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#7A4F2D', marginBottom: 6 }}>
                      {senderName} · {formatDate(message.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>

                    {message.type === 'text' ? (
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', lineHeight: 1.6 }}>{message.texto}</div>
                    ) : null}

                    {message.type === 'proposal' && message.proposal ? (
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', lineHeight: 1.7 }}>
                        <div><strong>Propuesta:</strong> {formatDate(message.proposal.proposedDateTime, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                        <div><strong>Duracion:</strong> {message.proposal.durationMinutes} min</div>
                        <div><strong>Estado:</strong> {message.proposal.status}</div>
                        {message.proposal.status === 'pending' && !mine ? (
                          <div style={{ marginTop: 8 }}>
                            <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" onClick={() => handleAcceptProposal(message.messageId)} disabled={sending}>
                              ACEPTAR PROPUESTA
                            </Button>
                          </div>
                        ) : null}
                        {message.proposal.status === 'accepted' ? (
                          <div style={{ marginTop: 8 }}>
                            {(threadContext?.meetingLink || message.proposal.meetingLink) ? (
                              <a href={threadContext?.meetingLink || message.proposal.meetingLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', marginRight: 8 }}>
                                <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08">
                                  ABRIR LINK REUNION
                                </Button>
                              </a>
                            ) : null}
                            <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08" onClick={() => handleDownloadCalendar(message.messageId)}>
                              AGREGAR A CALENDARIO (.ICS)
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    ) : null}

                    {message.type === 'proposal-accepted' && message.proposalAccepted ? (
                      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', lineHeight: 1.7 }}>
                        ✅ Propuesta aceptada para {formatDate(message.proposalAccepted.proposedDateTime, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} ({message.proposalAccepted.durationMinutes} min)
                        <div style={{ marginTop: 8 }}>
                          {(threadContext?.meetingLink || message.proposalAccepted.meetingLink) ? (
                            <a href={threadContext?.meetingLink || message.proposalAccepted.meetingLink} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', marginRight: 8 }}>
                              <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08">
                                ABRIR LINK REUNION
                              </Button>
                            </a>
                          ) : null}
                          <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08" onClick={() => handleDownloadCalendar(message.proposalAccepted?.proposalMessageId || '')}>
                            DESCARGAR CALENDARIO (.ICS)
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}

            {selectedThread && typingLabel ? (
              <div style={{ position: 'sticky', bottom: 0, marginTop: 10, display: 'flex', justifyContent: 'flex-start', pointerEvents: 'none' }}>
                <div
                  style={{
                    border: '2px solid #1A0F08',
                    background: '#C9521A',
                    color: '#FFFDF7',
                    padding: '7px 10px',
                    boxShadow: '2px 2px 0 #1A0F08',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    letterSpacing: '0.01em'
                  }}
                >
                  ✍️ {typingLabel}
                </div>
              </div>
            ) : null}
          </div>

          {selectedThread ? (
            <div style={{ padding: 16, borderTop: '2px solid #1A0F08', display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8 }}>
                <textarea
                  value={texto}
                  onChange={(event) => handleTextInputChange(event.target.value)}
                  onKeyDown={handleTextInputKeyDown}
                  placeholder="Escribe un mensaje"
                  rows={3}
                  style={{
                    border: '2px solid #1A0F08',
                    background: '#FBF3E3',
                    padding: '10px 12px',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.8rem',
                    resize: 'vertical',
                    lineHeight: 1.4
                  }}
                />
                <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" onClick={handleSendText} disabled={sending || !texto.trim()}>
                  ENVIAR
                </Button>
              </div>

              <div style={{ border: '2px solid #DFC99A', padding: 10, background: '#FFF8D6' }}>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', marginBottom: 8 }}>PROPONER FECHA-HORA</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px auto', gap: 8 }}>
                  <input
                    type="datetime-local"
                    className="chat-proposal-datetime"
                    value={proposalDateTime}
                    onChange={(event) => setProposalDateTime(event.target.value)}
                    step={60}
                    style={{ border: '2px solid #1A0F08', background: '#FBF3E3', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                  />
                  <input
                    type="number"
                    min={15}
                    max={240}
                    step={5}
                    value={proposalDuration}
                    onChange={(event) => setProposalDuration(Number(event.target.value) || 60)}
                    style={{ border: '2px solid #1A0F08', background: '#FBF3E3', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                  />
                  <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08" onClick={handleSendProposal} disabled={sending || !proposalDateTime}>
                    PROPONER
                  </Button>
                </div>
                <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: '0.7rem', color: '#7A4F2D' }}>
                  Hora local: {timezoneLabel}. Se guarda en UTC y cada usuario la ve en su propio timezone.
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>

      {isPartnerProfileOpen && selectedParticipant ? (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0 }}>
              <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', marginBottom: 0 }}>
                  PERFIL DE {selectedParticipant.nombre?.toUpperCase()}
                </h2>
                <button
                  onClick={() => setIsPartnerProfileOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#1A0F08' }}
                >
                  X
                </button>
              </div>

              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div className="retro-avatar">{selectedParticipant.nombre?.charAt(0).toUpperCase() || '?'}</div>
                  <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', marginBottom: 0 }}>
                    {selectedParticipant.nombre}
                  </h2>
                </div>

                {selectedParticipant.bio ? (
                  <div style={{ marginBottom: 16 }}>
                    <span className="retro-label">💬 BIO</span>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', color: '#7A4F2D', borderLeft: '3px solid #C9521A', paddingLeft: 10, fontStyle: 'italic' }}>
                      {selectedParticipant.bio}
                    </div>
                  </div>
                ) : null}

                {selectedParticipantLinks.length > 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    <span className="retro-label">🌐 LINKS PÚBLICOS</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {selectedParticipantLinks.map(([platform, value]) => (
                        <a key={platform} href={value} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08">
                            {platformLabel(platform as keyof PublicProfiles)}
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {selectedParticipant.cvPath ? (
                  <div style={{ marginTop: 20 }}>
                    <a href={`${STATIC_BASE_URL}${selectedParticipant.cvPath}`} download={buildCvDownloadName(selectedParticipant.nombre)} style={{ textDecoration: 'none' }}>
                      <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" style={{ width: '100%' }}>
                        ⬇ DESCARGAR CV
                      </Button>
                    </a>
                  </div>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  )
}
