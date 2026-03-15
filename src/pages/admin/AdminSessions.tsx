import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { getSessions } from '../../api/sessions'
import type { Session } from '../../api/sessions'

export function AdminSessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  const estadoLabel: Record<string, string> = {
    abierta: 'Abierta',
    publicada: 'Publicada',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
  }

  return (
    <Win98Window title="Admin — Sesiones">
      <div className="field-row" style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <strong>Gestión de sesiones</strong>
        <Link to="/admin/sessions/new">
          <button className="default">+ Nueva sesión</button>
        </Link>
      </div>
      {loading && <progress style={{ width: '100%' }}></progress>}
      {error && <p style={{ color: 'red' }}>⚠ {error}</p>}
      {!loading && !error && (
        <div className="sunken-panel">
          <table className="interactive" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Inscritos</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No hay sesiones</td></tr>
              ) : (
                sessions.map(s => (
                  <tr key={s._id}>
                    <td>{s.nombre}</td>
                    <td>{new Date(s.fecha).toLocaleDateString('es-ES')}</td>
                    <td>{estadoLabel[s.estado] ?? s.estado}</td>
                    <td>{s.inscripciones?.length ?? '—'}</td>
                    <td>
                      <button onClick={() => navigate(`/admin/sessions/${s._id}`)}>Ver</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Win98Window>
  )
}
