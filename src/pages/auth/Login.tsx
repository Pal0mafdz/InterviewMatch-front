import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { AuthBrand } from '../../components/AuthBrand'
import { useAuth } from '../../context/useAuth'
import { login as apiLogin } from '../../api/auth'
import { toast } from 'react-hot-toast'

import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  useDocumentTitle('Iniciar Sesion')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres')
      return
    }
    
    setError(null)
    setLoading(true)
    try {
      const res = await apiLogin(email, password)
      login(res, res.token)
      toast.success(`¡Bienvenido, ${res.nombre}!`)
      navigate('/sessions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0E4CC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 16px',
    }}>
      <div className="retro-auth-shell">
        <AuthBrand />

        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', width: '100%' }}>
          <div className="retro-section-header">
            <h2>INICIAR SESIÓN</h2>
          </div>
          <div style={{ padding: '20px 20px 24px' }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="retro-alert retro-alert-error" style={{ marginBottom: 16 }}>
                  ⚠ {error}
                </div>
              )}

              <div className="retro-form-field">
                <label className="retro-label" htmlFor="email">CORREO ELECTRÓNICO</label>
                <div className="retro-auth-input-wrap">
                  <input
                    id="email"
                    className="retro-auth-input"
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    required
                  />
                  <span className="retro-auth-input-icon" aria-hidden="true">✉</span>
                </div>
              </div>

              <div className="retro-form-field">
                <label className="retro-label" htmlFor="password">CONTRASEÑA</label>
                <div className="retro-auth-input-wrap">
                  <input
                    id="password"
                    className="retro-auth-input"
                    autoComplete="current-password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <span className="retro-auth-input-icon" aria-hidden="true">🔒</span>
                </div>
              </div>

              {loading && (
                <div style={{ marginBottom: 16, fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A', textAlign: 'center' }}>
                  CARGANDO...
                </div>
              )}

              <Button
                type="submit"
                bg="#C9521A"
                textColor="#FFFDF7"
                shadow="#1A0F08"
                borderColor="#1A0F08"
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? 'ENTRANDO...' : 'INICIAR SESIÓN'}
              </Button>

              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.72rem',
                color: '#7A4F2D',
                textAlign: 'center',
                marginTop: 16,
              }}>
                ¿Sin cuenta?{' '}
                <Link to="/register" style={{ color: '#C9521A', fontWeight: 700 }}>
                  Regístrate
                </Link>
              </p>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
