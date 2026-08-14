import React from 'react'
import { Circle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TitlebarProps {
  projectName: string
  isSre: boolean
  kitDir?: string
  slug?: string
  fileName: string
  isDirty: boolean
}

export function Titlebar({ projectName, isSre, kitDir, slug, fileName, isDirty }: TitlebarProps) {
  const crumb = kitDir && slug ? `${kitDir} / ${slug}` : fileName
  return (
    <header
      id="ndx-titlebar"
      className="h-9 shrink-0 bg-raised border-b border-border flex items-center px-3 gap-3 select-none"
    >
      <span className="text-[13px] font-semibold tracking-tight">ndxCraft</span>
      <span className="h-4 w-px bg-border" />
      <span className="text-[12px] text-muted-foreground truncate">
        {projectName || 'No project'}
        {isSre && <span className="ml-1.5 text-fcms font-medium">SRE</span>}
      </span>
      <span className="h-4 w-px bg-border" />
      <button
        type="button"
        className="flex items-center gap-2 min-w-0 cursor-default"
        title={fileName}
      >
        {isDirty && (
          <Circle size={8} className="fill-dirty text-dirty shrink-0" aria-label="Unsaved changes" />
        )}
        <span className={cn('text-[12px] truncate max-w-[420px]', isDirty ? 'text-dirty' : 'text-foreground/80')}>
          {crumb}
        </span>
      </button>
    </header>
  )
}
