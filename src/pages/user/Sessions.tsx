import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { getSessions } from '../../api/sessions'
import type { Session } from '../../api/sessions'

export function Sessions() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(err => setError(err instanceof Error ? err.message : 'Error al cargar sesiones'))
      .finally(() => setLoading(false))
  }, [])

  const estadoLabel: Record<string, string> = {
    abierta: 'Abierta',
    publicada: 'Publicada',
    finalizada: 'Finalizada',
    cancelada: 'Cancelada',
  }

  return (
    <Win98Window title="Sesiones de Mock Interview">
      <p>Sesiones disponibles para practicar entrevistas técnicas.</p>
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center' }}>No hay sesiones disponibles</td></tr>
              ) : (
                sessions.map(s => (
                  <tr key={s._id}>
                    <td>{s.nombre}</td>
                    <td>{new Date(s.fecha).toLocaleDateString('es-ES')}</td>
                    <td>{estadoLabel[s.estado] ?? s.estado}</td>
                    <td>
                      <button onClick={() => navigate(`/sessions/${s._id}`)}>Ver detalle</button>
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
