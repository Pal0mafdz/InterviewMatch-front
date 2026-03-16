import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { cancelRegistration, getSession, registerForSession, updateSession } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { createManualMatch, getSessionMatches, publishShuffle, removeManualMatch } from '../../api/matches'
import { STATIC_BASE_URL } from '../../api/constants'
import type { SessionMatch, SessionMatchOverviewResponse } from '../../api/matches'
import { useAuth } from '../../context/useAuth'
import { formatDate } from '../../utils/date'

type UnmatchedRegistration = NonNullable<SessionMatchOverviewResponse['unmatched']>[number]

function normalizeSearchValue(value: string) {
  return value.trim().toLowerCase()
}

function matchesRegistrationSearch(registration: UnmatchedRegistration, query: string) {
  const normalizedQuery = normalizeSearchValue(query)

  if (!normalizedQuery) {
    return true
  }

  const searchable = [
    registration.user.nombre,
    registration.user.email,
    registration.user._id,
    registration.registrationId,
    String(registration.slotNumber),
  ].join(' ').toLowerCase()

  return searchable.includes(normalizedQuery)
}

function formatRegistrationOption(registration: UnmatchedRegistration) {
  return `${registration.user.nombre} (${registration.user.email}) · slot ${registration.slotNumber}`
}

function buildCvDownloadName(nombre?: string) {
  return `${nombre || 'Usuario'} - CV.pdf`
}

type SessionUserProfile = {
  _id: string
  nombre?: string
  email?: string
  cvPath?: string
  bio?: string
}

const statusChip = (estado: string) => {
  const map: Record<string, string> = {
    abierta: 'retro-chip-green',
    publicada: 'retro-chip-blue',
    finalizada: 'retro-chip-muted',
    cancelada: 'retro-chip-red',
  }
  const cls = map[estado] ?? 'retro-chip-muted'
  return <span className={`retro-chip ${cls}`}>{estado.toUpperCase()}</span>
}

export function AdminSessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const [session, setSession] = useState<Session | null>(null)
  const [matches, setMatches] = useState<SessionMatch[]>([])
  const [loadingSession, setLoadingSession] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shuffling, setShuffling] = useState(false)
  const [shuffleResult, setShuffleResult] = useState<{ pares: number; pendientes: number; feedbackLinks: number } | null>(null)
  const [shuffleError, setShuffleError] = useState<string | null>(null)
  const [adminMockCount, setAdminMockCount] = useState<1 | 2 | 3>(1)
  const [adminActionLoading, setAdminActionLoading] = useState(false)
  const [adminActionError, setAdminActionError] = useState<string | null>(null)
  const [adminActionSuccess, setAdminActionSuccess] = useState<string | null>(null)
  const [unmatchedRegistrations, setUnmatchedRegistrations] = useState<UnmatchedRegistration[]>([])
  const [manualRegistrationId1, setManualRegistrationId1] = useState('')
  const [manualRegistrationId2, setManualRegistrationId2] = useState('')
  const [manualActionLoading, setManualActionLoading] = useState(false)
  const [manualActionError, setManualActionError] = useState<string | null>(null)
  const [manualActionSuccess, setManualActionSuccess] = useState<string | null>(null)
  const [firstRegistrationSearch, setFirstRegistrationSearch] = useState('')
  const [secondRegistrationSearch, setSecondRegistrationSearch] = useState('')
  const [enrolledSearch, setEnrolledSearch] = useState('')
  const [matchSearch, setMatchSearch] = useState('')
  const [selectedUserProfile, setSelectedUserProfile] = useState<SessionUserProfile | null>(null)
  const [editTitulo, setEditTitulo] = useState('')
  const [editFecha, setEditFecha] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null)

  async function reloadSessionData(sessionId: string) {
    const [updatedSession, overview] = await Promise.all([
      getSession(sessionId),
      getSessionMatches(sessionId),
    ])

    setSession(updatedSession)
    setMatches(overview.matches ?? [])
    setUnmatchedRegistrations(overview.unmatched ?? [])
    return updatedSession
  }

  useEffect(() => {
    if (!id) return
    Promise.all([getSession(id), getSessionMatches(id)])
      .then(([sessionResponse, overview]) => {
        setSession(sessionResponse)
        setMatches(overview.matches ?? [])
        setUnmatchedRegistrations(overview.unmatched ?? [])
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => {
        setLoadingSession(false)
        setLoadingMatches(false)
      })
  }, [id])

  useEffect(() => {
    if (!session) {
      return
    }

    setEditTitulo(session.titulo)
    setEditFecha(session.fechaProgramada.slice(0, 10))
    setEditDescripcion(session.descripcion ?? '')
  }, [session])

  const currentAdminRegistration = session?.inscripciones?.find((insc) => (
    typeof insc.usuario !== 'string' && insc.usuario._id === user?._id
  ))

  useEffect(() => {
    if (!currentAdminRegistration) {
      return
    }

    const nextMockCount = currentAdminRegistration.mockCount
    if (nextMockCount >= 1 && nextMockCount <= 3) {
      setAdminMockCount(nextMockCount as 1 | 2 | 3)
    }
  }, [currentAdminRegistration])

  const currentAdminUnmatchedRegistrations = unmatchedRegistrations.filter((registration) => registration.user._id === user?._id)

  useEffect(() => {
    if (!manualRegistrationId1 && currentAdminUnmatchedRegistrations.length === 1) {
      setManualRegistrationId1(currentAdminUnmatchedRegistrations[0].registrationId)
    }
  }, [currentAdminUnmatchedRegistrations, manualRegistrationId1])

  useEffect(() => {
    if (!unmatchedRegistrations.some((registration) => registration.registrationId === manualRegistrationId1)) {
      setManualRegistrationId1('')
    }

    if (!unmatchedRegistrations.some((registration) => registration.registrationId === manualRegistrationId2)) {
      setManualRegistrationId2('')
    }
  }, [unmatchedRegistrations, manualRegistrationId1, manualRegistrationId2])

  async function handleShuffle() {
    if (!id) return
    const confirmed = window.confirm(
      '¿Publicar el shuffle? Esta acción generará los emparejamientos y los publicará para los usuarios. ¿Continuar?'
    )
    if (!confirmed) return
    setShuffling(true)
    setShuffleError(null)
    setShuffleResult(null)
    try {
      const res = await publishShuffle(id)
      setShuffleResult({ pares: res.totalPares, pendientes: res.totalPendientes, feedbackLinks: res.totalFeedbackLinksGenerados })
      await reloadSessionData(id)
    } catch (err) {
      setShuffleError(err instanceof Error ? err.message : 'Error al publicar shuffle')
    } finally {
      setShuffling(false)
    }
  }

  async function handleAdminRegistration() {
    if (!id) return

    setAdminActionLoading(true)
    setAdminActionError(null)
    setAdminActionSuccess(null)

    try {
      const res = await registerForSession(id, adminMockCount)
      await reloadSessionData(id)
      setAdminActionSuccess(res.mensaje)
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Error al inscribirte en la sesión')
    } finally {
      setAdminActionLoading(false)
    }
  }

  async function handleAdminCancellation() {
    if (!id) return

    const confirmed = window.confirm('¿Quitarte de esta sesión como participante? Esta acción cancelará todas tus mocks activas en esta sesión.')
    if (!confirmed) return

    setAdminActionLoading(true)
    setAdminActionError(null)
    setAdminActionSuccess(null)

    try {
      const res = await cancelRegistration(id)
      await reloadSessionData(id)
      setAdminMockCount(1)
      setAdminActionSuccess(res.mensaje)
    } catch (err) {
      setAdminActionError(err instanceof Error ? err.message : 'Error al salir de la sesión')
    } finally {
      setAdminActionLoading(false)
    }
  }

  async function handleCreateManualMatch() {
    if (!id || !manualRegistrationId1 || !manualRegistrationId2) return

    setManualActionLoading(true)
    setManualActionError(null)
    setManualActionSuccess(null)

    try {
      const response = await createManualMatch(id, manualRegistrationId1, manualRegistrationId2)
      await reloadSessionData(id)
      setManualRegistrationId2('')
      setManualActionSuccess(response.mensaje)
    } catch (err) {
      setManualActionError(err instanceof Error ? err.message : 'Error al preparar el match manual')
    } finally {
      setManualActionLoading(false)
    }
  }

  async function handleSaveDetails(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!id) {
      return
    }

    setDetailsSaving(true)
    setDetailsError(null)
    setDetailsSuccess(null)

    try {
      const updatedSession = await updateSession(id, {
        titulo: editTitulo,
        fechaProgramada: editFecha,
        descripcion: editDescripcion || undefined,
      })

      setSession((currentSession) => {
        if (!currentSession) {
          return updatedSession
        }

        return {
          ...currentSession,
          ...updatedSession,
        }
      })
      setDetailsSuccess('Detalles actualizados correctamente.')
    } catch (err) {
      setDetailsError(err instanceof Error ? err.message : 'Error al actualizar la sesión')
    } finally {
      setDetailsSaving(false)
    }
  }

  async function handleRemoveManualMatch(matchId: string) {
    if (!id) return

    const confirmed = window.confirm('¿Deshacer este emparejamiento manual antes del shuffle?')
    if (!confirmed) return

    setManualActionLoading(true)
    setManualActionError(null)
    setManualActionSuccess(null)

    try {
      const response = await removeManualMatch(id, matchId)
      await reloadSessionData(id)
      setManualActionSuccess(response.mensaje)
    } catch (err) {
      setManualActionError(err instanceof Error ? err.message : 'Error al deshacer el match manual')
    } finally {
      setManualActionLoading(false)
    }
  }

  const personas = session?.inscripciones?.length ?? 0
  const totalMocks = session?.inscripciones?.reduce((sum, i) => sum + i.mockCount, 0) ?? 0
  const filteredFirstRegistrations = unmatchedRegistrations.filter((registration) => matchesRegistrationSearch(registration, firstRegistrationSearch))
  const filteredSecondRegistrations = unmatchedRegistrations.filter((registration) => (
    registration.registrationId !== manualRegistrationId1 && matchesRegistrationSearch(registration, secondRegistrationSearch)
  ))
  const filteredInscripciones = (session?.inscripciones ?? []).filter((insc) => {
    const usuario = typeof insc.usuario === 'string'
      ? { _id: insc.usuario, nombre: '', email: '' }
      : insc.usuario
    const searchable = [usuario.nombre ?? '', usuario.email ?? '', usuario._id ?? '', String(insc.mockCount)].join(' ').toLowerCase()
    const normalizedQuery = normalizeSearchValue(enrolledSearch)

    if (!normalizedQuery) {
      return true
    }

    return searchable.includes(normalizedQuery)
  })
  const filteredMatches = matches.filter((match) => {
    const normalizedQuery = normalizeSearchValue(matchSearch)

    if (!normalizedQuery) {
      return true
    }

    const searchable = [
      match.source,
      match.user1.nombre,
      match.user1.email,
      match.user2.nombre,
      match.user2.email,
    ].join(' ').toLowerCase()

    return searchable.includes(normalizedQuery)
  })

  if (loadingSession) return (
    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
  )
  if (error) return <div className="retro-alert retro-alert-error">{error}</div>
  if (!session) return null

  return (
    <div>
      {selectedUserProfile && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20,
        }}>
          <div style={{ width: '100%', maxWidth: 460 }}>
            <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
                <h2>PERFIL DEL CANDIDATO</h2>
                <button
                  type="button"
                  onClick={() => setSelectedUserProfile(null)}
                  style={{ background: 'transparent', border: 'none', color: '#1A0F08', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
                >
                  X
                </button>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                  <div className="retro-avatar retro-avatar-md">
                    {selectedUserProfile.nombre?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem', color: '#1A0F08', lineHeight: 1.7 }}>
                      {selectedUserProfile.nombre || 'Sin nombre'}
                    </div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.74rem', color: '#7A4F2D' }}>
                      {selectedUserProfile.email || 'Sin correo'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <span className="retro-label">BIO</span>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', lineHeight: 1.6, color: '#7A4F2D', borderLeft: '3px solid #C9521A', paddingLeft: 10 }}>
                    {selectedUserProfile.bio || 'Sin bio cargada.'}
                  </div>
                </div>

                {selectedUserProfile.cvPath ? (
                  <a
                    href={`${STATIC_BASE_URL}${selectedUserProfile.cvPath}`}
                    download={buildCvDownloadName(selectedUserProfile.nombre)}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" style={{ width: '100%' }}>
                      ⬇ DESCARGAR CV
                    </Button>
                  </a>
                ) : (
                  <div className="retro-alert retro-alert-info" style={{ marginBottom: 0 }}>
                    Este usuario no tiene CV cargado.
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 4 }}>
            🛠 {session.titulo}
          </h1>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
            {formatDate(session.fechaProgramada, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        {statusChip(session.estado)}
      </div>

      {session.descripcion && (
        <div className="retro-alert retro-alert-info" style={{ marginBottom: 20 }}>
          {session.descripcion}
        </div>
      )}

      {session.estado === 'abierta' && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div className="retro-section-header"><h2>✏️ EDITAR DETALLES</h2></div>
          <form onSubmit={handleSaveDetails} style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                  TÍTULO
                </div>
                <input
                  value={editTitulo}
                  onChange={(event) => setEditTitulo(event.currentTarget.value)}
                  required
                  style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                />
              </div>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                  FECHA
                </div>
                <input
                  type="date"
                  value={editFecha}
                  onChange={(event) => setEditFecha(event.currentTarget.value)}
                  required
                  style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                DESCRIPCIÓN
              </div>
              <textarea
                value={editDescripcion}
                onChange={(event) => setEditDescripcion(event.currentTarget.value)}
                rows={4}
                style={{ width: '100%', border: '2px solid #1A0F08', background: '#FFFDF7', padding: '10px', fontFamily: "'Space Mono', monospace", resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>
            <Button
              type="submit"
              bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
              disabled={detailsSaving}
            >
              {detailsSaving ? 'GUARDANDO...' : 'GUARDAR DETALLES'}
            </Button>
            {detailsError && <div className="retro-alert retro-alert-error" style={{ marginTop: 14 }}>{detailsError}</div>}
            {detailsSuccess && <div className="retro-alert retro-alert-success" style={{ marginTop: 14 }}>{detailsSuccess}</div>}
          </form>
        </Card>
      )}

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'INSCRITOS', value: personas },
          { label: 'MOCKS TOTALES', value: totalMocks },
          { label: 'PARES FORMADOS', value: loadingMatches ? '...' : matches.length },
          { label: 'PENDIENTES', value: shuffleResult ? shuffleResult.pendientes : '—' },
        ].map(stat => (
          <div key={stat.label} className="retro-stat">
            <div className="retro-stat-value">{stat.value}</div>
            <div className="retro-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Shuffle section */}
      {session.estado === 'abierta' && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div className="retro-section-header"><h2>🔀 PUBLICAR SHUFFLE</h2></div>
          <div style={{ padding: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D', marginBottom: 16 }}>
              Genera y publica los emparejamientos automáticos. En este corte se crean siempre 2 links de feedback por match y los usuarios podrán ver sus parejas asignadas.
            </p>
            <Button
              bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
              onClick={handleShuffle}
              disabled={shuffling}
            >
              {shuffling ? 'PUBLICANDO...' : '🔀 PUBLICAR SHUFFLE'}
            </Button>
            {shuffleError && <div className="retro-alert retro-alert-error" style={{ marginTop: 14 }}>{shuffleError}</div>}
            {shuffleResult && (
              <div className="retro-alert retro-alert-success" style={{ marginTop: 14 }}>
                ✓ Shuffle publicado: <strong>{shuffleResult.pares} pares</strong> formados,{' '}
                <strong>{shuffleResult.pendientes} pendientes</strong> sin pareja.
                {shuffleResult.feedbackLinks > 0 ? (
                  <><br />Se generaron <strong>{shuffleResult.feedbackLinks} links de feedback</strong>.</>
                ) : null}
              </div>
            )}
          </div>
        </Card>
      )}

      {session.estado === 'abierta' && user && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div className="retro-section-header"><h2>🙋 PARTICIPAR COMO ADMIN</h2></div>
          <div style={{ padding: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D', marginBottom: 16 }}>
              Si quieres entrar en el corte, puedes inscribirte aquí mismo como participante con 1, 2 o 3 mocks.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
              {[1, 2, 3].map((count) => (
                <label
                  key={count}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    border: '2px solid #1A0F08',
                    background: adminMockCount === count ? '#F6D365' : '#FFFDF7',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="adminMockCount"
                    checked={adminMockCount === count}
                    onChange={() => setAdminMockCount(count as 1 | 2 | 3)}
                  />
                  {count} mock{count > 1 ? 's' : ''}
                </label>
              ))}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#1A0F08', marginBottom: 16 }}>
              {currentAdminRegistration
                ? `Actualmente estás dentro de la sesión con ${currentAdminRegistration.mockCount} mock(s).`
                : 'Aún no estás participando en esta sesión.'}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
                onClick={handleAdminRegistration}
                disabled={adminActionLoading}
              >
                {adminActionLoading ? 'GUARDANDO...' : currentAdminRegistration ? 'ACTUALIZAR MI INSCRIPCIÓN' : 'ENTRAR AL CORTE'}
              </Button>
              {currentAdminRegistration && (
                <Button
                  bg="#FFFDF7" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08"
                  onClick={handleAdminCancellation}
                  disabled={adminActionLoading}
                >
                  SALIR DE LA SESIÓN
                </Button>
              )}
            </div>
            {adminActionError && <div className="retro-alert retro-alert-error" style={{ marginTop: 14 }}>{adminActionError}</div>}
            {adminActionSuccess && <div className="retro-alert retro-alert-success" style={{ marginTop: 14 }}>{adminActionSuccess}</div>}
          </div>
        </Card>
      )}

      {session.estado === 'abierta' && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
          <div className="retro-section-header"><h2>🤝 EMPAREJAR ANTES DEL SHUFFLE</h2></div>
          <div style={{ padding: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D', marginBottom: 16 }}>
              Los matches manuales reservan dos registrations libres y quedan ocultos hasta publicar el shuffle.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                  BUSCAR SLOT 1
                </div>
                <input
                  value={firstRegistrationSearch}
                  onChange={(event) => setFirstRegistrationSearch(event.currentTarget.value)}
                  placeholder="Nombre, correo, id o slot"
                  style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}
                />
                <select
                  value={manualRegistrationId1}
                  onChange={(event) => setManualRegistrationId1(event.currentTarget.value)}
                  style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                >
                  <option value="">Selecciona una registration libre</option>
                  {filteredFirstRegistrations.map((registration) => (
                    <option key={registration.registrationId} value={registration.registrationId}>
                      {formatRegistrationOption(registration)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                  BUSCAR SLOT 2
                </div>
                <input
                  value={secondRegistrationSearch}
                  onChange={(event) => setSecondRegistrationSearch(event.currentTarget.value)}
                  placeholder="Nombre, correo, id o slot"
                  style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace", marginBottom: 8 }}
                />
                <select
                  value={manualRegistrationId2}
                  onChange={(event) => setManualRegistrationId2(event.currentTarget.value)}
                  style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                >
                  <option value="">Selecciona la pareja</option>
                  {filteredSecondRegistrations.map((registration) => (
                    <option key={registration.registrationId} value={registration.registrationId}>
                      {formatRegistrationOption(registration)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#1A0F08', marginBottom: 16 }}>
              {currentAdminUnmatchedRegistrations.length > 0
                ? `Tienes ${currentAdminUnmatchedRegistrations.length} slot(s) libres como admin para emparejar manualmente.`
                : 'Si quieres matchearte como admin, primero entra al corte y deja al menos un slot libre.'}
            </div>
            <Button
              bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
              onClick={handleCreateManualMatch}
              disabled={manualActionLoading || !manualRegistrationId1 || !manualRegistrationId2}
            >
              {manualActionLoading ? 'PREPARANDO...' : 'CREAR MATCH MANUAL'}
            </Button>
            {manualActionError && <div className="retro-alert retro-alert-error" style={{ marginTop: 14 }}>{manualActionError}</div>}
            {manualActionSuccess && <div className="retro-alert retro-alert-success" style={{ marginTop: 14 }}>{manualActionSuccess}</div>}
          </div>
        </Card>
      )}

      {/* Enrolled Users Table */}
      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div className="retro-section-header"><h2>👥 USUARIOS INSCRITOS ({session.inscripciones?.length || 0})</h2></div>
        <div style={{ padding: 20, overflowX: 'auto' }}>
          <input
            value={enrolledSearch}
            onChange={(event) => setEnrolledSearch(event.currentTarget.value)}
            placeholder="Buscar por nombre, correo o id"
            style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace", marginBottom: 16 }}
          />
          {session.inscripciones && session.inscripciones.length > 0 ? (
            <table className="retro-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', borderBottom: '2px solid #1A0F08', padding: '10px' }}>NOMBRE</th>
                  <th style={{ textAlign: 'left', borderBottom: '2px solid #1A0F08', padding: '10px' }}>EMAIL</th>
                  <th style={{ textAlign: 'center', borderBottom: '2px solid #1A0F08', padding: '10px' }}>Nº MOCKS</th>
                  <th style={{ textAlign: 'center', borderBottom: '2px solid #1A0F08', padding: '10px' }}>PERFIL</th>
                </tr>
              </thead>
              <tbody>
                {filteredInscripciones.map((insc, idx) => {
                  const u = typeof insc.usuario === 'string' ? { _id: insc.usuario, nombre: '...', email: '...', cvPath: '', bio: '' } : insc.usuario
                  return (
                    <tr key={`${u._id || idx}`} style={{ borderBottom: '1px solid #1A0F08' }}>
                      <td style={{ padding: '10px' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedUserProfile(u)}
                          style={{
                            border: 'none',
                            background: 'transparent',
                            padding: 0,
                            margin: 0,
                            cursor: 'pointer',
                            fontFamily: "'Press Start 2P', monospace",
                            fontSize: '0.58rem',
                            color: '#1A0F08',
                            textAlign: 'left',
                            textDecoration: 'none',
                            transition: 'color 0.12s ease, transform 0.12s ease, text-shadow 0.12s ease',
                          }}
                          onMouseEnter={(event) => {
                            event.currentTarget.style.color = '#C9521A'
                            event.currentTarget.style.transform = 'translateX(2px)'
                            event.currentTarget.style.textShadow = '1px 0 0 #1A0F08'
                          }}
                          onMouseLeave={(event) => {
                            event.currentTarget.style.color = '#1A0F08'
                            event.currentTarget.style.transform = 'translateX(0)'
                            event.currentTarget.style.textShadow = 'none'
                          }}
                          title="Abrir perfil"
                        >
                          {u.nombre || 'Desconocido'}
                        </button>
                      </td>
                      <td style={{ padding: '10px', fontSize: '0.8rem', fontFamily: 'monospace' }}>{u.email || '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span className="retro-chip retro-chip-blue">{insc.mockCount}</span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            minHeight: 56,
                          }}
                        >
                          {u.cvPath ? (
                            <a href={`${STATIC_BASE_URL}${u.cvPath}`} download={buildCvDownloadName(u.nombre)} style={{ textDecoration: 'none', display: 'inline-flex' }}>
                              <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" style={{ minWidth: 48, padding: '4px 8px', fontSize: '0.58rem' }}>
                                CV
                              </Button>
                            </a>
                          ) : (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minWidth: 48,
                                minHeight: 26,
                                padding: '4px 8px',
                                border: '2px solid #C7A46A',
                                background: '#F5EDD8',
                                color: '#7A4F2D',
                                fontSize: '0.62rem',
                              }}
                            >
                              Sin CV
                            </span>
                          )}
                          {u.bio ? (
                            <div
                              style={{
                                maxWidth: 150,
                                fontSize: '0.6rem',
                                lineHeight: 1.35,
                                color: '#7A4F2D',
                                textAlign: 'center',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                              title={u.bio}
                            >
                              Bio: {u.bio}
                            </div>
                          ) : (
                            <div style={{ fontSize: '0.65rem', color: '#B08A59', textAlign: 'center' }}>
                              Sin bio
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
             <div style={{ textAlign: 'center', padding: '20px', color: '#7A4F2D', fontStyle: 'italic' }}>Aún no hay usuarios inscritos en esta sesión.</div>
          )}
        </div>
      </Card>

      {/* Matches table */}
      {!loadingMatches && matches.length > 0 && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header"><h2>👥 EMPAREJAMIENTOS ({matches.length})</h2></div>
          <div style={{ padding: 20 }}>
            <input
              value={matchSearch}
              onChange={(event) => setMatchSearch(event.currentTarget.value)}
              placeholder="Buscar por nombre, correo o tipo de match"
              style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace", marginBottom: 16 }}
            />
            <table className="retro-table">
              <thead>
                <tr>
                  <th>SLOT</th>
                  <th>USUARIO 1</th>
                  <th>USUARIO 2</th>
                  {session.estado === 'abierta' && <th>ACCIÓN</th>}
                </tr>
              </thead>
              <tbody>
                {filteredMatches.map(m => (
                  <tr key={m.matchId}>
                    <td><span className="retro-chip retro-chip-muted">{m.source.toUpperCase()}</span></td>
                    <td>
                      <strong>{m.user1.nombre}</strong>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginLeft: 6 }}>
                        ({m.user1.email})
                      </span>
                    </td>
                    <td>
                      <strong>{m.user2.nombre}</strong>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginLeft: 6 }}>
                        ({m.user2.email})
                      </span>
                    </td>
                    {session.estado === 'abierta' && (
                      <td>
                        {m.source === 'manual' ? (
                          <Button
                            bg="#FFFDF7" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08"
                            onClick={() => handleRemoveManualMatch(m.matchId)}
                            disabled={manualActionLoading}
                            style={{ padding: '4px 8px', fontSize: '0.65rem' }}
                          >
                            DESHACER
                          </Button>
                        ) : (
                          <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D' }}>Automático</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
