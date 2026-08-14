import React, { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Layers, MoreHorizontal } from 'lucide-react'
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger,
} from '@/components/ui/context-menu'
import type { ArticleInfo, KitInfo } from '@/types'
import { cn } from '@/lib/utils'

interface Props {
  kits: KitInfo[]
  activePath?: string
  gitFiles?: Record<string, string>
  onOpen: (path: string) => void
  onNewArticle: (kit?: KitInfo) => void
  onDuplicate: (path: string) => void
  onCopySlug: (slug: string) => void
  onReveal: (path: string) => void
}

export function KitTree({ kits, activePath, gitFiles, onOpen, onNewArticle, onDuplicate, onCopySlug, onReveal }: Props) {
  if (!kits.length) {
    return <p className="text-xs text-muted-foreground p-3">No kits with a kit.yaml were found.</p>
  }
  return (
    <div className="flex flex-col gap-1">
      {kits.map((kit) => (
        <div key={kit.dir}>
          <KitGroup
            kit={kit}
            activePath={activePath}
            gitFiles={gitFiles}
            onOpen={onOpen}
            onNewArticle={onNewArticle}
            onDuplicate={onDuplicate}
            onCopySlug={onCopySlug}
            onReveal={onReveal}
          />
        </div>
      ))}
    </div>
  )
}

function gitBadge(rootPath: string, filePath: string, files?: Record<string, string>) {
  if (!files) return ''
  const rel = filePath.replace(rootPath.replace(/\\/g, '/') + '/', '').replace(/\\/g, '/')
  return files[rel] || ''
}

function KitGroup(props: {
  kit: KitInfo
  activePath?: string
  gitFiles?: Record<string, string>
  onOpen: (path: string) => void
  onNewArticle: (kit?: KitInfo) => void
  onDuplicate: (path: string) => void
  onCopySlug: (slug: string) => void
  onReveal: (path: string) => void
}) {
  const { kit, activePath, gitFiles, onOpen, onNewArticle, onDuplicate, onCopySlug, onReveal } = props
  const [open, setOpen] = useState(true)
  return (
    <div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer text-left"
          >
            {open ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />}
            <Layers size={14} className="text-fcms" />
            <span className="text-[13px] font-medium truncate flex-1">{kit.displayName || kit.dir}</span>
            <span className="text-[10px] font-mono text-fcms">{kit.dir}</span>
          </button>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onSelect={() => onNewArticle(kit)}>New article…</ContextMenuItem>
          <ContextMenuItem onSelect={() => onReveal(kit.path)}>Reveal kit</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {open && (
        <div className="ml-2 border-l border-border pl-1">
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">Content</div>
          {kit.articles.length === 0 && (
            <button
              type="button"
              onClick={() => onNewArticle(kit)}
              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              No articles — create one
            </button>
          )}
          {kit.articles.map((art) => (
            <div key={art.path}>
              <ArticleRow
                kit={kit}
                art={art}
                active={activePath === art.path}
                dirty={!!gitBadge(kit.path.replace(/\/[^/]+$/, ''), art.path, gitFiles) || !!gitFiles?.[art.relPath]}
                onOpen={onOpen}
                onDuplicate={onDuplicate}
                onCopySlug={onCopySlug}
                onReveal={onReveal}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ArticleRow(props: {
  kit: KitInfo
  art: ArticleInfo
  active: boolean
  dirty: boolean
  onOpen: (path: string) => void
  onDuplicate: (path: string) => void
  onCopySlug: (slug: string) => void
  onReveal: (path: string) => void
}) {
  const { kit, art, active, dirty, onOpen, onDuplicate, onCopySlug, onReveal } = props
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          onClick={() => onOpen(art.path)}
          className={cn(
            'w-full flex items-center gap-1.5 px-2 py-1 rounded-md text-left cursor-pointer',
            active ? 'bg-accent text-foreground' : 'hover:bg-accent/60 text-foreground/90'
          )}
        >
          <FileText size={13} className="text-muted-foreground shrink-0" />
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] truncate">{art.title || art.slug}</span>
            <span className="block text-[10px] font-mono text-muted-foreground truncate">{art.slug}</span>
          </span>
          {dirty && <span className="w-1.5 h-1.5 rounded-full bg-dirty shrink-0" aria-label="Modified in git" />}
          <MoreHorizontal size={12} className="opacity-0 group-hover:opacity-100 text-muted-foreground" />
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onSelect={() => onOpen(art.path)}>Open</ContextMenuItem>
        <ContextMenuItem onSelect={() => onCopySlug(art.slug)}>Copy slug</ContextMenuItem>
        <ContextMenuItem onSelect={() => navigator.clipboard.writeText(`/fcms/${kit.ns}/${kit.name}/${art.slug}`)}>
          Copy /fcms path
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onSelect={() => onDuplicate(art.path)}>Duplicate</ContextMenuItem>
        <ContextMenuItem onSelect={() => onReveal(art.path)}>Reveal in file manager</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
