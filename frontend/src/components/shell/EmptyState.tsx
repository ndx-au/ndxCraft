import React from 'react'
import { FolderOpen, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({
  isSre,
  onOpenProject,
  onNewArticle,
}: {
  isSre: boolean
  onOpenProject: () => void
  onNewArticle: () => void
}) {
  return (
    <div className="h-full flex items-center justify-center p-10">
      <div className="max-w-md text-center space-y-4">
        <p className="text-lg font-semibold tracking-tight">ndxCraft</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {isSre
            ? 'Pick an article from the kit tree, or create a new fcms document under ct/.'
            : 'Open a Sentinel SRE (a folder with sentinel.yaml) to author kit content. Generic Markdown folders still work.'}
        </p>
        <div className="flex justify-center gap-2">
          <Button onClick={onOpenProject}><FolderOpen size={16} /> Open project</Button>
          {isSre && <Button variant="secondary" onClick={onNewArticle}><FilePlus size={16} /> New article</Button>}
        </div>
        <p className="text-[11px] text-muted-foreground font-mono">Ctrl+K command palette · Ctrl+P quick open · Ctrl+S save</p>
      </div>
    </div>
  )
}
