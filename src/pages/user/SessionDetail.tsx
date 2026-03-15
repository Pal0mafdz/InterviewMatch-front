import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { useAuth } from '../../context/useAuth'
import { getSession, registerForSession, cancelRegistration } from '../../api/sessions'
import type { Session } from '../../api/sessions'

function matchesUser(usuario: string | { _id: string }, userId: string): boolean {
  if (typeof usuario === 'string') return usuario === userId
  return usuario._id === userId
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
        const inscripcion = s.inscripciones?.find(
          i => matchesUser(i.usuario, user?._id ?? '')
        )
        if (inscripcion) setMockCount(inscripcion.mockCount as 1 | 2 | 3)
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar sesión'))
      .finally(() => setLoading(false))
  }, [id, user?._id, reloadKey])

  const inscripcion = session?.inscripciones?.find(
    i => matchesUser(i.usuario, user?._id ?? '')
  )
  const isInscrito = !!inscripcion

  async function handleInscribirse() {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    setActionMsg(null)
    try {
      const res = await registerForSession(id, mockCount)
      setActionMsg(res.mensaje || 'Inscripción realizada')
      setReloadKey(k => k + 1)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleCancelar() {
    if (!id) return
    setActionLoading(true)
    setActionError(null)
    setActionMsg(null)
    try {
      const res = await cancelRegistration(id)
      setActionMsg(res.mensaje || 'Inscripción cancelada')
      setReloadKey(k => k + 1)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <Win98Window title="Detalle de Sesión"><progress style={{ width: '100%' }}></progress></Win98Window>
  if (error) return <Win98Window title="Detalle de Sesión"><p style={{ color: 'red' }}>⚠ {error}</p></Win98Window>
  if (!session) return null

  return (
    <Win98Window title={session.nombre}>
      <div>
        <div className="field-row-stacked" style={{ marginBottom: 8 }}>
          <strong>Fecha:</strong> {new Date(session.fecha).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
        {session.descripcion && (
          <div className="field-row-stacked" style={{ marginBottom: 8 }}>
            <strong>Descripción:</strong> {session.descripcion}
          </div>
        )}
        <div className="field-row-stacked" style={{ marginBottom: 16 }}>
          <strong>Estado:</strong> {session.estado}
        </div>

        {/* Sesión abierta */}
        {session.estado === 'abierta' && (
          <fieldset>
            <legend>{isInscrito ? 'Tu inscripción' : 'Inscribirse'}</legend>
            {isInscrito && (
              <p>Estás inscrito con <strong>{inscripcion!.mockCount} mock(s)</strong>. Puedes cambiar la cantidad:</p>
            )}
            <div className="field-row">
              {([1, 2, 3] as const).map(n => (
                <label key={n} className="field-row">
                  <input
                    type="radio"
                    name="mockCount"
                    value={n}
                    checked={mockCount === n}
                    onChange={() => setMockCount(n)}
                  />
                  {n} mock{n > 1 ? 's' : ''}
                </label>
              ))}
            </div>
            <div className="field-row" style={{ marginTop: 12, gap: 8 }}>
              <button className="default" onClick={handleInscribirse} disabled={actionLoading}>
                {isInscrito ? 'Actualizar inscripción' : 'Inscribirse'}
              </button>
              {isInscrito && (
                <button onClick={handleCancelar} disabled={actionLoading}>
                  Cancelar inscripción
                </button>
              )}
            </div>
            {actionLoading && <progress style={{ width: '100%', marginTop: 8 }}></progress>}
            {actionError && <p style={{ color: 'red', marginTop: 8 }}>⚠ {actionError}</p>}
            {actionMsg && <p style={{ color: 'green', marginTop: 8 }}>✓ {actionMsg}</p>}
          </fieldset>
        )}

        {/* Sesión publicada */}
        {session.estado === 'publicada' && (
          <div style={{ marginTop: 16 }}>
            <p>Los emparejamientos han sido publicados.</p>
            <button className="default" onClick={() => navigate(`/sessions/${session._id}/match`)}>
              Ver mi pareja →
            </button>
          </div>
        )}

        {/* Otros estados */}
        {session.estado !== 'abierta' && session.estado !== 'publicada' && (
          <p>Esta sesión está <strong>{session.estado}</strong> y no acepta inscripciones.</p>
        )}
      </div>
    </Win98Window>
  )
}
