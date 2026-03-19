import type { ParticipantPresence, ParticipantRole } from '../types'

const ROLE_LABELS: Record<ParticipantRole, { label: string; emoji: string }> = {
  candidate: { label: 'Candidato', emoji: '🎯' },
  interviewer: { label: 'Entrevistador', emoji: '👁️' },
  observer: { label: 'Observador', emoji: '👀' },
}

interface ParticipantListProps {
  participants: ParticipantPresence[]
}

export function ParticipantList({ participants }: ParticipantListProps) {
  return (
    <aside className="lc-panel lc-sidebar">
      <div className="lc-sidebar-header">
        <h2>Participantes</h2>
        <span className="lc-badge">
          {participants.filter((p) => p.connected).length}
        </span>
      </div>

      <div className="lc-participant-list">
        {participants.map((p) => (
          <div className="lc-participant-card" key={p.participantId}>
            <div className="lc-participant-card__identity">
              <span
                className="lc-participant-card__avatar"
                style={{ backgroundColor: p.color }}
                aria-hidden="true"
              >
                {p.displayName.slice(0, 1)}
              </span>
              <div>
                <div className="lc-participant-card__name-row">
                  <strong>{p.displayName}</strong>
                  <span className={`lc-status-dot ${p.connected ? 'is-online' : 'is-offline'}`} />
                </div>
                <p>{ROLE_LABELS[p.role]?.emoji} {ROLE_LABELS[p.role]?.label ?? p.role}</p>
              </div>
            </div>
            {p.cursorPosition ? (
              <p className="lc-participant-card__meta">
                Cursor: L{p.cursorPosition.lineNumber}, C{p.cursorPosition.column}
              </p>
            ) : (
              <p className="lc-participant-card__meta">Sin actividad reciente</p>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
