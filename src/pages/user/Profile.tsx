import { useEffect, useState } from 'react'
import { Button, Card } from 'pixel-retroui'
import { useAuth } from '../../context/useAuth'
import { getProfile, uploadCV } from '../../api/users'
import type { UserProfile } from '../../api/users'
import { STATIC_BASE_URL } from '../../api/constants'

export function Profile() {
  const { logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  useEffect(() => {
    getProfile()
      .then(setProfile)
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setUploadError('Solo se aceptan archivos PDF'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('El archivo no puede superar 5MB'); return }
    setUploading(true); setUploadError(null); setUploadMsg(null)
    try {
      const res = await uploadCV(file)
      setUploadMsg('CV subido correctamente')
      setProfile(prev => prev ? { ...prev, cv: res.cv } : prev)
    } catch (err) { setUploadError(err instanceof Error ? err.message : 'Error') }
    finally { setUploading(false) }
  }

  if (loading) return <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
  if (error) return <div className="retro-alert retro-alert-error">{error}</div>
  if (!profile) return null

  return (
    <div style={{ maxWidth: 520 }}>
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 20 }}>
        👤 MI PERFIL
      </h1>

      {/* User info */}
      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="retro-section-header"><h2>DATOS DE CUENTA</h2></div>
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div className="retro-avatar retro-avatar-md">{profile.nombre.charAt(0).toUpperCase()}</div>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem', color: '#1A0F08', lineHeight: 1.8 }}>{profile.nombre}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#7A4F2D' }}>{profile.email}</div>
            </div>
            <span className={`retro-chip ${profile.rol === 'admin' ? 'retro-chip-red' : 'retro-chip-muted'}`} style={{ marginLeft: 'auto' }}>
              {profile.rol.toUpperCase()}
            </span>
          </div>
        </div>
      </Card>

      {/* CV section */}
      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="retro-section-header"><h2>📄 CURRICULUM VITAE</h2></div>
        <div style={{ padding: 20 }}>
          {profile.cv ? (
            <div className="retro-alert retro-alert-success" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>✓ CV cargado</span>
              <a href={`${STATIC_BASE_URL}${profile.cv}`} target="_blank" rel="noreferrer"
                style={{ color: '#C9521A', fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem' }}>
                VER →
              </a>
            </div>
          ) : (
            <div className="retro-alert retro-alert-info" style={{ marginBottom: 14 }}>
              No tienes CV cargado aún.
            </div>
          )}
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', marginBottom: 14 }}>
            Sube tu CV en PDF (máx. 5MB). Tu pareja podrá descargarlo.
          </p>
          <label>
            <Button bg="#FBF3E3" textColor="#C9521A" shadow="#1A0F08" borderColor="#C9521A" disabled={uploading} style={{ cursor: 'pointer' }}>
              {uploading ? 'SUBIENDO...' : '📎 SUBIR CV (PDF)'}
            </Button>
            <input type="file" accept=".pdf,application/pdf" hidden onChange={handleCVUpload} />
          </label>
          {uploading && <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.5rem', color: '#C9521A', marginTop: 10 }}>SUBIENDO...</div>}
          {uploadError && <div className="retro-alert retro-alert-error" style={{ marginTop: 12 }}>{uploadError}</div>}
          {uploadMsg && <div className="retro-alert retro-alert-success" style={{ marginTop: 12 }}>✓ {uploadMsg}</div>}
        </div>
      </Card>

      <Button bg="#FBF3E3" textColor="#7A4F2D" shadow="#1A0F08" borderColor="#1A0F08" onClick={logout}>
        🚪 CERRAR SESIÓN
      </Button>
    </div>
  )
}
