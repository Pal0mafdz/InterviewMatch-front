import { useEffect, useRef, useState } from 'react'
import { Button, Card } from 'pixel-retroui'
import { useAuth } from '../../context/useAuth'
import { getProfile, updateProfile, uploadCV, type PublicProfiles, type UserProfile } from '../../api/users'
import { STATIC_BASE_URL } from '../../api/constants'
import { formatDate } from '../../utils/date'

function buildCvDownloadName(nombre: string) {
  return `${nombre} - CV.pdf`
}

function emptyProfiles(): PublicProfiles {
  return {
    leetcode: '',
    codeforces: '',
    linkedin: '',
    github: '',
  }
}

function platformLabel(platform: keyof PublicProfiles) {
  return {
    leetcode: 'LeetCode',
    codeforces: 'Codeforces',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  }[platform]
}

export function Profile() {
  const { logout, updateUser } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [nombre, setNombre] = useState('')
  const [bio, setBio] = useState('')
  const [publicProfiles, setPublicProfiles] = useState<PublicProfiles>(emptyProfiles())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getProfile()
      .then((nextProfile) => {
        setProfile(nextProfile)
        setNombre(nextProfile.nombre)
        setBio(nextProfile.bio ?? '')
        setPublicProfiles({ ...emptyProfiles(), ...(nextProfile.publicProfiles || {}) })
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Error'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCVUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { setUploadError('Solo se aceptan archivos PDF'); return }
    if (file.size > 5 * 1024 * 1024) { setUploadError('El archivo no puede superar 5MB'); return }
    setUploading(true)
    setUploadError(null)
    setUploadMsg(null)
    try {
      const res = await uploadCV(file)
      setUploadMsg('CV subido correctamente')
      setProfile(prev => prev ? { ...prev, cvPath: res.cvPath } : prev)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveProfile() {
    if (!profile) {
      return
    }

    setSaving(true)
    setSaveMsg(null)
    setSaveError(null)

    try {
      const updated = await updateProfile({ nombre, bio, publicProfiles })
      setProfile(updated)
      setNombre(updated.nombre)
      setBio(updated.bio ?? '')
      setPublicProfiles({ ...emptyProfiles(), ...(updated.publicProfiles || {}) })
      updateUser(updated)
      setSaveMsg('Perfil actualizado')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'No se pudo guardar el perfil')
    } finally {
      setSaving(false)
    }
  }

  function updatePublicProfile(platform: keyof PublicProfiles, value: string) {
    setPublicProfiles((current) => ({
      ...current,
      [platform]: value,
    }))
  }

  if (loading) return <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>
  if (error) return <div className="retro-alert retro-alert-error">{error}</div>
  if (!profile) return null

  const publicLinks = Object.entries(publicProfiles).filter(([, value]) => value.trim())

  return (
    <div style={{ maxWidth: 860, display: 'grid', gap: 20 }}>
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 0 }}>
        👤 MI PERFIL
      </h1>

      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="retro-section-header"><h2>RESUMEN DE CUENTA</h2></div>
        <div style={{ padding: 20, display: 'grid', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            <div className="retro-avatar retro-avatar-md">{profile.nombre.charAt(0).toUpperCase()}</div>
            <div style={{ minWidth: 240, flex: 1 }}>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem', color: '#1A0F08', lineHeight: 1.8 }}>{profile.nombre}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>{profile.email}</div>
            </div>
            <span className={`retro-chip ${profile.rol === 'admin' ? 'retro-chip-red' : 'retro-chip-muted'}`}>
              {profile.rol.toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ border: '2px solid #DFC99A', background: '#FFF8D6', padding: 12 }}>
              <div className="retro-label">ALTA</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>
                {profile.createdAt ? formatDate(profile.createdAt, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </div>
            </div>
            <div style={{ border: '2px solid #DFC99A', background: '#FFF8D6', padding: 12 }}>
              <div className="retro-label">CV</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>{profile.cvPath ? 'Cargado' : 'Pendiente'}</div>
            </div>
            <div style={{ border: '2px solid #DFC99A', background: '#FFF8D6', padding: 12 }}>
              <div className="retro-label">LINKS PÚBLICOS</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem' }}>{publicLinks.length}</div>
            </div>
          </div>
        </div>
      </Card>

      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="retro-section-header"><h2>PERFIL PÚBLICO</h2></div>
        <div style={{ padding: 20, display: 'grid', gap: 16 }}>
          <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D', margin: 0 }}>
            Esto es lo que tu pareja puede ver: tu nombre, bio, CV y enlaces públicos. Tu email no se comparte.
          </p>

          <div>
            <label className="retro-label" htmlFor="profile-name">NOMBRE</label>
            <input
              id="profile-name"
              value={nombre}
              onChange={(event) => setNombre(event.currentTarget.value)}
              style={{ width: '100%', border: '2px solid #1A0F08', background: '#FFFDF7', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '0.82rem' }}
            />
          </div>

          <div>
            <label className="retro-label" htmlFor="profile-bio">BIO</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(event) => setBio(event.currentTarget.value)}
              rows={5}
              placeholder="Qué te gusta practicar, stack, nivel, tipo de feedback que buscas..."
              style={{ width: '100%', border: '2px solid #1A0F08', background: '#FFFDF7', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '0.82rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
            {(Object.keys(publicProfiles) as Array<keyof PublicProfiles>).map((platform) => (
              <div key={platform}>
                <label className="retro-label" htmlFor={`profile-${platform}`}>{platformLabel(platform)}</label>
                <input
                  id={`profile-${platform}`}
                  value={publicProfiles[platform]}
                  onChange={(event) => updatePublicProfile(platform, event.currentTarget.value)}
                  placeholder={platform === 'leetcode' ? 'usuario o https://leetcode.com/u/...' : platform === 'codeforces' ? 'usuario o https://codeforces.com/profile/...' : platform === 'linkedin' ? 'usuario, in/usuario o https://linkedin.com/in/...' : 'usuario o https://github.com/...'}
                  style={{ width: '100%', border: '2px solid #1A0F08', background: '#FFFDF7', padding: '10px 12px', fontFamily: "'Space Mono', monospace", fontSize: '0.78rem' }}
                />
              </div>
            ))}
          </div>

          {saveError ? <div className="retro-alert retro-alert-error">{saveError}</div> : null}
          {saveMsg ? <div className="retro-alert retro-alert-success">✓ {saveMsg}</div> : null}

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'GUARDANDO...' : 'GUARDAR PERFIL'}
            </Button>
          </div>
        </div>
      </Card>

      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="retro-section-header"><h2>📄 CURRICULUM VITAE</h2></div>
        <div style={{ padding: 20 }}>
          {profile.cvPath ? (
            <div className="retro-alert retro-alert-success" style={{ marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span>✓ CV cargado y visible para tu pareja</span>
              <a href={`${STATIC_BASE_URL}${profile.cvPath}`} download={buildCvDownloadName(profile.nombre)} target="_blank" rel="noreferrer"
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
            Sube tu CV en PDF (máx. 5MB). Las personas que hagan mock contigo podrán descargarlo.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Button
              bg="#FBF3E3"
              textColor="#C9521A"
              shadow="#1A0F08"
              borderColor="#C9521A"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              {uploading ? 'SUBIENDO...' : '📎 SUBIR CV (PDF)'}
            </Button>
            <input
              type="file"
              accept=".pdf,application/pdf"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleCVUpload}
            />
          </div>
          {uploadError && <div className="retro-alert retro-alert-error" style={{ marginTop: 12 }}>{uploadError}</div>}
          {uploadMsg && <div className="retro-alert retro-alert-success" style={{ marginTop: 12 }}>✓ {uploadMsg}</div>}
        </div>
      </Card>

      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="retro-section-header"><h2>VISTA PREVIA PÚBLICA</h2></div>
        <div style={{ padding: 20, display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="retro-avatar">{nombre.trim().charAt(0).toUpperCase() || '?'}</div>
            <div>
              <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.65rem' }}>{nombre || 'Sin nombre'}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#7A4F2D' }}>Email oculto para otros users</div>
            </div>
          </div>

          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', color: '#7A4F2D', borderLeft: '3px solid #C9521A', paddingLeft: 10 }}>
            {bio.trim() || 'Agrega una bio corta para que tu pareja entienda mejor tu contexto técnico.'}
          </div>

          {publicLinks.length > 0 ? (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {publicLinks.map(([platform, value]) => (
                <a key={platform} href={value} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08">
                    {platformLabel(platform as keyof PublicProfiles)}
                  </Button>
                </a>
              ))}
            </div>
          ) : (
            <div className="retro-alert retro-alert-info">Todavía no agregaste links públicos.</div>
          )}
        </div>
      </Card>

      <div>
        <Button bg="#FBF3E3" textColor="#7A4F2D" shadow="#1A0F08" borderColor="#1A0F08" onClick={logout}>
          🚪 CERRAR SESIÓN
        </Button>
      </div>
    </div>
  )
}
