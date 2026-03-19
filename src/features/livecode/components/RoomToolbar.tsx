import { ChevronDown, Users, PanelRightClose, PanelRightOpen, Settings, Share2 } from 'lucide-react'
import { useState } from 'react'
import type { SupportedLanguage } from '../types'
import { languageOptions } from '../languages'
import type { EditorSettings } from '../types'

interface RoomToolbarProps {
  roomId: string
  language: SupportedLanguage
  participantCount: number
  sidebarOpen: boolean
  settingsOpen: boolean
  settings: EditorSettings
  onLanguageChange: (language: SupportedLanguage) => void
  onToggleSidebar: () => void
  onToggleSettings: () => void
  onSettingsChange: (s: EditorSettings) => void
}

const TAB_OPTIONS = [2, 4, 8] as const
const FONT_OPTIONS = [12, 13, 14, 15, 16, 18, 20] as const

export function RoomToolbar({
  roomId,
  language,
  participantCount,
  sidebarOpen,
  settingsOpen,
  settings,
  onLanguageChange,
  onToggleSidebar,
  onToggleSettings,
  onSettingsChange,
}: RoomToolbarProps) {
  const SidebarIcon = sidebarOpen ? PanelRightClose : PanelRightOpen
  const [copied, setCopied] = useState(false)

  const handleShare = () => {
    const url = window.location.origin + `/livecode/${roomId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <header className="lc-toolbar lc-panel">
      <div className="lc-toolbar__title-row">
        <span className="lc-pill">{roomId}</span>
      </div>

      <div className="lc-toolbar__controls">
        <label className="lc-select-field">
          <div className="lc-select-shell">
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
            >
              {languageOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown size={16} />
          </div>
        </label>

        <div className="lc-presence-chip">
          <Users size={14} />
          <span>{participantCount}</span>
        </div>

        <button
          className={`lc-icon-btn${settingsOpen ? ' is-active' : ''}`}
          onClick={onToggleSettings}
          title="Configuración"
        >
          <Settings size={16} />
        </button>

        <button
          className={`lc-icon-btn${copied ? ' is-active' : ''}`}
          onClick={handleShare}
          title={copied ? '¡Copiado!' : 'Copiar link de sala'}
        >
          <Share2 size={16} />
        </button>

        <button
          className="lc-icon-btn"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Ocultar panel' : 'Mostrar panel'}
        >
          <SidebarIcon size={16} />
        </button>
      </div>

      {settingsOpen && (
        <div className="lc-settings-dropdown">
          <div className="lc-settings-row">
            <span>Tabulación</span>
            <div className="lc-settings-toggle-group">
              {TAB_OPTIONS.map((n) => (
                <button
                  key={n}
                  className={settings.tabSize === n ? 'is-active' : ''}
                  onClick={() => onSettingsChange({ ...settings, tabSize: n })}
                >{n}</button>
              ))}
            </div>
          </div>
          <div className="lc-settings-row">
            <span>Tamaño fuente</span>
            <div className="lc-select-shell lc-select-shell--sm">
              <select
                value={settings.fontSize}
                onChange={(e) => onSettingsChange({ ...settings, fontSize: Number(e.target.value) })}
              >
                {FONT_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}px</option>
                ))}
              </select>
              <ChevronDown size={14} />
            </div>
          </div>
          <div className="lc-settings-row">
            <span>Word wrap</span>
            <button
              className={`lc-settings-chip${settings.wordWrap ? ' is-active' : ''}`}
              onClick={() => onSettingsChange({ ...settings, wordWrap: !settings.wordWrap })}
            >{settings.wordWrap ? 'On' : 'Off'}</button>
          </div>
          <div className="lc-settings-row">
            <span>Minimap</span>
            <button
              className={`lc-settings-chip${settings.minimap ? ' is-active' : ''}`}
              onClick={() => onSettingsChange({ ...settings, minimap: !settings.minimap })}
            >{settings.minimap ? 'On' : 'Off'}</button>
          </div>
          <div className="lc-settings-row">
            <span>Nombres remotos</span>
            <button
              className={`lc-settings-chip${settings.showRemoteLabels ? ' is-active' : ''}`}
              onClick={() => onSettingsChange({ ...settings, showRemoteLabels: !settings.showRemoteLabels })}
            >{settings.showRemoteLabels ? 'On' : 'Off'}</button>
          </div>
          <div className="lc-settings-row">
            <span>Cursores remotos</span>
            <button
              className={`lc-settings-chip${settings.showRemoteCursors ? ' is-active' : ''}`}
              onClick={() => onSettingsChange({ ...settings, showRemoteCursors: !settings.showRemoteCursors })}
            >{settings.showRemoteCursors ? 'On' : 'Off'}</button>
          </div>
        </div>
      )}
    </header>
  )
}
