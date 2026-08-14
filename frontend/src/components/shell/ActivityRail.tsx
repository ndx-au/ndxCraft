import React from 'react'
import { Files, ListTree, Search, AlertCircle, PanelRight } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUiStore } from '@/stores/ui'
import type { SidebarTab } from '@/types'
import { cn } from '@/lib/utils'

const items: { id: SidebarTab; label: string; icon: typeof Files }[] = [
  { id: 'files', label: 'Files', icon: Files },
  { id: 'outline', label: 'Outline', icon: ListTree },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'diagnostics', label: 'Diagnostics', icon: AlertCircle },
]

export function ActivityRail({ diagnosticCount }: { diagnosticCount: number }) {
  const tab = useUiStore((s) => s.sidebarTab)
  const setTab = useUiStore((s) => s.setSidebarTab)
  const inspectorOpen = useUiStore((s) => s.inspectorOpen)
  const setInspectorOpen = useUiStore((s) => s.setInspectorOpen)

  return (
    <nav
      id="ndx-activity-rail"
      className="w-10 shrink-0 bg-raised border-r border-border flex flex-col items-center py-2 gap-1"
      aria-label="Workspace"
    >
      {items.map(({ id, label, icon: Icon }) => (
        <Tooltip key={id}>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={label}
              aria-pressed={tab === id}
              onClick={() => setTab(id)}
              className={cn(
                'relative w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-colors duration-150',
                tab === id
                  ? 'bg-background text-fcms'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              )}
            >
              <Icon size={16} />
              {id === 'diagnostics' && diagnosticCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-3.5 h-3.5 px-0.5 rounded-full bg-dirty text-[9px] text-background font-semibold leading-[14px] text-center">
                  {diagnosticCount > 9 ? '9+' : diagnosticCount}
                </span>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{label}</TooltipContent>
        </Tooltip>
      ))}
      <div className="flex-1" />
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label="Toggle inspector"
            aria-pressed={inspectorOpen}
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className={cn(
              'w-8 h-8 rounded-md flex items-center justify-center cursor-pointer transition-colors duration-150',
              inspectorOpen ? 'text-fcms' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <PanelRight size={16} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">Inspector</TooltipContent>
      </Tooltip>
    </nav>
  )
}
