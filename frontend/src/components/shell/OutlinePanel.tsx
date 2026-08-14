import React, { useState } from 'react'
import { Folder } from 'lucide-react'
import { FileNode } from '../../types'
import { parseBlocks, reorderBlocks, SectionBlock } from '../../services/structureService'
import StructureAST from '../StructureAST'
import FileTree from '../FileTree'
import { Reorder } from 'framer-motion'
import { Switch } from '../ui/switch'
import { Label } from '../ui/label'
import { GripVertical } from 'lucide-react'

interface Props {
  content: string
  onContentChange: (newContent: string) => void
  onNavigate?: (line: number) => void
}

export function OutlinePanel({ content, onContentChange, onNavigate }: Props) {
  const [useAst, setUseAst] = useState(false)
  const [items, setItems] = useState<(SectionBlock & { id: string })[]>([])
  const [isDragging, setIsDragging] = useState(false)

  React.useEffect(() => {
    if (isDragging) return
    const parsed = parseBlocks(content)
    setItems(parsed.map((b, idx) => ({ ...b, id: `${idx}-${b.title}-${b.level}` })))
  }, [content, isDragging])

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="flex items-center justify-between px-2 py-2 rounded-md bg-raised border border-border">
        <span className="text-xs text-muted-foreground">View</span>
        <div className="flex items-center gap-2">
          <Label className="text-xs">Blocks</Label>
          <Switch checked={useAst} onCheckedChange={setUseAst} />
          <Label className="text-xs">AST</Label>
        </div>
      </div>
      {useAst ? (
        <StructureAST content={content} onNodeClick={onNavigate} />
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={setItems}
          className="flex flex-col gap-1"
        >
          {items.map((item) => (
            <Reorder.Item
              key={item.id}
              value={item}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => {
                setIsDragging(false)
                onContentChange(reorderBlocks(items))
              }}
              onClick={() => onNavigate?.(item.startLine)}
              className="flex items-center gap-2 p-2 rounded-md bg-raised hover:bg-accent cursor-grab active:cursor-grabbing"
            >
              <GripVertical size={14} className="text-muted-foreground" />
              <span className="flex-1 text-sm truncate" style={{ paddingLeft: Math.max(0, (item.level - 1) * 10) }}>
                {item.level === 0 ? <span className="italic text-muted-foreground">Preamble</span> : item.title}
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">{item.level > 0 ? `H${item.level}` : 'PRE'}</span>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  )
}

export function FilesFallback({ fileTree, onFileClick }: { fileTree: FileNode[]; onFileClick: (path: string) => void }) {
  return (
    <div className="p-2">
      <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-1">
        <Folder size={12} /> Project files
      </div>
      <FileTree nodes={fileTree} onFileClick={onFileClick} />
    </div>
  )
}
