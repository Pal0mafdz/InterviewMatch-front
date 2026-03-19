import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { AuthBrand } from '../../components/AuthBrand'
import { useAuth } from '../../context/useAuth'
import { verifyEmail } from '../../api/auth'
import { toast } from 'react-hot-toast'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'

export function VerifyEmail() {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Obtener el email del estado de navegación
  const email = location.state?.email || ''

  useDocumentTitle('Verificar Cuenta')

  useEffect(() => {
    // Si ya está autenticado, redirigir
    if (user) {
      navigate('/sessions', { replace: true })
    }
    // Si no hay email en el estado, redirigir a login
    if (!email && !user) {
      navigate('/login', { replace: true })
    }
  }, [user, email, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (code.length !== 4) {
      toast.error('El código debe tener 4 dígitos')
      return
    }
    
    setError(null)
    setLoading(true)
    try {
      const res = await verifyEmail(email, code)
      // Una vez verificado, el backend nos devuelve el token y el usuario
      login(res, res.token)
      toast.success('¡Cuenta verificada exitosamente!')
      navigate('/sessions')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto')
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
            <h2>VERIFICAR CUENTA</h2>
          </div>
          <div style={{ padding: '20px 20px 24px' }}>
            <p style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: '0.85rem',
              color: '#7A4F2D',
              textAlign: 'center',
              marginBottom: 20,
              lineHeight: 1.5
            }}>
              Hemos enviado un código de 4 dígitos a:<br/>
              <strong style={{ color: '#C9521A' }}>{email}</strong>
            </p>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="retro-alert retro-alert-error" style={{ marginBottom: 16 }}>
                  ⚠ {error}
                </div>
              )}

              <div className="retro-form-field">
                <label className="retro-label" htmlFor="code" style={{ textAlign: 'center', display: 'block', width: '100%' }}>CÓDIGO DE VERIFICACIÓN</label>
                <div className="retro-auth-input-wrap">
                  <input
                    id="code"
                    className="retro-auth-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="0000"
                    style={{ textAlign: 'center', letterSpacing: '0.5em', fontSize: '1.5rem' }}
                    required
                  />
                  <span className="retro-auth-input-icon" aria-hidden="true">🔑</span>
                </div>
              </div>

              {loading && (
                <div style={{ marginBottom: 16, fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A', textAlign: 'center' }}>
                  VERIFICANDO...
                </div>
              )}

              <Button
                type="submit"
                bg="#C9521A"
                textColor="#FFFDF7"
                shadow="#1A0F08"
                borderColor="#1A0F08"
                disabled={loading || code.length !== 4}
                style={{ width: '100%' }}
              >
                {loading ? 'VALIDANDO...' : 'VERIFICAR'}
              </Button>

              <p style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: '0.72rem',
                color: '#7A4F2D',
                textAlign: 'center',
                marginTop: 16,
              }}>
                ¿No recibiste el código?{' '}
                <Link to="/register" style={{ color: '#C9521A', fontWeight: 700 }}>
                  Intenta registrarte de nuevo
                </Link>
              </p>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}
