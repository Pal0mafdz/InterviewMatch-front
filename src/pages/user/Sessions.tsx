import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { getSessions } from '../../api/sessions'
import type { Session } from '../../api/sessions'
import { formatDate } from '../../utils/date'

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
          <div style={{ overflowX: 'auto' }}>
            <table className="retro-table">
              <thead>
                <tr>
                  <th>NOMBRE</th>
                  <th>FECHA</th>
                  <th>ESTADO</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: 24, fontFamily: "'Space Mono', monospace", color: '#7A4F2D' }}>
                      No hay sesiones disponibles
                    </td>
                  </tr>
                ) : (
                  sessions.map(s => (
                    <tr key={s._id}>
                      <td style={{ fontWeight: 700 }}>{s.titulo}</td>
                      <td>{formatDate(s.fechaProgramada, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
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
