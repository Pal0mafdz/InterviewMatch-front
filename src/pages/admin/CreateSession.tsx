import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, Input } from 'pixel-retroui'
import { createSession } from '../../api/sessions'

export function CreateSession() {
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const parsed = new Date(fecha)
      if (Number.isNaN(parsed.getTime())) {
        throw new Error('Fecha y hora inválidas')
      }
      const session = await createSession({ titulo: nombre, fechaProgramada: parsed.toISOString(), descripcion: descripcion || undefined })
      navigate(`/admin/sessions/${session._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 20 }}>
        ➕ NUEVA SESIÓN
      </h1>

      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="retro-section-header"><h2>INFORMACIÓN DE LA SESIÓN</h2></div>
        <form onSubmit={handleSubmit} style={{ padding: 20 }}>
          {loading && (
            <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#C9521A', marginBottom: 12 }}>
              CREANDO...
            </div>
          )}
          {error && <div className="retro-alert retro-alert-error" style={{ marginBottom: 14 }}>{error}</div>}

          <div style={{ marginBottom: 16 }}>
            <span className="retro-label">NOMBRE DE LA SESIÓN *</span>
            <Input
              bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08"
              placeholder="Nombre de la sesión"
              value={nombre}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNombre(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <span className="retro-label">FECHA Y HORA *</span>
            <input
              type="datetime-local"
              value={fecha}
              onChange={e => setFecha(e.target.value)}
              required
              style={{
                width: '100%',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.8rem',
                padding: '8px 10px',
                border: '2px solid #1A0F08',
                background: '#FBF3E3',
                color: '#1A0F08',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <span className="retro-label">DESCRIPCIÓN (OPCIONAL)</span>
            <textarea
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.8rem',
                padding: '8px 10px',
                border: '2px solid #1A0F08',
                background: '#FBF3E3',
                color: '#1A0F08',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Button
              type="submit"
              bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
              disabled={loading}
            >
              {loading ? 'CREANDO...' : '✓ CREAR SESIÓN'}
            </Button>
            <Button
              type="button"
              bg="#FBF3E3" textColor="#7A4F2D" shadow="#1A0F08" borderColor="#1A0F08"
              onClick={() => navigate('/admin/sessions')}
              disabled={loading}
            >
              ← CANCELAR
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
