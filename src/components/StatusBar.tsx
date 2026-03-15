import { useAuth } from '../context/useAuth'

export function StatusBar() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div
      className="status-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}
    >
      <p className="status-bar-field">{user.email}</p>
      <p className="status-bar-field">InterviewMatch MVP</p>
      <p className="status-bar-field">● Conectado</p>
    </div>
  )
}
