import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { getMyMatch } from '../../api/matches'
import type { MyMatchResponse } from '../../api/matches'
import { STATIC_BASE_URL } from '../../api/constants'
import type { PublicProfiles } from '../../api/users'

function buildCvDownloadName(nombre: string | undefined) {
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

function PartnerCard({ slot, partner, enlaceReunion, totalMocks, feedbackAsInterviewer, feedbackAsInterviewee, livecodeOwn, livecodePartner, onOpenChat }: {
  slot: number
  partner: any
  enlaceReunion?: string
  totalMocks: number
  feedbackAsInterviewer?: { path: string } | null
  feedbackAsInterviewee?: { path: string } | null
  livecodeOwn?: { roomId: string; path: string } | null
  livecodePartner?: { roomId: string; path: string } | null
  onOpenChat?: (partnerId: string) => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const publicLinks = Object.entries(partner.publicProfiles || {}).filter(
    (entry): entry is [keyof PublicProfiles, string] => typeof entry[1] === 'string' && entry[1].trim().length > 0
  )

  if (!partner) {
    return (
      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
          <h2>SIN PAREJA ASIGNADA</h2>
           {totalMocks > 1 && <span className="retro-chip retro-chip-muted">MOCK #{slot}</span>}
        </div>
        <div style={{ padding: 20 }}>
          No se te pudo asignar una pareja para este slot. Si crees que esto es un error, contacta al administrador.
        </div>
      </Card>
    )
  }

  return (
    <>
      <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="retro-avatar retro-avatar-sm">{partner.nombre?.charAt(0).toUpperCase()}</div>
            <h2>{partner.nombre}</h2>
          </div>
          {totalMocks > 1 && <span className="retro-chip retro-chip-blue">MOCK #{slot}</span>}
        </div>
        <div style={{ padding: 20 }}>
          <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08" onClick={() => setIsModalOpen(true)}>
            VER PERFIL DE {partner.nombre?.toUpperCase()}
          </Button>
          
          {enlaceReunion && (
            <div style={{ marginTop: 14 }}>
              <span className="retro-label">🔗 LINK REUNIÓN</span>
              <a href={enlaceReunion} target="_blank" rel="noreferrer"
                style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#C9521A' }}>
                {enlaceReunion}
              </a>
            </div>
          )}

          {(feedbackAsInterviewer || livecodePartner) ? (
            <div style={{ marginTop: 18 }}>
              <span className="retro-label">COMO ENTREVISTADOR</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {livecodePartner ? (
                  <a href={livecodePartner.path} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08"
                      title={`Abre el editor de código de ${partner?.nombre || 'tu pareja'} en modo lectura`}>
                      VER CÓDIGO DE {partner?.nombre?.toUpperCase() || 'PAREJA'}
                    </Button>
                  </a>
                ) : null}
                {feedbackAsInterviewer ? (
                  <a href={feedbackAsInterviewer.path} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
                      title="Rellena el formulario de feedback para tu pareja">
                      DAR FEEDBACK
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {(livecodeOwn || feedbackAsInterviewee) ? (
            <div style={{ marginTop: 18 }}>
              <span className="retro-label">COMO ENTREVISTADO</span>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {livecodeOwn ? (
                  <a href={livecodeOwn.path} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08"
                      title="Abre tu editor de código donde resolverás el problema">
                      TU CÓDIGO
                    </Button>
                  </a>
                ) : null}
                {feedbackAsInterviewee ? (
                  <a href={feedbackAsInterviewee.path} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08"
                      title="Disponible cuando tu entrevistador complete el feedback">
                      VER TU FEEDBACK
                    </Button>
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          {partner._id ? (
            <div style={{ marginTop: 14 }}>
              <Button
                bg="#FBF3E3"
                textColor="#1A0F08"
                shadow="#1A0F08"
                borderColor="#1A0F08"
                onClick={() => onOpenChat?.(partner._id)}
              >
                ABRIR CHAT
              </Button>
            </div>
          ) : null}
        </div>
      </Card>

      {isModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: 20
        }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
            <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0 }}>
              <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
                <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.8rem', marginBottom: 0 }}>
                  PERFIL DE {partner.nombre?.toUpperCase()}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem', fontWeight: 'bold', color: '#1A0F08' }}
                >
                  X
                </button>
              </div>
              
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <div className="retro-avatar">{partner.nombre?.charAt(0).toUpperCase()}</div>
                  <h2 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', marginBottom: 0 }}>
                    {partner.nombre}
                  </h2>
                </div>

                {partner.bio && (
                  <div style={{ marginBottom: 16 }}>
                    <span className="retro-label">💬 BIO</span>
                    <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.8rem', color: '#7A4F2D', borderLeft: '3px solid #C9521A', paddingLeft: 10, fontStyle: 'italic' }}>
                      {partner.bio}
                    </div>
                  </div>
                )}

                {publicLinks.length > 0 ? (
                  <div style={{ marginBottom: 16 }}>
                    <span className="retro-label">🌐 LINKS PÚBLICOS</span>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      {publicLinks.map(([platform, value]) => (
                        <a key={platform} href={value} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <Button bg="#FBF3E3" textColor="#1A0F08" shadow="#1A0F08" borderColor="#1A0F08">
                            {platformLabel(platform as keyof PublicProfiles)}
                          </Button>
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}

                {partner.cvPath && (
                  <div style={{ marginTop: 20 }}>
                    <a href={`${STATIC_BASE_URL}${partner.cvPath}`} download={buildCvDownloadName(partner.nombre)} style={{ textDecoration: 'none' }}>
                      <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08" style={{ width: '100%' }}>
                        ⬇ DESCARGAR CV
                      </Button>
                    </a>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </>
  )
}

export function MyMatch() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [matchData, setMatchData] = useState<MyMatchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [notPublished, setNotPublished] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    getMyMatch(id)
      .then(setMatchData)
      .catch(err => {
        const status = (err as Error & { status?: number }).status
        if (status === 404) { setNotPublished(true) }
        else { setError(err instanceof Error ? err.message : 'Error') }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A' }}>CARGANDO...</div>

  if (notPublished) return (
    <div>
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 20 }}>👥 MI PAREJA</h1>
      <div className="retro-alert retro-alert-info">
        <strong>Los emparejamientos aún no se han publicado.</strong><br/>
        Vuelve más tarde cuando el administrador publique los pares.
      </div>
    </div>
  )

  if (error) return <div className="retro-alert retro-alert-error">{error}</div>
  if (!matchData) return null

  return (
    <div>
      <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 6 }}>
        👥 {matchData.totalMocks === 1 ? 'TU PAREJA' : 'TUS PAREJAS'}
      </h1>
      {matchData.totalMocks > 1 && (
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D', marginBottom: 20 }}>
          Tienes <strong>{matchData.totalMocks} mocks</strong> programados
        </p>
      )}
      {!matchData.matches[0] && !matchData.partner ? null : matchData.totalMocks === 1
        ? <PartnerCard key={matchData.matches[0]?.matchId || matchData.matchId || '1'} slot={1} partner={matchData.partner || matchData.matches[0]?.partner} enlaceReunion={matchData.enlaceReunion || matchData.matches[0]?.enlaceReunion} feedbackAsInterviewer={matchData.matches[0]?.feedbackAsInterviewer} feedbackAsInterviewee={matchData.matches[0]?.feedbackAsInterviewee} livecodeOwn={matchData.matches[0]?.livecodeOwn} livecodePartner={matchData.matches[0]?.livecodePartner} totalMocks={1} onOpenChat={(partnerId) => navigate(`/chats?userId=${encodeURIComponent(partnerId)}`)} />
        : matchData.matches.map((m, i) => <PartnerCard key={m.matchId || i} slot={i + 1} partner={m.partner} enlaceReunion={m.enlaceReunion} feedbackAsInterviewer={m.feedbackAsInterviewer} feedbackAsInterviewee={m.feedbackAsInterviewee} livecodeOwn={m.livecodeOwn} livecodePartner={m.livecodePartner} totalMocks={matchData.totalMocks} onOpenChat={(partnerId) => navigate(`/chats?userId=${encodeURIComponent(partnerId)}`)} />)
      }
    </div>
  )
}
