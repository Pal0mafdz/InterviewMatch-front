import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { getSession } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { getSessionMatches, publishShuffle } from '../../api/matches'
import type { SessionMatch } from '../../api/matches'

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
  const [session, setSession] = useState<Session | null>(null)
  const [matches, setMatches] = useState<SessionMatch[]>([])
  const [loadingSession, setLoadingSession] = useState(true)
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shuffling, setShuffling] = useState(false)
  const [shuffleResult, setShuffleResult] = useState<{ pares: number; pendientes: number } | null>(null)
  const [shuffleError, setShuffleError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getSession(id)
      .then(setSession)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoadingSession(false))

    getSessionMatches(id)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false))
  }, [id])

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
      setShuffleResult({ pares: res.pares, pendientes: res.pendientes })
      const updated = await getSession(id)
      setSession(updated)
    } catch (err) {
      setShuffleError(err instanceof Error ? err.message : 'Error al publicar shuffle')
    } finally {
      setShuffling(false)
    }
  }

  const personas = session?.inscripciones?.length ?? 0
  const totalMocks = session?.inscripciones?.reduce((sum, i) => sum + i.mockCount, 0) ?? 0

  if (loadingSession) return (
    <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
  )
  if (error) return <div className="retro-alert retro-alert-error">{error}</div>
  if (!session) return null

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 4 }}>
            🛠 {session.nombre}
          </h1>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
            {new Date(session.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
        {statusChip(session.estado)}
      </div>

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
              Genera y publica los emparejamientos automáticos. Los usuarios podrán ver sus parejas asignadas.
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
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Matches table */}
      {!loadingMatches && matches.length > 0 && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header"><h2>👥 EMPAREJAMIENTOS ({matches.length})</h2></div>
          <div style={{ padding: 20 }}>
            <table className="retro-table">
              <thead>
                <tr>
                  <th>SLOT</th>
                  <th>USUARIO 1</th>
                  <th>USUARIO 2</th>
                </tr>
              </thead>
              <tbody>
                {matches.map(m => (
                  <tr key={`${m.slot}-${m.usuario1.email}-${m.usuario2.email}`}>
                    <td><span className="retro-chip retro-chip-muted">#{m.slot}</span></td>
                    <td>
                      <strong>{m.usuario1.nombre}</strong>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginLeft: 6 }}>
                        ({m.usuario1.email})
                      </span>
                    </td>
                    <td>
                      <strong>{m.usuario2.nombre}</strong>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginLeft: 6 }}>
                        ({m.usuario2.email})
                      </span>
                    </td>
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
