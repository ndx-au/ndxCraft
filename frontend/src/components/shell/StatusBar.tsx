import React from 'react'
import { cn } from '@/lib/utils'

interface StatusBarProps {
  kitDir?: string
  slug?: string
  chars: number
  lines: number
  words: number
  diagnosticCount: number
  harnessState: string
  harnessMessage: string
  gitBranch?: string
  gitDirty?: number
  geminiOk: boolean
}

export function StatusBar({
  kitDir, slug, chars, lines, words, diagnosticCount,
  harnessState, harnessMessage, gitBranch, gitDirty, geminiOk,
}: StatusBarProps) {
  const harnessColor =
    harnessState === 'matched' ? 'text-ok' :
    harnessState === 'mismatched' ? 'text-dirty' : 'text-muted-foreground'

  return (
    <footer
      id="ndx-status-bar"
      className="h-7 shrink-0 bg-raised border-t border-border flex items-center px-3 text-[11px] text-muted-foreground gap-3 select-none"
    >
      <span className="truncate max-w-[280px]">
        {kitDir ? <span className="text-fcms font-medium">{kitDir}</span> : 'folder'}
        {slug ? <span> · {slug}</span> : null}
      </span>
      <span>{words} words</span>
      <span>{lines} lines</span>
      <span>{chars} chars</span>
      <span className={cn(diagnosticCount ? 'text-dirty' : '')}>
        {diagnosticCount} {diagnosticCount === 1 ? 'issue' : 'issues'}
      </span>
      <span className="flex-1" />
      <span className={harnessColor} title={harnessMessage}>
        harness: {harnessState}
      </span>
      {gitBranch && (
        <span title={`${gitDirty || 0} dirty files`}>
          {gitBranch}{gitDirty ? ` · ${gitDirty}` : ''}
        </span>
      )}
      <span className={geminiOk ? 'text-ok' : 'text-muted-foreground'} title={geminiOk ? 'Gemini key present' : 'GEMINI_API_KEY not set'}>
        AI {geminiOk ? 'ready' : 'offline'}
      </span>
    </footer>
  )
}
