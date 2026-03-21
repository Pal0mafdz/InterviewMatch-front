import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { adminRegisterUsersForSession, cancelRegistration, getSession, registerForSession, updateSession } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { createManualMatch, getSessionMatches, publishShuffle, removeManualMatch } from '../../api/matches'
import type { SessionMatch, SessionMatchOverviewResponse } from '../../api/matches'
import { getUsers, type PublicProfiles, type UserProfile } from '../../api/users'
import { useAuth } from '../../context/useAuth'
import { formatDate, localDateTimeInputToIso, toDateTimeLocalInput } from '../../utils/date'
import { AdminUserProfileModal } from '../../components/AdminUserProfileModal'

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

type AdminEnrollmentDraft = {
  email: string
  mockCount: '' | 1 | 2 | 3
}

function createEmptyAdminEnrollmentDraft(): AdminEnrollmentDraft {
  return {
    email: '',
    mockCount: '',
  }
}

function parseAdminEnrollmentDrafts(rows: AdminEnrollmentDraft[]) {
  const nonEmptyRows = rows.filter((row) => row.email.trim() || row.mockCount !== '')

  if (!nonEmptyRows.length) {
    throw new Error('Añade al menos una inscripción')
  }

  return nonEmptyRows.map((row, index) => {
    const email = row.email.trim()
    const mockCount = Number(row.mockCount)

    if (!email || row.mockCount === '') {
      throw new Error(`La fila ${index + 1} debe tener correo y número de mocks`)
    }

    if (![1, 2, 3].includes(mockCount)) {
      throw new Error(`La fila ${index + 1} debe indicar 1, 2 o 3 mocks`)
    }

    return { email, mockCount: mockCount as 1 | 2 | 3 }
  })
}

type SessionUserProfile = {
  _id: string
  nombre?: string
  email?: string
  rol?: 'user' | 'admin'
  cvPath?: string
  bio?: string
  publicProfiles?: Partial<PublicProfiles>
  isBlocked?: boolean
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
  const [usersById, setUsersById] = useState<Record<string, UserProfile>>({})
  const [editTitulo, setEditTitulo] = useState('')
  const [editFecha, setEditFecha] = useState('')
  const [editDescripcion, setEditDescripcion] = useState('')
  const [detailsSaving, setDetailsSaving] = useState(false)
  const [detailsError, setDetailsError] = useState<string | null>(null)
  const [detailsSuccess, setDetailsSuccess] = useState<string | null>(null)
  const [adminEnrollRows, setAdminEnrollRows] = useState<AdminEnrollmentDraft[]>([
    createEmptyAdminEnrollmentDraft(),
  ])
  const [adminEnrollLoading, setAdminEnrollLoading] = useState(false)
  const [adminEnrollError, setAdminEnrollError] = useState<string | null>(null)
  const [adminEnrollSuccess, setAdminEnrollSuccess] = useState<string | null>(null)

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
    getUsers()
      .then((allUsers) => {
        const nextMap: Record<string, UserProfile> = {}
        allUsers.forEach((currentUser) => {
          nextMap[currentUser._id] = currentUser
        })
        setUsersById(nextMap)
      })
      .catch(() => {
        // Keep fallback behavior using partial session/match payloads.
      })
  }, [])

  function openUserProfile(userRef: { _id?: string; nombre?: string; email?: string; rol?: 'user' | 'admin'; cvPath?: string; bio?: string; publicProfiles?: Partial<PublicProfiles> }) {
    if (!userRef._id) {
      return
    }

    const completeProfile = usersById[userRef._id]
    if (completeProfile) {
      setSelectedUserProfile(completeProfile)
      return
    }

    setSelectedUserProfile({
      _id: userRef._id,
      nombre: userRef.nombre || 'Desconocido',
      email: userRef.email || 'Sin correo',
      rol: userRef.rol || 'user',
      cvPath: userRef.cvPath,
      bio: userRef.bio,
      publicProfiles: userRef.publicProfiles,
    })
  }

  useEffect(() => {
    if (!session) {
      return
    }

    setEditTitulo(session.titulo)
    setEditFecha(toDateTimeLocalInput(session.fechaProgramada))
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
      const isoDate = localDateTimeInputToIso(editFecha)
      if (!isoDate) {
        throw new Error('Fecha y hora inválidas')
      }

      const updatedSession = await updateSession(id, {
        titulo: editTitulo,
        fechaProgramada: isoDate,
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

  async function handleAdminEnrollUsers() {
    if (!id) {
      return
    }

    setAdminEnrollLoading(true)
    setAdminEnrollError(null)
    setAdminEnrollSuccess(null)

    try {
      const entries = parseAdminEnrollmentDrafts(adminEnrollRows)
      const response = await adminRegisterUsersForSession(id, entries)
      await reloadSessionData(id)
      setAdminEnrollRows([createEmptyAdminEnrollmentDraft()])
      setAdminEnrollSuccess(response.results.map((result) => `${result.email}: ${result.mockCount} mock(s)`).join(' · '))
    } catch (err) {
      setAdminEnrollError(err instanceof Error ? err.message : 'Error al inscribir usuarios en la sesión')
    } finally {
      setAdminEnrollLoading(false)
    }
  }

  function updateAdminEnrollRow(index: number, patch: Partial<AdminEnrollmentDraft>) {
    setAdminEnrollRows((currentRows) => currentRows.map((row, rowIndex) => (
      rowIndex === index ? { ...row, ...patch } : row
    )))
  }

  function addAdminEnrollRow() {
    setAdminEnrollRows((currentRows) => [...currentRows, createEmptyAdminEnrollmentDraft()])
  }

  function removeAdminEnrollRow(index: number) {
    setAdminEnrollRows((currentRows) => {
      if (currentRows.length === 1) {
        return [createEmptyAdminEnrollmentDraft()]
      }

      return currentRows.filter((_, rowIndex) => rowIndex !== index)
    })
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
      <AdminUserProfileModal user={selectedUserProfile} onClose={() => setSelectedUserProfile(null)} />

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
        <div className="retro-alert retro-alert-info" style={{ marginBottom: 20, whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
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
                  FECHA DE CORTE
                </div>
                <input
                  type="datetime-local"
                  className="chat-proposal-datetime"
                  value={editFecha}
                  onChange={(event) => setEditFecha(event.currentTarget.value)}
                  step={60}
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
          <div className="retro-section-header"><h2>📝 INSCRIBIR USUARIOS A LA SESIÓN</h2></div>
          <div style={{ padding: 20 }}>
            <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D', marginBottom: 16 }}>
              Añade una fila por usuario y completa los dos campos: <strong>correo</strong> y <strong>mocks</strong>.
            </p>
            <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
              {adminEnrollRows.map((row, index) => (
                <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 120px auto', gap: 10, alignItems: 'end' }}>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                      CORREO {index + 1}
                    </div>
                    <input
                      type="email"
                      value={row.email}
                      onChange={(event) => updateAdminEnrollRow(index, { email: event.currentTarget.value })}
                      placeholder={index === 0 ? 'ana.mocker@gmail.com' : index === 1 ? 'carlos.dev@outlook.com' : 'usuario@correo.com'}
                      style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 6 }}>
                      MOCKS
                    </div>
                    <select
                      value={row.mockCount}
                      onChange={(event) => updateAdminEnrollRow(index, { mockCount: event.currentTarget.value === '' ? '' : Number(event.currentTarget.value) as 1 | 2 | 3 })}
                      style={{ width: '100%', minHeight: 40, border: '2px solid #1A0F08', background: '#FFFDF7', padding: '8px 10px', fontFamily: "'Space Mono', monospace" }}
                    >
                      <option value="">Elegir</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                    </select>
                  </div>
                  <Button
                    bg="#FFFDF7" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08"
                    onClick={() => removeAdminEnrollRow(index)}
                    style={{ minWidth: 88 }}
                  >
                    QUITAR
                  </Button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Button
                bg="#FFFDF7" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08"
                onClick={addAdminEnrollRow}
              >
                AÑADIR OTRA PERSONA
              </Button>
            <Button
              bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
              onClick={handleAdminEnrollUsers}
              disabled={adminEnrollLoading}
            >
              {adminEnrollLoading ? 'INSCRIBIENDO...' : 'INSCRIBIR USUARIOS'}
            </Button>
            </div>
            {adminEnrollError && <div className="retro-alert retro-alert-error" style={{ marginTop: 14 }}>{adminEnrollError}</div>}
            {adminEnrollSuccess && <div className="retro-alert retro-alert-success" style={{ marginTop: 14 }}>{adminEnrollSuccess}</div>}
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
                  const u = typeof insc.usuario === 'string' ? { _id: insc.usuario, nombre: '...', email: '...' } : insc.usuario
                  return (
                    <tr key={`${u._id || idx}`} style={{ borderBottom: '1px solid #1A0F08' }}>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.58rem', color: '#1A0F08' }}>
                          {u.nombre || 'Desconocido'}
                        </span>
                      </td>
                      <td style={{ padding: '10px', fontSize: '0.8rem', fontFamily: 'monospace' }}>{u.email || '—'}</td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <span className="retro-chip retro-chip-blue">{insc.mockCount}</span>
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <Button
                          bg="#FBF3E3"
                          textColor="#1A0F08"
                          shadow="#1A0F08"
                          borderColor="#1A0F08"
                          onClick={() => openUserProfile(u)}
                        >
                          MOSTRAR PERFIL
                        </Button>
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
                  <th>PERFILES</th>
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
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Button
                          bg="#FBF3E3"
                          textColor="#1A0F08"
                          shadow="#1A0F08"
                          borderColor="#1A0F08"
                          onClick={() => openUserProfile(m.user1)}
                          style={{ padding: '4px 8px', fontSize: '0.62rem' }}
                        >
                          VER {m.user1.nombre?.toUpperCase() || 'U1'}
                        </Button>
                        <Button
                          bg="#FBF3E3"
                          textColor="#1A0F08"
                          shadow="#1A0F08"
                          borderColor="#1A0F08"
                          onClick={() => openUserProfile(m.user2)}
                          style={{ padding: '4px 8px', fontSize: '0.62rem' }}
                        >
                          VER {m.user2.nombre?.toUpperCase() || 'U2'}
                        </Button>
                      </div>
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
