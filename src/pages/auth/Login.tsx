import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { useAuth } from '../../context/useAuth'
import { login as apiLogin } from '../../api/auth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      login(res, res.token)
      navigate('/sessions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Win98Window title="Iniciar Sesión" width={420}>
      <form onSubmit={handleSubmit}>
        <div className="field-row-stacked" style={{ marginBottom: 12 }}>
          <label htmlFor="email">Correo electrónico</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field-row-stacked" style={{ marginBottom: 12 }}>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <div style={{ marginBottom: 12, color: 'red' }}>
            ⚠ {error}
          </div>
        )}
        {loading && <progress style={{ width: '100%', marginBottom: 12 }}></progress>}
        <div className="field-row" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" className="default" disabled={loading}>
            Iniciar Sesión
          </button>
        </div>
        <hr />
        <p style={{ margin: '8px 0 0', textAlign: 'center' }}>
          ¿No tienes cuenta? <Link to="/register">Regístrate</Link>
        </p>
      </form>
    </Win98Window>
  )
}
