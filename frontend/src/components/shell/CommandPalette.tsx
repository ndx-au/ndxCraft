import React from 'react'
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command'
import type { ArticleInfo, KitInfo } from '@/types'

interface Action {
  id: string
  label: string
  hint?: string
  run: () => void
}

interface Props {
  open: boolean
  mode: 'command' | 'quick'
  articles: { kit: KitInfo; art: ArticleInfo }[]
  actions: Action[]
  onClose: () => void
  onOpenFile: (path: string) => void
}

export function CommandPalette({ open, mode, articles, actions, onClose, onOpenFile }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-xl rounded-lg border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <Command>
          <CommandInput placeholder={mode === 'quick' ? 'Open article…' : 'Run a command…'} autoFocus />
          <CommandList>
            <CommandEmpty>Nothing found</CommandEmpty>
            {mode === 'quick' ? (
              <CommandGroup heading="Articles">
                {articles.map(({ kit, art }) => (
                  <CommandItem
                    key={art.path}
                    value={`${art.slug} ${art.title} ${kit.dir}`}
                    onSelect={() => {
                      onOpenFile(art.path)
                      onClose()
                    }}
                  >
                    <span className="font-mono text-[11px] text-fcms mr-2">{kit.dir}</span>
                    <span className="truncate">{art.title || art.slug}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandGroup heading="Commands">
                {actions.map((a) => (
                  <CommandItem
                    key={a.id}
                    value={a.label}
                    onSelect={() => {
                      a.run()
                      onClose()
                    }}
                  >
                    <span className="flex-1">{a.label}</span>
                    {a.hint && <span className="text-[11px] text-muted-foreground font-mono">{a.hint}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    </div>
  )
}
