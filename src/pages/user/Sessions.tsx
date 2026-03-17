import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { getSessions } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { formatDate } from '../../utils/date'

type SessionFilter = 'all' | 'abierta' | 'publicada'

function sortByCutoffDate(left: Session, right: Session) {
  const leftAt = new Date(left.fechaProgramada).getTime()
  const rightAt = new Date(right.fechaProgramada).getTime()

  if (!Number.isFinite(leftAt) && !Number.isFinite(rightAt)) {
    return 0
  }

  if (!Number.isFinite(leftAt)) {
    return 1
  }

  if (!Number.isFinite(rightAt)) {
    return -1
  }

  return rightAt - leftAt
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

export function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filter, setFilter] = useState<SessionFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    getSessions()
      .then(setSessions)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  const orderedSessions = [...sessions].sort(sortByCutoffDate)
  const visibleSessions = orderedSessions.filter((session) => {
    if (filter === 'all') {
      return true
    }

    return session.estado === filter
  })

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 6 }}>
          📅 SESIONES
        </h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
          Inscríbete en una sesión de mock interview
        </p>
      </div>

      {loading && (
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A', marginBottom: 16 }}>
          CARGANDO SESIONES...
        </div>
      )}
      {error && <div className="retro-alert retro-alert-error">{error}</div>}

      {!loading && !error && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header">
            <h2>LISTA DE SESIONES</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 12px 8px 12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', fontWeight: 700 }}>
                MOSTRAR
              </span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.currentTarget.value as SessionFilter)}
                style={{
                  minHeight: 34,
                  border: '2px solid #1A0F08',
                  background: '#FFFDF7',
                  color: '#1A0F08',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                }}
              >
                <option value="all">TODAS</option>
                <option value="abierta">ABIERTA</option>
                <option value="publicada">PUBLICADA</option>
              </select>
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D' }}>
              {visibleSessions.length} resultado{visibleSessions.length === 1 ? '' : 's'}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="retro-table">
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>CIERRE</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {visibleSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, fontFamily: "'Space Mono', monospace", color: '#7A4F2D' }}>
                      No hay sesiones para este filtro
                    </td>
                  </tr>
                ) : (
                  visibleSessions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 700 }}>{s.titulo}</td>
                      <td>{formatDate(s.fechaProgramada, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{statusChip(s.estado)}</td>
                      <td>
                        <Button
                          bg="#C9521A"
                          textColor="#FFFDF7"
                          shadow="#1A0F08"
                          borderColor="#1A0F08"
                          onClick={() => navigate(`/sessions/${s._id}`)}
                        >
                          VER →
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
