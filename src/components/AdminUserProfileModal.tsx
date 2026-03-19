import { Button, Card } from 'pixel-retroui'
import { STATIC_BASE_URL } from '../api/constants'
import type { PublicProfiles } from '../api/users'

type AdminProfileUser = {
  _id: string
  nombre?: string
  email?: string
  rol?: 'user' | 'admin'
  isBlocked?: boolean
  cvPath?: string
  bio?: string
  publicProfiles?: Partial<PublicProfiles>
}

type AdminUserProfileModalProps = {
  user: AdminProfileUser | null
  onClose: () => void
}

function buildCvDownloadName(nombre?: string) {
  return `${nombre || 'Usuario'} - CV.pdf`
}

function platformLabel(platform: keyof PublicProfiles) {
  return {
    leetcode: 'LeetCode',
    codeforces: 'Codeforces',
    linkedin: 'LinkedIn',
    github: 'GitHub',
  }[platform]
}

export function AdminUserProfileModal({ user, onClose }: AdminUserProfileModalProps) {
  if (!user) {
    return null
  }

  const publicLinks = Object.entries(user.publicProfiles || {}).filter(
    (entry): entry is [keyof PublicProfiles, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0
  )

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
            <h2>PERFIL DE USUARIO</h2>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'transparent', border: 'none', color: '#1A0F08', cursor: 'pointer', fontSize: '1.1rem', fontWeight: 700 }}
            >
              X
            </button>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div className="retro-avatar retro-avatar-md">{user.nombre?.charAt(0).toUpperCase() || '?'}</div>
              <div>
                <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.63rem', lineHeight: 1.6 }}>{user.nombre || 'Sin nombre'}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.74rem', color: '#7A4F2D' }}>{user.email || 'Sin correo'}</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              {user.rol === 'admin'
                ? <span className="retro-chip retro-chip-blue">ADMIN</span>
                : <span className="retro-chip retro-chip-green">USER</span>}
              {typeof user.isBlocked === 'boolean' ? (
                user.isBlocked
                  ? <span className="retro-chip retro-chip-red">BLOQUEADO</span>
                  : <span className="retro-chip retro-chip-green">ACTIVO</span>
              ) : null}
            </div>

            <div style={{ marginBottom: 16 }}>
              <span className="retro-label">BIO</span>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', lineHeight: 1.6, color: '#7A4F2D', borderLeft: '3px solid #C9521A', paddingLeft: 10, whiteSpace: 'pre-line' }}>
                {user.bio || 'Sin bio cargada.'}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <span className="retro-label">PERFILES PUBLICOS</span>
              {publicLinks.length > 0 ? (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                  {publicLinks.map(([platform, value]) => (
                    <a key={platform} href={value} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08">
                        {platformLabel(platform)}
                      </Button>
                    </a>
                  ))}
                </div>
              ) : (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.74rem', color: '#7A4F2D', marginTop: 8 }}>
                  Sin perfiles públicos cargados.
                </div>
              )}
            </div>

            {user.cvPath ? (
              <a
                href={`${STATIC_BASE_URL}${user.cvPath}`}
                download={buildCvDownloadName(user.nombre)}
                style={{ textDecoration: 'none' }}
              >
                <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" style={{ width: '100%' }}>
                  ⬇ DESCARGAR CV
                </Button>
              </a>
            ) : (
              <div className="retro-alert retro-alert-info" style={{ marginBottom: 0 }}>
                Este usuario no tiene CV cargado.
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
