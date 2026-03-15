import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { getMyMatch } from '../../api/matches'
import type { MyMatchResponse } from '../../api/matches'
import { STATIC_BASE_URL } from '../../api/constants'

function PartnerCard({ slot, pareja, totalMocks }: {
  slot: number
  pareja: MyMatchResponse['matches'][number]['pareja']
  totalMocks: number
}) {
  return (
    <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden', marginBottom: 20 }}>
      <div className="retro-section-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="retro-avatar retro-avatar-sm">{pareja.nombre.charAt(0).toUpperCase()}</div>
          <h2>{pareja.nombre}</h2>
        </div>
        {totalMocks > 1 && <span className="retro-chip retro-chip-blue">MOCK #{slot}</span>}
      </div>
      <div style={{ padding: 20 }}>
        <div style={{ marginBottom: 10, fontFamily: "'Space Mono', monospace", fontSize: '0.78rem' }}>
          <span className="retro-label">✉ EMAIL</span>
          {pareja.email}
        </div>
        {pareja.bio && (
          <div style={{ marginBottom: 10 }}>
            <span className="retro-label">💬 BIO</span>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#7A4F2D', borderLeft: '3px solid #C9521A', paddingLeft: 10, fontStyle: 'italic' }}>
              {pareja.bio}
            </div>
          </div>
        )}
        {pareja.linkReunion && (
          <div style={{ marginBottom: 14 }}>
            <span className="retro-label">🔗 LINK REUNIÓN</span>
            <a href={pareja.linkReunion} target="_blank" rel="noreferrer"
              style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.75rem', color: '#C9521A' }}>
              {pareja.linkReunion}
            </a>
          </div>
        )}
        {pareja.cv && (
          <a href={`${STATIC_BASE_URL}${pareja.cv}`} download style={{ textDecoration: 'none' }}>
            <Button bg="#C9521A" textColor="#FFFDF7" shadow="#1A0F08" borderColor="#1A0F08">
              ⬇ DESCARGAR CV
            </Button>
          </a>
        )}
      </div>
    </Card>
  )
}

export function MyMatch() {
  const { id } = useParams<{ id: string }>()
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
      {!matchData.matches[0] ? null : matchData.totalMocks === 1
        ? <PartnerCard slot={1} pareja={matchData.matches[0].pareja} totalMocks={1} />
        : matchData.matches.map(m => <PartnerCard key={m.slot} slot={m.slot} pareja={m.pareja} totalMocks={matchData.totalMocks} />)
      }
    </div>
  )
}
