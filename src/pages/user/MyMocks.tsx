import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Card } from 'pixel-retroui'
import { getMyMatch } from '../../api/matches'
import { getSession, getSessions } from '../../api/sessions'
import { formatDate } from '../../utils/date'

type HistoryFilter = 'all' | 'upcoming' | 'past'

type MockHistoryItem = {
  id: string
  mockLabel: string
  cutoffDate: string
  partnerName: string
  detailsPath: string
}

function sortByMostRecentCutoff(left: MockHistoryItem, right: MockHistoryItem) {
  return new Date(right.cutoffDate).getTime() - new Date(left.cutoffDate).getTime()
}

function timingChip(isUpcoming: boolean) {
  const [label, cls] = isUpcoming
    ? ['PROXIMA', 'retro-chip-green']
    : ['PASADA', 'retro-chip-muted']

  return <span className={`retro-chip ${cls}`}>{label}</span>
}

function matchesFilter(item: MockHistoryItem, filter: HistoryFilter) {
  if (filter === 'all') {
    return true
  }

  const isUpcoming = new Date(item.cutoffDate).getTime() > Date.now()
  return filter === 'upcoming' ? isUpcoming : !isUpcoming
}

export function MyMocks() {
  const navigate = useNavigate()
  const [history, setHistory] = useState<MockHistoryItem[]>([])
  const [filter, setFilter] = useState<HistoryFilter>('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadHistory() {
      setLoading(true)
      setError(null)

      try {
        const sessions = await getSessions()

        const groupedItems = await Promise.all(
          sessions.map(async (session) => {
            try {
              const sessionDetail = await getSession(session._id)
              if (!sessionDetail.currentUserRegistered || !sessionDetail.currentUserMockCount) {
                return [] as MockHistoryItem[]
              }

              const totalMocks = sessionDetail.currentUserMockCount
              let mockPartners: string[] = []
              let detailsPath = `/sessions/${session._id}`

              try {
                const myMatch = await getMyMatch(session._id)
                const matchPartners = myMatch.matches
                  .map((match) => match.partner?.nombre)
                  .filter((name): name is string => Boolean(name))

                mockPartners = matchPartners.length > 0
                  ? matchPartners
                  : (myMatch.partner?.nombre ? [myMatch.partner.nombre] : [])

                detailsPath = `/sessions/${session._id}/match`
              } catch (matchError) {
                const status = (matchError as Error & { status?: number }).status
                if (status !== 404) {
                  throw matchError
                }
              }

              while (mockPartners.length < totalMocks) {
                mockPartners.push('Sin pareja')
              }

              return mockPartners.slice(0, totalMocks).map((partnerName, index) => ({
                id: `${sessionDetail._id}-${index + 1}`,
                mockLabel: `${sessionDetail.titulo} · MOCK #${index + 1}`,
                cutoffDate: sessionDetail.fechaProgramada,
                partnerName,
                detailsPath,
              }))
            } catch {
              return [] as MockHistoryItem[]
            }
          })
        )

        if (!mounted) {
          return
        }

        setHistory(groupedItems.flat().sort(sortByMostRecentCutoff))
      } catch (nextError) {
        if (!mounted) {
          return
        }

        setError(nextError instanceof Error ? nextError.message : 'Error al cargar tu historial de mocks')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void loadHistory()

    return () => {
      mounted = false
    }
  }, [])

  const filteredHistory = useMemo(
    () => history.filter((item) => matchesFilter(item, filter)),
    [history, filter]
  )

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.9rem', color: '#1A0F08', lineHeight: 1.6, marginBottom: 6 }}>
          🗂 MIS MOCKS
        </h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.78rem', color: '#7A4F2D' }}>
          Listado general mezclando todos tus mocks
        </p>
      </div>

      {loading && (
        <div style={{ fontFamily: "'Press Start 2P', monospace", fontSize: '0.55rem', color: '#C9521A', marginBottom: 16 }}>
          CARGANDO HISTORIAL...
        </div>
      )}
      {error && <div className="retro-alert retro-alert-error">{error}</div>}

      {!loading && !error && (
        <Card bg="#FBF3E3" textColor="#1A0F08" borderColor="#1A0F08" shadowColor="#1A0F08" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="retro-section-header">
            <h2>HISTORIAL DE MOCKS</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '12px 12px 8px 12px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D', fontWeight: 700 }}>
                ESTADO
              </span>
              <select
                value={filter}
                onChange={(event) => setFilter(event.currentTarget.value as HistoryFilter)}
                style={{
                  minHeight: 34,
                  border: '2px solid #1A0F08',
                  background: '#FFFDF7',
                  color: '#1A0F08',
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '4px 8px',
                }}
              >
                <option value="all">TODAS</option>
                <option value="upcoming">PROXIMAS</option>
                <option value="past">PASADAS</option>
              </select>
            </div>

            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: '0.72rem', color: '#7A4F2D' }}>
              {filteredHistory.length} resultado{filteredHistory.length === 1 ? '' : 's'}
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="retro-table">
              <thead>
                <tr>
                  <th>MOCK</th>
                  <th>CIERRE</th>
                  <th>ESTADO</th>
                  <th>PAREJA</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 24, fontFamily: "'Space Mono', monospace", color: '#7A4F2D' }}>
                      No hay mocks para este filtro
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item) => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700 }}>{item.mockLabel}</td>
                      <td>{formatDate(item.cutoffDate, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                      <td>{timingChip(new Date(item.cutoffDate).getTime() > Date.now())}</td>
                      <td>{item.partnerName}</td>
                      <td>
                        <Button
                          bg="#C9521A"
                          textColor="#FFFDF7"
                          shadow="#1A0F08"
                          borderColor="#1A0F08"
                          onClick={() => navigate(item.detailsPath)}
                        >
                          VER →
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
