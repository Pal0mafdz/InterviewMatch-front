import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useRoomConnection } from './hooks/useRoomConnection'
import { CollaborativeEditor } from './components/CollaborativeEditor'
import { RoomToolbar } from './components/RoomToolbar'
import { ParticipantList } from './components/ParticipantList'
import { starterCode } from './languages'
import { pickRandomName } from './funnyNames'
import type { EditorSettings } from './types'

const DEFAULT_SETTINGS: EditorSettings = {
  tabSize: 2,
  fontSize: 15,
  wordWrap: true,
  minimap: true,
  showRemoteLabels: true,
  showRemoteCursors: true,
}

export function LiveCodeRoomPage() {
  const params = useParams()
  const { user, token } = useAuth()

  const roomId = params.roomId ?? 'room-0000'
  const fallbackName = useMemo(() => pickRandomName(), [])
  const displayName = user?.nombre ?? fallbackName

  const room = useRoomConnection({
    roomId,
    displayName,
    userId: user?._id ?? null,
    authToken: token,
  })

  const participants = room.state?.participants ?? []
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>(DEFAULT_SETTINGS)

  return (
    <main className="lc-room">
      <div className="lc-room__backdrop lc-room__backdrop--one" />
      <div className="lc-room__backdrop lc-room__backdrop--two" />

      <section className="lc-room-layout">
        <RoomToolbar
          roomId={roomId}
          language={room.state?.language ?? 'javascript'}
          participantCount={participants.filter((p) => p.connected).length}
          sidebarOpen={sidebarOpen}
          settingsOpen={settingsOpen}
          settings={settings}
          onLanguageChange={room.setLanguage}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleSettings={() => setSettingsOpen((v) => !v)}
          onSettingsChange={setSettings}
        />

        <div className={`lc-room-body${sidebarOpen ? '' : ' lc-room-body--full'}`}>
          <CollaborativeEditor
            code={room.state?.code ?? starterCode.javascript}
            language={room.state?.language ?? 'javascript'}
            participants={participants}
            localClientId={room.clientId}
            onChange={room.setCode}
            onCursorChange={room.setCursor}
            onSelectionChange={room.setSelection}
            settings={settings}
          />
          {sidebarOpen && <ParticipantList participants={participants} />}
        </div>
      </section>
    </main>
  )
}
