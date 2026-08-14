import React, { useState } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SearchContent } from '../../../wailsjs/go/main/App'
import type { sre } from '../../../wailsjs/go/models'

interface Props {
  root: string
  onOpen: (path: string, line?: number) => void
}

export function SearchPanel({ root, onOpen }: Props) {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<sre.SearchHit[]>([])
  const [busy, setBusy] = useState(false)

  const run = async (value: string) => {
    setQ(value)
    if (!root || value.trim().length < 2) {
      setHits([])
      return
    }
    setBusy(true)
    try {
      const res = await SearchContent(root, value.trim())
      setHits(res || [])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-2">
        <div className="relative">
          <Search size={14} className="absolute left-2 top-2.5 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => run(e.target.value)}
            placeholder="Search content…"
            className="pl-7 h-8"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {busy && <p className="text-xs text-muted-foreground p-2">Searching…</p>}
        {!busy && q.length >= 2 && hits.length === 0 && (
          <p className="text-xs text-muted-foreground p-2">No matches</p>
        )}
        {hits.map((h, i) => (
          <button
            key={`${h.path}-${h.line}-${i}`}
            type="button"
            onClick={() => onOpen(h.path, h.line)}
            className="w-full text-left rounded-md px-2 py-1.5 hover:bg-accent cursor-pointer"
          >
            <div className="text-[12px] truncate">{h.title || h.slug}</div>
            <div className="text-[10px] font-mono text-muted-foreground truncate">{h.kit} {h.slug}:{h.line}</div>
            <div className="text-[11px] text-muted-foreground truncate">{h.excerpt}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
