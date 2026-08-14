import React from 'react'
import {
  Bold, Italic, Heading, List, ListOrdered, Link, Image, Code, Table,
  Settings, Folder, Undo, Redo, Save, FilePlus, FolderOpen
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Separator } from '@/components/ui/separator'
import { useUiStore } from '@/stores/ui'
import type { CanvasMode } from '@/types'
import { cn } from '@/lib/utils'

interface ToolbarProps {
  onInsert: (template: string) => void
  onOpen: () => void
  onSave: () => void
  onUndo: () => void
  onRedo: () => void
  onNewArticle: () => void
  onProjects: () => void
  onGit: () => void
  gitIcon?: string
  canSite: boolean
}

const modes: { id: CanvasMode; label: string }[] = [
  { id: 'source', label: 'Source' },
  { id: 'visual', label: 'Visual' },
  { id: 'split', label: 'Split' },
  { id: 'site', label: 'Site' },
]

function IconBtn({
  label, onClick, children,
}: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className="h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background cursor-pointer transition-colors duration-150"
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function Toolbar({
  onInsert, onOpen, onSave, onUndo, onRedo, onNewArticle, onProjects, onGit, gitIcon, canSite,
}: ToolbarProps) {
  const canvasMode = useUiStore((s) => s.canvasMode)
  const setCanvasMode = useUiStore((s) => s.setCanvasMode)
  const setPreferencesOpen = useUiStore((s) => s.setPreferencesOpen)

  return (
    <div id="ndx-toolbar" className="h-9 shrink-0 bg-panel border-b border-border flex items-center px-2 gap-1">
      <IconBtn label="Projects" onClick={onProjects}><Folder size={16} /></IconBtn>
      <IconBtn label="New article" onClick={onNewArticle}><FilePlus size={16} /></IconBtn>
      <IconBtn label="Open file" onClick={onOpen}><FolderOpen size={16} /></IconBtn>
      <IconBtn label="Save" onClick={onSave}><Save size={16} /></IconBtn>
      <Separator />
      <IconBtn label="Undo" onClick={onUndo}><Undo size={16} /></IconBtn>
      <IconBtn label="Redo" onClick={onRedo}><Redo size={16} /></IconBtn>
      <Separator />
      <IconBtn label="Heading" onClick={() => onInsert('\n## Heading\n')}><Heading size={16} /></IconBtn>
      <IconBtn label="Bold" onClick={() => onInsert('**bold**')}><Bold size={16} /></IconBtn>
      <IconBtn label="Italic" onClick={() => onInsert('*italic*')}><Italic size={16} /></IconBtn>
      <IconBtn label="Code block" onClick={() => onInsert('\n```\n\n```\n')}><Code size={16} /></IconBtn>
      <IconBtn label="Bulleted list" onClick={() => onInsert('\n- Item\n')}><List size={16} /></IconBtn>
      <IconBtn label="Numbered list" onClick={() => onInsert('\n1. Step\n')}><ListOrdered size={16} /></IconBtn>
      <IconBtn label="Link" onClick={() => onInsert('[text](https://)')}><Link size={16} /></IconBtn>
      <IconBtn label="Image" onClick={() => onInsert('![alt](path)')}><Image size={16} /></IconBtn>
      <IconBtn label="Table" onClick={() => onInsert('\n| A | B |\n| --- | --- |\n|  |  |\n')}><Table size={16} /></IconBtn>

      <div className="flex-1" />

      <div className="flex items-center rounded-md border border-border p-0.5 bg-raised" role="tablist" aria-label="Canvas mode">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            aria-selected={canvasMode === m.id}
            disabled={m.id === 'site' && !canSite}
            onClick={() => setCanvasMode(m.id)}
            className={cn(
              'h-7 px-2.5 text-[11px] font-medium rounded cursor-pointer transition-colors duration-150',
              canvasMode === m.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
              m.id === 'site' && !canSite && 'opacity-40 cursor-not-allowed'
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <IconBtn label="Open git client" onClick={onGit}>
        {gitIcon ? (
          <span className="w-4 h-4 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: gitIcon }} />
        ) : (
          <span className="text-[11px] font-mono">git</span>
        )}
      </IconBtn>
      <IconBtn label="Preferences" onClick={() => setPreferencesOpen(true)}><Settings size={16} /></IconBtn>
    </div>
  )
}
