import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button, Card, Input } from 'pixel-retroui'
import { useAuth } from '../../context/useAuth'
import { login as apiLogin } from '../../api/auth'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F0E4CC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 48,
            height: 48,
            backgroundColor: '#C9521A',
            border: '3px solid #1A0F08',
            boxShadow: '4px 4px 0 #1A0F08',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>🔥</div>
          <span style={{
            fontFamily: "'Press Start 2P', monospace",
            fontSize: '0.75rem',
            color: '#1A0F08',
            lineHeight: 1.5,
          }}>
            INTERVIEW<br />MATCH
          </span>
        </div>

        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
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
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  bg="#FBF3E3"
                  textColor="#1A0F08"
                  borderColor="#1A0F08"
                  required
                  icon="✉"
                />
              </div>

              <div className="retro-form-field">
                <label className="retro-label" htmlFor="password">CONTRASEÑA</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  bg="#FBF3E3"
                  textColor="#1A0F08"
                  borderColor="#1A0F08"
                  required
                  icon="🔒"
                />
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
