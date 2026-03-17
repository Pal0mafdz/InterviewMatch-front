import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from 'pixel-retroui'
import { getSessions } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { formatDate } from '../../utils/date'

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

export function AdminSessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6 }}>
          🛠 SESIONES
        </h1>
        <Button
          bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
          onClick={() => navigate('/admin/sessions/new')}
        >
          + NUEVA SESIÓN
        </Button>
      </div>

      {loading && (
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
      )}
      {error && <div className="retro-alert retro-alert-error">{error}</div>}
      {!loading && !error && (
        <div style={{ marginBottom: 10, fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D' }}>
          La columna FECHA CORTE se muestra en hora local del usuario.
        </div>
      )}

      {!loading && !error && (
        <table className="retro-table">
          <thead>
            <tr>
              <th>NOMBRE</th>
              <th>FECHA CORTE</th>
              <th>ESTADO</th>
              <th>INSCRITOS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sessions.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#7A4F2D', fontFamily: "'Space Mono', monospace", fontSize: '0.78rem' }}>
                  No hay sesiones creadas
                </td>
              </tr>
            ) : (
              sessions.map(s => (
                <tr key={s._id}>
                  <td style={{ fontWeight: 700 }}>{s.titulo}</td>
                  <td>{formatDate(s.fechaProgramada, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{statusChip(s.estado)}</td>
                  <td>{s.inscripciones?.length ?? '—'}</td>
                  <td>
                    <Button
                      bg="#FBF3E3" textColor="#C9521A" shadow="#1A0F08" borderColor="#C9521A"
                      onClick={() => navigate(`/admin/sessions/${s._id}`)}
                    >
                      VER →
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  )
}
