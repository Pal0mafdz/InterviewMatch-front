import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { getSession } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { getSessionMatches, publishShuffle } from '../../api/matches'
import type { SessionMatch } from '../../api/matches'

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
      // Refresh session state
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

  if (loadingSession) return <Win98Window title="Admin — Detalle de Sesión"><progress style={{ width: '100%' }}></progress></Win98Window>
  if (error) return <Win98Window title="Admin — Detalle de Sesión"><p style={{ color: 'red' }}>⚠ {error}</p></Win98Window>
  if (!session) return null

  return (
    <Win98Window title={`Admin — ${session.nombre}`}>
      {/* Stats */}
      <fieldset style={{ marginBottom: 16 }}>
        <legend>Estadísticas</legend>
        <div className="sunken-panel" style={{ padding: 8 }}>
          <table style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td><strong>Estado:</strong></td>
                <td>{session.estado}</td>
              </tr>
              <tr>
                <td><strong>Fecha:</strong></td>
                <td>{new Date(session.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
              </tr>
              <tr>
                <td><strong>Personas inscritas:</strong></td>
                <td>{personas}</td>
              </tr>
              <tr>
                <td><strong>Mocks activos totales:</strong></td>
                <td>{totalMocks}</td>
              </tr>
              <tr>
                <td><strong>Pares formados:</strong></td>
                <td>{loadingMatches ? '...' : matches.length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </fieldset>

      {/* Shuffle button */}
      {session.estado === 'abierta' && (
        <fieldset style={{ marginBottom: 16 }}>
          <legend>Publicar Shuffle</legend>
          <p>Genera y publica los emparejamientos automáticos para esta sesión.</p>
          <button
            className="default"
            onClick={handleShuffle}
            disabled={shuffling}
          >
            {shuffling ? 'Publicando...' : 'Publicar Shuffle'}
          </button>
          {shuffling && <progress style={{ width: '100%', marginTop: 8 }}></progress>}
          {shuffleError && <p style={{ color: 'red', marginTop: 8 }}>⚠ {shuffleError}</p>}
          {shuffleResult && (
            <div className="sunken-panel" style={{ padding: 8, marginTop: 8 }}>
              <p style={{ margin: 0, color: 'green' }}>
                ✓ Shuffle publicado: <strong>{shuffleResult.pares} pares</strong> formados,{' '}
                <strong>{shuffleResult.pendientes} pendientes</strong> sin pareja.
              </p>
            </div>
          )}
        </fieldset>
      )}

      {/* Matches list */}
      {!loadingMatches && matches.length > 0 && (
        <fieldset>
          <legend>Emparejamientos ({matches.length})</legend>
          <div className="sunken-panel">
            <table className="interactive" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Slot</th>
                  <th>Usuario 1</th>
                  <th>Usuario 2</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((m) => (
                  <tr key={`${m.slot}-${m.usuario1.email}-${m.usuario2.email}`}>
                    <td>{m.slot}</td>
                    <td>{m.usuario1.nombre} ({m.usuario1.email})</td>
                    <td>{m.usuario2.nombre} ({m.usuario2.email})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </fieldset>
      )}
    </Win98Window>
  )
}
