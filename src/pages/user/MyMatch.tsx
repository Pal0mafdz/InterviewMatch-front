import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Win98Window } from '../../components/Win98Window'
import { getMyMatch } from '../../api/matches'
import type { MyMatchResponse } from '../../api/matches'
import { STATIC_BASE_URL } from '../../api/constants'

function PartnerCard({ slot, pareja }: { slot: number; pareja: MyMatchResponse['matches'][number]['pareja'] }) {
  return (
    <div className="sunken-panel" style={{ padding: 12, marginBottom: 12 }}>
      <h3 style={{ marginTop: 0 }}>Slot {slot}: {pareja.nombre}</h3>
      <div className="field-row-stacked" style={{ marginBottom: 6 }}>
        <strong>Email:</strong> {pareja.email}
      </div>
      {pareja.bio && (
        <div className="field-row-stacked" style={{ marginBottom: 6 }}>
          <strong>Bio:</strong> {pareja.bio}
        </div>
      )}
      {pareja.linkReunion && (
        <div className="field-row-stacked" style={{ marginBottom: 6 }}>
          <strong>Link reunión:</strong>{' '}
          <a href={pareja.linkReunion} target="_blank" rel="noreferrer">{pareja.linkReunion}</a>
        </div>
      )}
      {pareja.cv && (
        <div style={{ marginTop: 8 }}>
          <a href={`${STATIC_BASE_URL}${pareja.cv}`} download className="button">
            Descargar CV
          </a>
        </div>
      )}
    </div>
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
        if (status === 404) {
          setNotPublished(true)
        } else {
          setError(err instanceof Error ? err.message : 'Error')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <Win98Window title="Mi Pareja"><progress style={{ width: '100%' }}></progress></Win98Window>

  if (notPublished) {
    return (
      <Win98Window title="Mi Pareja">
        <p>⏳ Los emparejamientos aún no se han publicado.</p>
        <p>Vuelve más tarde cuando el administrador publique los pares.</p>
      </Win98Window>
    )
  }

  if (error) return <Win98Window title="Mi Pareja"><p style={{ color: 'red' }}>⚠ {error}</p></Win98Window>
  if (!matchData) return null

  return (
    <Win98Window title="Mi Pareja de Mock Interview">
      {matchData.totalMocks === 1 ? (
        <PartnerCard slot={1} pareja={matchData.matches[0].pareja} />
      ) : (
        <>
          <p>Tienes <strong>{matchData.totalMocks} mocks</strong> programados. Tus parejas:</p>
          {matchData.matches.map(m => (
            <PartnerCard key={m.slot} slot={m.slot} pareja={m.pareja} />
          ))}
        </>
      )}
    </Win98Window>
  )
}
