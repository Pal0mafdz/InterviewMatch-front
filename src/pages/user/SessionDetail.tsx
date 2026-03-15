import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { useAuth } from '../../context/useAuth'
import { getSession, registerForSession, cancelRegistration } from '../../api/sessions'
import type { Session } from '../../api/sessions'

function matchesUser(usuario: string | { _id: string }, userId: string): boolean {
  if (typeof usuario === 'string') return usuario === userId
  return usuario._id === userId
}

function statusChip(estado: string) {
  const map: Record<string, [string, string]> = {
    abierta:    ['ABIERTA',    'retro-chip-green'],
    publicada:  ['PUBLICADA',  'retro-chip-blue'],
    finalizada: ['FINALIZADA', 'retro-chip-muted'],
    cancelada:  ['CANCELADA',  'retro-chip-red'],
  }
  const [label, cls] = map[estado] ?? [estado.toUpperCase(), 'retro-chip-muted']
  return <span className={`retro-chip ${cls}`}>{label}</span>
}

export function SessionDetail() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mockCount, setMockCount] = useState<1 | 2 | 3>(1)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getSession(id)
      .then(s => {
        setSession(s)
        const inscripcion = s.inscripciones?.find(i => matchesUser(i.usuario, user?._id ?? ''))
        if (inscripcion) setMockCount(inscripcion.mockCount as 1 | 2 | 3)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [id, user?._id, reloadKey])

  if (loading) return <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
  if (error) return <div className="retro-alert retro-alert-error">{error}</div>
  if (!session) return null

  const inscripcion = session.inscripciones?.find(i => matchesUser(i.usuario, user?._id ?? ''))
  const isInscrito = !!inscripcion

  async function handleInscribirse() {
    if (!id) return
    setActionLoading(true); setActionError(null); setActionMsg(null)
    try {
      const res = await registerForSession(id, mockCount)
      setActionMsg(res.mensaje || 'Inscripción realizada')
      setReloadKey(k => k + 1)
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  async function handleCancelar() {
    if (!id) return
    setActionLoading(true); setActionError(null); setActionMsg(null)
    try {
      const res = await cancelRegistration(id)
      setActionMsg(res.mensaje || 'Cancelado')
      setReloadKey(k => k + 1)
    } catch (err) { setActionError(err instanceof Error ? err.message : 'Error') }
    finally { setActionLoading(false) }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.85rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 6 }}>
            {session.nombre}
          </h1>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#7A4F2D' }}>
            {new Date(session.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {statusChip(session.estado)}
      </div>

      {session.descripcion && (
        <div className="retro-alert retro-alert-info" style={{ marginBottom: 20 }}>
          {session.descripcion}
        </div>
      )}

      {/* Abierta */}
      {session.estado === 'abierta' && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header">
            <h2>{isInscrito ? '✓ TU INSCRIPCIÓN' : '✚ INSCRIBIRSE'}</h2>
          </div>
          <div style={{ padding: 20 }}>
            {isInscrito && (
              <div className="retro-alert retro-alert-success" style={{ marginBottom: 16 }}>
                Inscrito con <strong>{inscripcion!.mockCount} mock(s)</strong>. Puedes cambiar la cantidad:
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <span className="retro-label">NÚMERO DE MOCKS</span>
              <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                {([1, 2, 3] as const).map(n => (
                  <label key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontFamily: "'Space Mono', monospace", fontSize: '0.85rem' }}>
                    <input
                      type="radio"
                      name="mockCount"
                      value={n}
                      checked={mockCount === n}
                      onChange={() => setMockCount(n)}
                      style={{ accentColor: '#C9521A', width: 16, height: 16 }}
                    />
                    {n} mock{n > 1 ? 's' : ''}
                  </label>
                ))}
              </div>
            </div>

            {actionLoading && <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#C9521A', marginBottom: 12 }}>PROCESANDO...</div>}
            {actionError && <div className="retro-alert retro-alert-error" style={{ marginBottom: 12 }}>{actionError}</div>}
            {actionMsg && <div className="retro-alert retro-alert-success" style={{ marginBottom: 12 }}>✓ {actionMsg}</div>}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" onClick={handleInscribirse} disabled={actionLoading}>
                {isInscrito ? 'ACTUALIZAR' : 'INSCRIBIRSE'}
              </Button>
              {isInscrito && (
                <Button bg="#FBF3E3" textColor="#C62828" shadow="#1A0F08" borderColor="#C62828" onClick={handleCancelar} disabled={actionLoading}>
                  CANCELAR
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Publicada */}
      {session.estado === 'publicada' && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header"><h2>🎉 EMPAREJAMIENTOS PUBLICADOS</h2></div>
          <div style={{ padding: 20 }}>
            <div className="retro-alert retro-alert-success" style={{ marginBottom: 16 }}>
              ¡Los emparejamientos están disponibles! Ya puedes ver tu pareja asignada.
            </div>
            <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" onClick={() => navigate(`/sessions/${session._id}/match`)}>
              VER MI PAREJA →
            </Button>
          </div>
        </Card>
      )}

      {/* Other states */}
      {session.estado !== 'abierta' && session.estado !== 'publicada' && (
        <div className="retro-alert retro-alert-info">
          Esta sesión está <strong>{session.estado}</strong> y no acepta inscripciones.
        </div>
      )}
    </div>
  )
}
