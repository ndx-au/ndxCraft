import React from 'react'
import type { Diagnostic } from '@/types'
import { cn } from '@/lib/utils'

export function DiagnosticsPanel({ items, onNavigate }: { items: Diagnostic[]; onNavigate?: (line: number) => void }) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground p-3">No issues in the current document.</p>
  }
  return (
    <ul className="p-2 space-y-1">
      {items.map((d) => (
        <li key={d.id}>
          <button
            type="button"
            onClick={() => d.line && onNavigate?.(d.line)}
            className={cn(
              'w-full text-left rounded-md px-2 py-1.5 text-[12px] cursor-pointer hover:bg-accent',
              d.severity === 'error' ? 'text-destructive' : 'text-dirty'
            )}
          >
            <span className="uppercase text-[10px] tracking-wide mr-2">{d.severity}</span>
            {d.message}
          </button>
        </li>
      ))}
    </ul>
  )
}
