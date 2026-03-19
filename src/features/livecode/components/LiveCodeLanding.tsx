import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../context/useAuth'
import { createRoom } from '../api/livecodeApi'
import { pickRandomName } from '../funnyNames'
import type { ParticipantRole } from '../types'

const ROLE_OPTIONS: { value: ParticipantRole; label: string }[] = [
  { value: 'candidate', label: 'Candidato' },
  { value: 'interviewer', label: 'Entrevistador' },
  { value: 'observer', label: 'Observador' },
]

export function LiveCodeLanding() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [name, setName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [role, setRole] = useState<ParticipantRole>(() => {
    const saved = localStorage.getItem('livecode-role')
    return (saved === 'interviewer' || saved === 'candidate' || saved === 'observer') ? saved : 'candidate'
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.nombre && !name) {
      setName(user.nombre)
    }
  }, [user?.nombre])

  useEffect(() => {
    localStorage.setItem('livecode-role', role)
  }, [role])

  const handleEnter = () => {
    if (!roomId.trim()) return
    navigate(`/livecode/${roomId}`)
  }

  const handleCreateRoom = async () => {
    setLoading(true)
    try {
      const room = await createRoom({ language: 'javascript' })
      navigate(`/livecode/${room.roomId}`)
    } catch {
      const fallbackId = `room-${Math.floor(Math.random() * 9000) + 1000}`
      navigate(`/livecode/${fallbackId}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lc-landing">
      <section className="lc-hero lc-panel">
        <div className="lc-hero-top">
          <p className="lc-eyebrow">Live Code</p>
          <h1>Código colaborativo en tiempo real</h1>
          <p className="lc-hero-copy">
            Editor compartido con sintaxis coloreada, cursores remotos y
            selecciones en vivo.
          </p>
        </div>

        <div className="lc-hero-grid">
          <label>
            <span>Tu nombre</span>
            <input
              className="lc-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={pickRandomName()}
            />
          </label>
          <label>
            <span>Sala <em className="lc-hint">vacío = nueva sala</em></span>
            <input
              className="lc-input"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="room-xxxx"
            />
          </label>
          <label>
            <span>Rol</span>
            <div className="lc-select-shell">
              <select
                className="lc-input"
                value={role}
                onChange={(e) => setRole(e.target.value as ParticipantRole)}
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </label>
        </div>

        <div className="lc-hero-actions">
          <button
            className="lc-btn lc-btn--primary"
            onClick={roomId.trim() ? handleEnter : handleCreateRoom}
            disabled={loading}
          >
            {roomId.trim() ? 'Entrar a la sala' : 'Crear nueva sala'}
          </button>
        </div>
      </section>
    </main>
  )
}
