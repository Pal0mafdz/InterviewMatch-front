import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { createSession } from '../../api/sessions'

export function CreateSession() {
  const [nombre, setNombre] = useState('')
  const [fecha, setFecha] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const session = await createSession({
        nombre,
        fecha,
        descripcion: descripcion || undefined,
      })
      navigate(`/admin/sessions/${session._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Win98Window title="Admin — Nueva Sesión" width={500}>
      <form onSubmit={handleSubmit}>
        <div className="field-row-stacked" style={{ marginBottom: 12 }}>
          <label htmlFor="nombre">Nombre de la sesión</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
          />
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 12 }}>
          <label htmlFor="fecha">Fecha</label>
          <input
            id="fecha"
            type="date"
            value={fecha}
            onChange={e => setFecha(e.target.value)}
            required
          />
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 16 }}>
          <label htmlFor="descripcion">Descripción (opcional)</label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>
        {error && <p style={{ color: 'red' }}>⚠ {error}</p>}
        {loading && <progress style={{ width: '100%', marginBottom: 8 }}></progress>}
        <div className="field-row" style={{ gap: 8 }}>
          <button type="submit" className="default" disabled={loading}>
            Crear sesión
          </button>
          <button type="button" onClick={() => navigate('/admin/sessions')} disabled={loading}>
            Cancelar
          </button>
        </div>
      </form>
    </Win98Window>
  )
}
