import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { editor as MonacoEditor } from 'monaco-editor'
import type {
  CursorPosition,
  EditorDeltaPayload,
  EditorSettings,
  ParticipantPresence,
  SelectionRange,
  SupportedLanguage,
  TextChange,
} from '../types'

interface CollaborativeEditorProps {
  code: string
  language: SupportedLanguage
  participants: ParticipantPresence[]
  localClientId?: string
  onChange: (code: string) => void
  onDelta?: (changes: TextChange[]) => void
  onRemoteDelta?: (fn: (payload: EditorDeltaPayload) => void) => (() => void)
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
  onDelta,
  onRemoteDelta,
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
  const onDeltaRef = useRef(onDelta)

  const remoteParticipants = participants.filter(
    (p) => p.connected && p.clientId !== localClientId,
  )

  useEffect(() => { onCursorChangeRef.current = onCursorChange }, [onCursorChange])
  useEffect(() => { onSelectionChangeRef.current = onSelectionChange }, [onSelectionChange])
  useEffect(() => { onDeltaRef.current = onDelta }, [onDelta])

  // Subscribe to remote deltas — apply edits without polluting undo stack
  useEffect(() => {
    if (!onRemoteDelta) return
    const unsubscribe = onRemoteDelta((payload) => {
      const editor = editorRef.current
      const model = editor?.getModel()
      if (!editor || !model) return

      isApplyingExternalCodeRef.current = true
      try {
        // Convert offsets to positions using the local model — safe regardless of document divergence
        const edits = payload.changes.map((c) => {
          const startPos = model.getPositionAt(c.rangeOffset)
          const endPos = model.getPositionAt(c.rangeOffset + c.rangeLength)
          return {
            range: {
              startLineNumber: startPos.lineNumber,
              startColumn: startPos.column,
              endLineNumber: endPos.lineNumber,
              endColumn: endPos.column,
            },
            text: c.text,
          }
        })
        // applyEdits does NOT push to undo stack
        model.applyEdits(edits)

        // Verify result matches server's authoritative code
        if (model.getValue() !== payload.code) {
          // Desync detected — full replacement (still undo-safe via model.applyEdits)
          model.applyEdits([{
            range: model.getFullModelRange(),
            text: payload.code,
          }])
        }
      } finally {
        isApplyingExternalCodeRef.current = false
      }
    })
    return unsubscribe
  }, [onRemoteDelta])

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

    // Capture content changes as deltas for collaborative editing
    editor.onDidChangeModelContent((e) => {
      if (isApplyingExternalCodeRef.current) return
      if (!onDeltaRef.current) return

      const changes: TextChange[] = e.changes.map((c) => ({
        range: {
          startLineNumber: c.range.startLineNumber,
          startColumn: c.range.startColumn,
          endLineNumber: c.range.endLineNumber,
          endColumn: c.range.endColumn,
        },
        text: c.text,
        rangeOffset: c.rangeOffset,
        rangeLength: c.rangeLength,
      }))
      onDeltaRef.current(changes)
    })
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
    // Use model.applyEdits to avoid polluting undo stack with remote changes
    model.applyEdits([{
      range: model.getFullModelRange(),
      text: code,
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
            // When deltas are active, skip full-code emit (deltas handle server communication)
            if (onDeltaRef.current) return
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
