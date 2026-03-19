import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import type {
  CursorPosition,
  EditorSettings,
  ParticipantPresence,
  SelectionRange,
  SupportedLanguage,
} from '../types'

interface CollaborativeEditorProps {
  code: string
  language: SupportedLanguage
  participants: ParticipantPresence[]
  localClientId?: string
  onChange: (code: string) => void
  onCursorChange?: (cursorPosition: CursorPosition) => void
  onSelectionChange?: (selectionRange: SelectionRange) => void
  settings?: EditorSettings
}

interface RemoteCursorWidgetEntry {
  widget: MonacoEditor.IContentWidget
  node: HTMLDivElement
  labelNode: HTMLSpanElement
  state: { position: CursorPosition }
}

export function CollaborativeEditor({
  code,
  language,
  participants,
  localClientId,
  onChange,
  onCursorChange,
  onSelectionChange,
  settings,
}: CollaborativeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null)
  const decorationIdsRef = useRef<string[]>([])
  const isApplyingExternalCodeRef = useRef(false)
  const cursorWidgetsRef = useRef<Map<string, RemoteCursorWidgetEntry>>(new Map())
  const onCursorChangeRef = useRef(onCursorChange)
  const onSelectionChangeRef = useRef(onSelectionChange)

  const remoteParticipants = participants.filter(
    (p) => p.connected && p.clientId !== localClientId,
  )

  useEffect(() => { onCursorChangeRef.current = onCursorChange }, [onCursorChange])
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])

  const applyPresenceDecorations = () => {
    const editor = editorRef.current
    if (!editor) return

    const decorations = remoteParticipants.flatMap((p) => {
      if (!p.selectionRange) return []
      return [{
        range: p.selectionRange,
        options: {
          className: 'lc-remote-selection',
          inlineClassName: 'lc-remote-selection__inline',
          minimap: { color: p.color, position: 2 },
          overviewRuler: { color: p.color, position: 7 },
        },
      }]
    })

    decorationIdsRef.current = editor.deltaDecorations(decorationIdsRef.current, decorations)
  }

  const syncRemoteCursorWidgets = () => {
    const editor = editorRef.current
    if (!editor) return

    const showCursors = settings?.showRemoteCursors !== false
    const showLabels = settings?.showRemoteLabels !== false
    const nextIds = new Set<string>()

    if (!showCursors) {
      for (const [id, w] of cursorWidgetsRef.current.entries()) {
        editor.removeContentWidget(w.widget)
        cursorWidgetsRef.current.delete(id)
      }
      return
    }

    for (const p of remoteParticipants) {
      if (!p.cursorPosition) continue
      nextIds.add(p.participantId)

      const existing = cursorWidgetsRef.current.get(p.participantId)
      if (existing) {
        existing.state.position = p.cursorPosition
        existing.labelNode.textContent = p.displayName
        existing.labelNode.style.display = showLabels ? '' : 'none'
        existing.node.style.setProperty('--remote-color', p.color)
        editor.layoutContentWidget(existing.widget)
        continue
      }

      const widgetNode = document.createElement('div')
      widgetNode.className = 'lc-remote-cursor-widget'
      widgetNode.style.setProperty('--remote-color', p.color)

      const barNode = document.createElement('span')
      barNode.className = 'lc-remote-cursor-widget__bar'

      const labelNode = document.createElement('span')
      labelNode.className = 'lc-remote-cursor-widget__label'
      labelNode.textContent = p.displayName
      labelNode.style.display = showLabels ? '' : 'none'

      widgetNode.append(barNode, labelNode)

      const widgetState = { position: p.cursorPosition }

      const widget: MonacoEditor.IContentWidget = {
        allowEditorOverflow: true,
        getDomNode: () => widgetNode,
        getId: () => `lc-cursor-${p.participantId}`,
        getPosition: () => ({
          position: widgetState.position,
          preference: [0],
        }),
      }

      cursorWidgetsRef.current.set(p.participantId, { widget, node: widgetNode, labelNode, state: widgetState })
      editor.addContentWidget(widget)
    }

    for (const [id, w] of cursorWidgetsRef.current.entries()) {
      if (nextIds.has(id)) continue
      editor.removeContentWidget(w.widget)
      cursorWidgetsRef.current.delete(id)
    }
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    const syncFonts = () => {
      monaco.editor.remeasureFonts()
      editor.layout()
    }

    monaco.editor.defineTheme('livecode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#101418',
        'editor.lineHighlightBackground': '#172027',
        'editorCursor.foreground': '#ffd166',
        'editor.selectionBackground': '#2f4858aa',
      },
    })

    monaco.editor.setTheme('livecode-dark')
    syncFonts()

    if (typeof document !== 'undefined' && 'fonts' in document) {
      void document.fonts.ready.then(syncFonts)
    }

    applyPresenceDecorations()
    syncRemoteCursorWidgets()

    const pos = editor.getPosition()
    if (pos) onCursorChangeRef.current?.(pos)

    const sel = editor.getSelection()
    if (sel) onSelectionChangeRef.current?.(sel)

    editor.onDidChangeCursorPosition((e) => onCursorChangeRef.current?.(e.position))
    editor.onDidChangeCursorSelection((e) => onSelectionChangeRef.current?.(e.selection))
  }

  useEffect(() => {
    applyPresenceDecorations()
    syncRemoteCursorWidgets()
  }, [participants, localClientId, settings?.showRemoteCursors, settings?.showRemoteLabels])

  useEffect(() => {
    return () => {
      const editor = editorRef.current
      if (!editor) return
      for (const w of cursorWidgetsRef.current.values()) {
        editor.removeContentWidget(w.widget)
      }
      cursorWidgetsRef.current.clear()
    }
  }, [])

  useEffect(() => {
    const editor = editorRef.current
    if (!editor) return

    const model = editor.getModel()
    if (!model) return

    if (model.getValue() === code) return

    const viewState = editor.saveViewState()
    isApplyingExternalCodeRef.current = true
    editor.executeEdits('external-sync', [{
      range: model.getFullModelRange(),
      text: code,
      forceMoveMarkers: true,
    }])
    if (viewState) editor.restoreViewState(viewState)
    isApplyingExternalCodeRef.current = false
  }, [code])

  return (
    <section className="lc-panel lc-editor-shell">
      <div className="lc-editor-header">
        <div className="lc-remote-legend">
          {remoteParticipants.map((p) => (
            <span className="lc-remote-legend__item" key={p.participantId}>
              <span className="lc-remote-legend__swatch" style={{ backgroundColor: p.color }} />
              {p.displayName}
            </span>
          ))}
        </div>
      </div>

      <div className="lc-editor-frame">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          defaultValue={code}
          onMount={handleMount}
          onChange={(value) => {
            if (isApplyingExternalCodeRef.current) return
            onChange(value ?? '')
          }}
          options={{
            fontFamily: 'Consolas, "Cascadia Code", "SFMono-Regular", Menlo, Monaco, monospace',
            fontSize: settings?.fontSize ?? 15,
            lineHeight: Math.round((settings?.fontSize ?? 15) * 1.47),
            fontLigatures: false,
            smoothScrolling: true,
            minimap: { enabled: settings?.minimap !== false },
            padding: { top: 20 },
            scrollBeyondLastLine: false,
            wordWrap: settings?.wordWrap !== false ? 'on' : 'off',
            glyphMargin: false,
            tabSize: settings?.tabSize ?? 2,
            insertSpaces: true,
            detectIndentation: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            formatOnPaste: true,
            guides: { indentation: true, bracketPairs: true },
          }}
        />
      </div>
    </section>
  )
}
