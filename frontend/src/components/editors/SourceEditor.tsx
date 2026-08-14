import React, { useRef, useImperativeHandle, forwardRef, useEffect } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import MonacoEditor, { OnMount } from '@monaco-editor/react'
import type { ThemeMode } from '@/types'

export interface SourceEditorHandle {
  focus: () => void
  setCursor: (line: number, col: number) => void
  insertText: (text: string) => void
  setValue: (text: string) => void
  getValue: () => string
  getSelection: () => string
  undo: () => void
  redo: () => void
}

interface Props {
  defaultValue: string
  onChange: (val: string) => void
  isFocused: boolean
  onToggleFocus: () => void
  onCursorChange?: (line: number) => void
  theme: ThemeMode
}

const SourceEditor = forwardRef<SourceEditorHandle, Props>(({
  defaultValue, onChange, isFocused, onToggleFocus, onCursorChange, theme,
}, ref) => {
  const editorRef = useRef<any>(null)
  const onCursorChangeRef = useRef(onCursorChange)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onCursorChangeRef.current = onCursorChange
    onChangeRef.current = onChange
  })

  const options = React.useMemo(() => ({
    minimap: { enabled: true, scale: 1 },
    wordWrap: 'on' as const,
    lineNumbers: 'on' as const,
    tabSize: 2,
    insertSpaces: true,
    scrollBeyondLastLine: false,
    fontSize: 14,
    fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    renderLineHighlight: 'line' as const,
  }), [])

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.focus(),
    setCursor: (line, col) => {
      editorRef.current?.setPosition({ lineNumber: line, column: col })
      editorRef.current?.revealPosition({ lineNumber: line, column: col })
    },
    insertText: (text) => {
      const editor = editorRef.current
      if (!editor) return
      const selection = editor.getSelection()
      editor.executeEdits('ndxcraft', [{ range: selection, text, forceMoveMarkers: true }])
    },
    setValue: (text) => editorRef.current?.setValue(text),
    getValue: () => editorRef.current?.getValue() ?? '',
    getSelection: () => {
      const editor = editorRef.current
      if (!editor) return ''
      return editor.getModel().getValueInRange(editor.getSelection())
    },
    undo: () => editorRef.current?.trigger('api', 'undo', null),
    redo: () => editorRef.current?.trigger('api', 'redo', null),
  }))

  const handleMount: OnMount = React.useCallback((editor, monaco) => {
    editorRef.current = editor
    monaco.editor.defineTheme('ndx-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'E8EEF5' },
        { token: 'comment', foreground: '8B9BB0', fontStyle: 'italic' },
        { token: 'keyword', foreground: '3DD6F5' },
        { token: 'string', foreground: 'C9B99A' },
      ],
      colors: {
        'editor.background': '#0B0F14',
        'editor.foreground': '#E8EEF5',
        'editor.lineHighlightBackground': '#12171F',
        'editorCursor.foreground': '#3DD6F5',
        'editorLineNumber.foreground': '#5C6773',
        'editor.selectionBackground': '#1A222C',
      },
    })
    monaco.editor.defineTheme('ndx-light', {
      base: 'vs',
      inherit: true,
      rules: [{ token: '', foreground: '1A1F27' }],
      colors: {
        'editor.background': '#F7F6F3',
        'editor.foreground': '#1A1F27',
        'editor.lineHighlightBackground': '#EFECE6',
        'editorCursor.foreground': '#0E8AA8',
      },
    })
    monaco.editor.setTheme(theme === 'light' ? 'ndx-light' : 'ndx-dark')
    editor.onDidChangeCursorPosition((e) => onCursorChangeRef.current?.(e.position.lineNumber))
  }, [theme])

  useEffect(() => {
    const monaco = (window as any).monaco
    monaco?.editor?.setTheme(theme === 'light' ? 'ndx-light' : 'ndx-dark')
  }, [theme])

  return (
    <div id="ndx-editor-container" className="relative h-full w-full bg-app">
      <button
        type="button"
        aria-label={isFocused ? 'Exit source fullscreen' : 'Source fullscreen'}
        onClick={onToggleFocus}
        className="absolute top-2 right-3 z-10 h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground bg-panel/80 hover:bg-raised cursor-pointer"
      >
        {isFocused ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
      </button>
      <MonacoEditor
        height="100%"
        language="markdown"
        theme={theme === 'light' ? 'ndx-light' : 'ndx-dark'}
        defaultValue={defaultValue}
        onChange={(v) => onChangeRef.current(v || '')}
        onMount={handleMount}
        options={options}
      />
    </div>
  )
})

SourceEditor.displayName = 'SourceEditor'
export default SourceEditor
